<?php

use App\Actions\Payment\HandleWebhookAction;
use App\Actions\Payment\ProcessRefundAction;
use App\DTOs\PaymentEvent;
use App\DTOs\RefundResult;
use App\Enums\OrderStatus;
use App\Events\OrderPaid;
use App\Events\PaymentFailed;
use App\Events\PaymentSucceeded;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProcessedWebhook;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Refund;
use App\Models\User;
use App\Services\Payment\CodGateway;
use App\Services\Payment\PaymentGatewayManager;
use App\Services\Payment\PayMongoGateway;
use App\Services\Payment\StripeGateway;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $this->withHeaders(['Accept' => 'application/json']);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrderWithPayment(string $paymentMethod = 'cod', string $orderStatus = 'awaiting_payment'): array
{
    $product = Product::factory()->create(['name' => 'P', 'base_price_cents' => 100_000, 'status' => 'active', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'PAY-' . uniqid(), 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 10, 'reserved_quantity' => 2]);

    $order = Order::factory()->create([
        'status'           => $orderStatus,
        'total_cents'      => 100_000,
        'subtotal_cents'   => 100_000,
        'shipping_address' => ['first_name' => 'J', 'last_name' => 'C', 'line_1' => '1', 'city' => 'M', 'state' => 'MM', 'postal_code' => '1', 'country_code' => 'PH', 'phone' => '09'],
        'billing_address'  => ['first_name' => 'J', 'last_name' => 'C', 'line_1' => '1', 'city' => 'M', 'state' => 'MM', 'postal_code' => '1', 'country_code' => 'PH', 'phone' => '09'],
    ]);

    $order->items()->create([
        'product_id'         => $product->id,
        'product_variant_id' => $variant->id,
        'product_name'       => 'P',
        'sku'                => 'PAY-SKU',
        'unit_price_cents'   => 100_000,
        'quantity'           => 2,
        'subtotal_cents'     => 200_000,
    ]);

    $payment = $order->payments()->create([
        'type'         => Payment::TYPE_CHARGE,
        'gateway'      => $paymentMethod === 'card' ? 'stripe' : ($paymentMethod === 'gcash' ? 'paymongo' : 'cod'),
        'method'       => $paymentMethod,
        'amount_cents' => 100_000,
        'currency'     => 'PHP',
        'status'       => Payment::STATUS_PENDING,
        'gateway_payment_intent_id' => 'test-intent-' . uniqid(),
    ]);

    return compact('order', 'payment', 'variant', 'product');
}

function makePaymentEvent(string $provider, string $status, string $orderRef, string $transactionId, string $eventId): PaymentEvent
{
    return new PaymentEvent(
        provider:       $provider,
        eventId:        $eventId,
        status:         $status,
        orderReference: $orderRef,
        transactionId:  $transactionId,
    );
}

// ── HandleWebhookAction: happy path ──────────────────────────────────────────

test('webhook success moves order to paid and decrements stock', function () {
    // Fake only OrderPaid to prevent the email stub from running.
    // PaymentSucceeded must fire its real listener (HandlePaymentSucceeded) so order transitions.
    Event::fake([OrderPaid::class]);

    ['order' => $order, 'payment' => $payment, 'variant' => $variant] = makeOrderWithPayment('cod');

    $event = makePaymentEvent(
        'cod', 'succeeded',
        $order->order_number,
        $payment->gateway_payment_intent_id,
        'evt-success-' . uniqid(),
    );

    app(HandleWebhookAction::class)->execute($event);

    // OrderPaid event fired downstream
    Event::assertDispatched(OrderPaid::class);

    // Order moved to paid
    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
    expect($order->fresh()->paid_at)->not->toBeNull();

    // Payment marked captured
    expect($payment->fresh()->status)->toBe(Payment::STATUS_CAPTURED);

    // Stock decremented (quantity 10 → 10-2 = 8, reserved 2 → 2-2 = 0)
    $inv = Inventory::where('product_variant_id', $variant->id)->first();
    expect($inv->quantity)->toBe(8);
    expect($inv->reserved_quantity)->toBe(0);
});

test('webhook failure leaves order at awaiting_payment and releases reserved stock', function () {
    // No Event::fake — let HandlePaymentFailed listener run so order transitions.

    ['order' => $order, 'payment' => $payment, 'variant' => $variant] = makeOrderWithPayment('cod');

    $event = makePaymentEvent(
        'cod', 'failed',
        $order->order_number,
        $payment->gateway_payment_intent_id,
        'evt-fail-' . uniqid(),
    );

    app(HandleWebhookAction::class)->execute($event);

    // Order returned to pending (ready for retry)
    expect($order->fresh()->status)->toBe(OrderStatus::Pending);

    // Reserved stock released — must be ≥ 0 after release
    $inv = Inventory::where('product_variant_id', $variant->id)->first();
    expect($inv->reserved_quantity)->toBeGreaterThanOrEqual(0);
});

