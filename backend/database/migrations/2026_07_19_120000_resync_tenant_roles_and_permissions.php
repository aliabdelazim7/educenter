<?php

use App\Actions\InitializeTenantRBACAction;
use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;

/**
 * Role definitions are applied when a tenant is created, so tightening them in
 * InitializeTenantRBACAction leaves existing tenants on the old grants. Students
 * and parents kept 'view students' / 'view financial', which now that routes are
 * permission-gated meant a parent could read the roster, ledger and analytics.
 *
 * The action uses findOrCreate + syncPermissions, so replaying it is idempotent.
 */
return new class extends Migration
{
    public function up(): void
    {
        $action = app(InitializeTenantRBACAction::class);

        Tenant::query()->each(function (Tenant $tenant) use ($action) {
            $action->execute($tenant);
        });
    }

    public function down(): void
    {
        // Role grants are declarative; there is no meaningful rollback.
    }
};
