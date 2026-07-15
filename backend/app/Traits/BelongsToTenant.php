<?php

namespace App\Traits;

use App\Models\Tenant;
use App\Scopes\TenantScope;
use App\Tenant\TenantManager;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        // Automatically apply the TenantScope to all queries
        static::addGlobalScope(new TenantScope());

        // Automatically set the tenant_id on model creation
        static::creating(function ($model) {
            if (TenantManager::isResolved() && !$model->tenant_id) {
                $model->tenant_id = TenantManager::getTenantId();
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
