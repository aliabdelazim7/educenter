<?php

use App\Actions\InitializeTenantRBACAction;
use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;

/**
 * Reception could not load the POS product catalogue and Accountant could not
 * load the teacher roster their payroll report is built from, so both screens
 * broke once routes became permission-gated. Grants are written per tenant at
 * creation time, so existing centres need the corrected set replayed.
 */
return new class extends Migration
{
    public function up(): void
    {
        $action = app(InitializeTenantRBACAction::class);

        Tenant::query()->each(fn (Tenant $tenant) => $action->execute($tenant));
    }

    public function down(): void
    {
        // Role grants are declarative; there is no meaningful rollback.
    }
};
