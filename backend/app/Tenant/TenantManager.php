<?php

namespace App\Tenant;

use App\Models\Tenant;

class TenantManager
{
    protected static ?Tenant $tenant = null;

    public static function setTenant(Tenant $tenant): void
    {
        self::$tenant = $tenant;
    }

    public static function getTenant(): ?Tenant
    {
        return self::$tenant;
    }

    public static function getTenantId(): ?string
    {
        return self::$tenant?->id;
    }

    public static function isResolved(): bool
    {
        return self::$tenant !== null;
    }

    public static function clear(): void
    {
        self::$tenant = null;
    }
}
