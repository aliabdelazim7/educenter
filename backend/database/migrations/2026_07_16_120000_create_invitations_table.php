<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');

            // The pending user this invitation provisions.
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('invited_by')->nullable()->constrained('users')->nullOnDelete();

            // Students may be enrolled without an address; the link is then shared manually.
            $table->string('email')->nullable();
            $table->string('role');

            // Only the hash is stored; the plaintext token lives in the emailed link.
            $table->string('token_hash', 64)->unique();

            // sent | accepted | cancelled  (expiry is derived from expires_at)
            $table->string('status')->default('sent');

            // Role-specific profile data captured at invite time.
            $table->json('profile_payload')->nullable();

            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            // pending_invitation | active | inactive | suspended
            $table->string('status')->default('active')->after('email');
            $table->string('phone')->nullable()->after('status');

            // Invited users have no password until they accept.
            $table->string('password')->nullable()->change();

            // Students can be enrolled without an email address.
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'phone']);
        });
    }
};
