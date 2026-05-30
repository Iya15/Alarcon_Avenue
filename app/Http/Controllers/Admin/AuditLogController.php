<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $logs = AuditLog::with('user:id,name,email')
            ->when($request->input('search'), fn ($q, $s) =>
                $q->where('auditable_type', 'ilike', "%{$s}%")
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'ilike', "%{$s}%")
                      ->orWhere('email', 'ilike', "%{$s}%"))
            )
            ->when($request->input('event'), fn ($q, $e) => $q->where('event', $e))
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn ($l) => [
                'id'             => $l->id,
                'event'          => $l->event,
                'auditable_type' => class_basename($l->auditable_type),
                'auditable_id'   => $l->auditable_id,
                'old_values'     => $l->old_values,
                'new_values'     => $l->new_values,
                'ip_address'     => $l->ip_address,
                'created_at'     => $l->created_at?->toISOString(),
                'user'           => $l->user ? ['id' => $l->user->id, 'name' => $l->user->name, 'email' => $l->user->email] : null,
            ]);

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs'    => $logs,
            'filters' => $request->only('search', 'event'),
        ]);
    }
}
