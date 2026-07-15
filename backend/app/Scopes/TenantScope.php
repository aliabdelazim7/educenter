<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use App\Tenant\TenantManager;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (TenantManager::isResolved()) {
            $builder->where($model->getTable() . '.tenant_id', TenantManager::getTenantId());
        }
    }
}
