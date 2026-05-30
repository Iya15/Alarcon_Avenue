<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Writes create/update/delete actions by admin/staff actors to audit_logs.
 * Uses model Observers rather than spatie/laravel-activitylog to avoid an
 * additional dependency — the audit_logs table was already scaffolded.
 */
class AdminAuditObserver
{
    public function created(Model $model): void
    {
        $this->log('created', $model, [], $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $this->log('updated', $model, $model->getOriginal(), $model->getChanges());
    }

    public function deleted(Model $model): void
    {
        $this->log('deleted', $model, $model->getAttributes(), []);
    }

    private function log(string $event, Model $model, array $oldValues, array $newValues): void
    {
        $actor = Auth::id();

        // Only audit actions performed by authenticated users (admin / staff).
        // Guest-triggered model mutations (e.g. order placed by guest) are skipped.
        if (! $actor) {
            return;
        }

        AuditLog::create([
            'user_id'        => $actor,
            'event'          => $event,
            'auditable_type' => get_class($model),
            'auditable_id'   => $model->getKey(),
            'old_values'     => $oldValues ?: null,
            'new_values'     => $newValues ?: null,
            'url'            => Request::fullUrl(),
            'ip_address'     => Request::ip(),
            'user_agent'     => Request::userAgent(),
            'created_at'     => now(),
        ]);
    }
}
