<?php

namespace App\Actions\Payment;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\User;
use App\Services\Payment\PaymentGatewayManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcessRefundAction
{
    public function __construct(private readonly PaymentGatewayManager $manager) {}

    public function execute(
        Order   $order,
        Payment $payment,
        int     $amountCents,
        ?string $reason,
        User    $admin,
    ): Refund {
        $gateway = $this->manager->for($payment->gateway);
        $result  = $gateway->refund($payment, $amountCents);

        if (! $result->success) {
            throw ValidationException::withMessages([
                'refund' => $result->error ?? 'Refund failed at the payment provider.',
            ]);
        }

        return DB::transaction(function () use ($order, $payment, $amountCents, $reason, $admin, $result) {
            // Create the detailed Refund record
            $refund = Refund::create([
                'order_id'     => $order->id,
                'payment_id'   => $payment->id,
                'refunded_by'  => $admin->id,
                'reason'       => $reason,
                'total_cents'  => $amountCents,
                'status'       => 'processed',
                'processed_at' => now(),
            ]);

            // Create a Payment row of type 'refund' for the transaction history view
            Payment::create([
                'order_id'                  => $order->id,
                'type'                      => Payment::TYPE_REFUND,
                'gateway'                   => $payment->gateway,
                'gateway_transaction_id'    => $result->refundId,
                'amount_cents'              => $amountCents,
                'currency'                  => $payment->currency,
                'status'                    => 'refunded',
                'method'                    => $payment->method,
                'refunded_at'               => now(),
            ]);

            // Mark original payment as refunded
            $payment->update(['refunded_at' => now()]);

            // Determine order status
            $totalRefunded = $order->refunds()->sum('total_cents');
            $newStatus = $totalRefunded >= $order->total_cents
                ? OrderStatus::Refunded
                : OrderStatus::PartiallyRefunded;

            $order->update(['status' => $newStatus]);

            return $refund;
        });
    }
}
