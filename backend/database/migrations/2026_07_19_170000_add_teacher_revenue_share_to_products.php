<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Attributes a product (a booklet, revision pack, …) to the teacher who
 * supplied it, so each sale can accrue that teacher's cut.
 *
 * The share is a percentage of the selling price. It accrues as a payable the
 * centre settles later rather than an immediate cash expense.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignUuid('teacher_profile_id')
                ->nullable()
                ->after('type')
                ->constrained('teacher_profiles')
                ->nullOnDelete();

            $table->decimal('teacher_share_percentage', 5, 2)
                ->default(0)
                ->after('teacher_profile_id');
        });

        Schema::create('teacher_earnings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('teacher_profile_id')->constrained('teacher_profiles')->onDelete('cascade');
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignUuid('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();

            $table->integer('quantity');
            // Snapshot the terms: changing a product's share later must not
            // rewrite what a teacher already earned.
            $table->decimal('unit_price', 10, 2);
            $table->decimal('share_percentage', 5, 2);
            $table->decimal('amount', 10, 2);

            // pending | settled
            $table->string('status')->default('pending');
            $table->timestamp('settled_at')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'teacher_profile_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_earnings');

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_profile_id');
            $table->dropColumn('teacher_share_percentage');
        });
    }
};