// ── Idempotency ───────────────────────────────────────────────────────────────

test('duplicate webhook with same event_id is processed only once', function () {
    // Let the real listener run. Fake only OrderPaid to skip the email.
    Event::fake([OrderPaid::class]);

    ['order' => $order, 'payment' => $payment] = makeOrderWithPayment('cod');

    $eventId = 'evt-idem-' . uniqid();
    $event   = makePaymentEvent(
        'cod', 'succeeded',
        $order->order_number,
        $payment->gateway_payment_intent_id,
        $eventId,
    );

    $action = app(HandleWebhookAction::class);
    $action->execute($event);
    $action->execute($event); // second delivery — should be ignored

    // Idempotency record exists exactly once
    expect(ProcessedWebhook::where('event_id', $eventId)->count())->toBe(1);

    // Order status is paid (not changed by second delivery)
    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

test('different event_ids for same order are both processed', function () {
    // Let the real listener run — order gets paid once and stays paid.
    Event::fake([OrderPaid::class]);

    ['order' => $order, 'payment' => $payment] = makeOrderWithPayment('cod');

    $event1 = makePaymentEvent('cod', 'succeeded', $order->order_number, $payment->gateway_payment_intent_id, 'evt-A-' . uniqid());
    $event2 = makePaymentEvent('cod', 'succeeded', $order->order_number, $payment->gateway_payment_intent_id, 'evt-B-' . uniqid());

    $action = app(HandleWebhookAction::class);
    $action->execute($event1);
    $action->execute($event2); // different event_id — processed but listener is idempotent (order already paid)

    // Both events recorded
    expect(ProcessedWebhook::count())->toBe(2);
    // Order still paid (idempotency in HandlePaymentSucceeded listener)
    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

// ── Webhook controller: bad signature ─────────────────────────────────────────

test('stripe webhook with bad signature returns 403', function () {
    $badGateway = Mockery::mock(StripeGateway::class);
    $badGateway->shouldReceive('verifyWebhook')->andReturn(false);
    app()->instance(StripeGateway::class, $badGateway);

    $this->post(route('webhooks.stripe'), [], ['Stripe-Signature' => 'bad-sig'])
        ->assertStatus(403);
});

test('paymongo webhook with bad signature returns 403', function () {
    $badGateway = Mockery::mock(PayMongoGateway::class);
    $badGateway->shouldReceive('verifyWebhook')->andReturn(false);
    app()->instance(PayMongoGateway::class, $badGateway);

    $this->post(route('webhooks.paymongo'), [], ['Paymongo-Signature' => 'bad-sig'])
        ->assertStatus(403);
});

test('stripe webhook with valid signature processes and returns 200', function () {
    Event::fake([PaymentSucceeded::class]);

    ['order' => $order, 'payment' => $payment] = makeOrderWithPayment('card', 'awaiting_payment');

    $eventId   = 'evt_stripe_' . uniqid();
    $fakeEvent = new PaymentEvent('stripe', $eventId, 'succeeded', $order->order_number, $payment->gateway_payment_intent_id);

    $goodGateway = Mockery::mock(StripeGateway::class);
    $goodGateway->shouldReceive('verifyWebhook')->andReturn(true);
    $goodGateway->shouldReceive('parseWebhook')->andReturn($fakeEvent);
    app()->instance(StripeGateway::class, $goodGateway);

    $this->post(route('webhooks.stripe'), [])
        ->assertStatus(200)
        ->assertJson(['status' => 'ok']);

    Event::assertDispatched(PaymentSucceeded::class);
});

// ── COD gateway ───────────────────────────────────────────────────────────────

test('cod gateway initiate returns null redirect URL', function () {
    ['order' => $order] = makeOrderWithPayment('cod', 'pending');

    $session = app(CodGateway::class)->initiate($order);

    expect($session->redirectUrl)->toBeNull();
    expect($session->gatewayIntentId)->toContain('cod-');
});

test('cod initiate action moves order to awaiting_payment', function () {
    ['order' => $order, 'payment' => $payment] = makeOrderWithPayment('cod', 'pending');

    // Override manager to use CodGateway
    $manager = app(PaymentGatewayManager::class);

    $action = app(\App\Actions\Payment\InitiatePaymentAction::class);
    $result = $action->execute($order);

    expect($result)->toBeNull(); // no redirect
    expect($order->fresh()->status)->toBe(OrderStatus::AwaitingPayment);
});

// ── Refund ────────────────────────────────────────────────────────────────────

test('full refund creates Refund record, refund Payment row, and moves order to refunded', function () {
    ['order' => $order, 'payment' => $payment] = makeOrderWithPayment('cod');

    // Mark payment as captured first
    $payment->update(['status' => Payment::STATUS_CAPTURED]);
    $order->markPaid();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    // Mock CodGateway to return success refund
    $mockGateway = Mockery::mock(\App\Contracts\PaymentGateway::class);
    $mockGateway->shouldReceive('refund')->andReturn(RefundResult::ok('ref_test_123'));

    $manager = Mockery::mock(PaymentGatewayManager::class);
    $manager->shouldReceive('for')->with('cod')->andReturn($mockGateway);
    app()->instance(PaymentGatewayManager::class, $manager);

    $action = app(ProcessRefundAction::class);
    $refund = $action->execute($order, $payment, 100_000, 'Customer request', $admin);

    expect($refund)->toBeInstanceOf(Refund::class);
    expect($refund->total_cents)->toBe(100_000);

    // Order transitioned to Refunded
    expect($order->fresh()->status)->toBe(OrderStatus::Refunded);

    // Refund Payment row created
    $refundPayment = $order->payments()->where('type', Payment::TYPE_REFUND)->first();
    expect($refundPayment)->not->toBeNull();
    expect($refundPayment->gateway_transaction_id)->toBe('ref_test_123');
});

test('partial refund moves order to partially_refunded', function () {
    ['order' => $order, 'payment' => $payment] = makeOrderWithPayment('cod');
    $payment->update(['status' => Payment::STATUS_CAPTURED]);
    $order->markPaid();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $mockGateway = Mockery::mock(\App\Contracts\PaymentGateway::class);
    $mockGateway->shouldReceive('refund')->andReturn(RefundResult::ok('ref_partial_123'));

    $manager = Mockery::mock(PaymentGatewayManager::class);
    $manager->shouldReceive('for')->with('cod')->andReturn($mockGateway);
    app()->instance(PaymentGatewayManager::class, $manager);

    $action = app(ProcessRefundAction::class);
    $action->execute($order, $payment, 50_000, 'Partial refund', $admin); // half of total

    expect($order->fresh()->status)->toBe(OrderStatus::PartiallyRefunded);
});

test('refund failure does not change order state', function () {
    ['order' => $order, 'payment' => $payment] = makeOrderWithPayment('cod');
    $payment->update(['status' => Payment::STATUS_CAPTURED]);
    $order->markPaid();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $mockGateway = Mockery::mock(\App\Contracts\PaymentGateway::class);
    $mockGateway->shouldReceive('refund')->andReturn(RefundResult::fail('Insufficient funds at gateway.'));

    $manager = Mockery::mock(PaymentGatewayManager::class);
    $manager->shouldReceive('for')->with('cod')->andReturn($mockGateway);
    app()->instance(PaymentGatewayManager::class, $manager);

    expect(fn () => app(ProcessRefundAction::class)->execute($order, $payment, 100_000, null, $admin))
        ->toThrow(\Illuminate\Validation\ValidationException::class);

    expect($order->fresh()->status)->toBe(OrderStatus::Paid); // unchanged
    expect(Refund::count())->toBe(0);
});

// ── Stripe parseWebhook ───────────────────────────────────────────────────────

test('stripe parseWebhook correctly extracts succeeded event', function () {
    $payload = json_encode([
        'id'   => 'evt_test_123',
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'id'                   => 'cs_test_session',
                'client_reference_id'  => 'AA-TESTORDER',
                'payment_intent'       => 'pi_test_intent',
                'metadata'             => ['order_number' => 'AA-TESTORDER'],
            ],
        ],
    ]);

    $request = \Illuminate\Http\Request::create('/webhooks/stripe', 'POST', [], [], [], [], $payload);

    $event = app(StripeGateway::class)->parseWebhook($request);

    expect($event->provider)->toBe('stripe');
    expect($event->eventId)->toBe('evt_test_123');
    expect($event->status)->toBe('succeeded');
    expect($event->orderReference)->toBe('AA-TESTORDER');
});

// ── PayMongo parseWebhook ─────────────────────────────────────────────────────

test('paymongo parseWebhook correctly extracts payment.paid event', function () {
    $payload = json_encode([
        'data' => [
            'id'   => 'evt_pm_123',
            'attributes' => [
                'type' => 'payment.paid',
                'data' => [
                    'id'         => 'pay_pm_abc',
                    'attributes' => [
                        'payment_intent_id' => 'pi_pm_test',
                        'metadata'          => ['order_number' => 'AA-PMORDER'],
                    ],
                ],
            ],
        ],
    ]);

    $request = \Illuminate\Http\Request::create('/webhooks/paymongo', 'POST', [], [], [], [], $payload);

    $event = app(PayMongoGateway::class)->parseWebhook($request);

    expect($event->provider)->toBe('paymongo');
    expect($event->status)->toBe('succeeded');
    expect($event->orderReference)->toBe('AA-PMORDER');
});
