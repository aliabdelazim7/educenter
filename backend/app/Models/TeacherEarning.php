<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A teacher's accrued cut from selling their material.
 *
 * One row per product line on a sale, holding a snapshot of the terms so later
 * edits to the product cannot rewrite history.
 */
class TeacherEarning extends Model
{
    use HasUuids, BelongsToTenant;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SETTLED = 'settled';

    protected $fillable = [
        'tenant_id',
        'teacher_profile_id',
        'product_id',
        'invoice_id',
        'quantity',
        'unit_price',
        'share_percentage',
        'amount',
        'status',
        'settled_at',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'share_percentage' => 'decimal:2',
        'amount' => 'decimal:2',
        'settled_at' => 'datetime',
    ];

    public function teacherProfile(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
