<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    /**
     * Log a user administrative activity.
     */
    public static function log(string $action, ?string $modelType = null, ?string $modelId = null, ?array $payload = null): AuditLog
    {
        return AuditLog::create([
            'user_id' => Auth::id() ?? User::first()->id, // fallback for seeding or system actions
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'payload' => $payload,
            'ip_address' => request()->ip(),
        ]);
    }
}
