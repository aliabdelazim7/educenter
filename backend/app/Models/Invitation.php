<?php

namespace App\Models;

use App\Scopes\TenantScope;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Invitation extends Model
{
    use HasUuids, BelongsToTenant;

    public const TTL_HOURS = 48;

    public const STATUS_SENT = 'sent';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'invited_by',
        'email',
        'role',
        'token_hash',
        'status',
        'profile_payload',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'profile_payload' => 'array',
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    protected $hidden = ['token_hash'];

    /**
     * Issue a new single-use token. Returns the plaintext, stores only the hash.
     */
    public function issueToken(): string
    {
        $plain = Str::random(64);

        $this->forceFill([
            'token_hash' => static::hashToken($plain),
            'status' => self::STATUS_SENT,
            'expires_at' => Carbon::now()->addHours(self::TTL_HOURS),
            'accepted_at' => null,
        ])->save();

        return $plain;
    }

    public static function hashToken(string $plain): string
    {
        return hash('sha256', $plain);
    }

    /**
     * Look up an invitation by plaintext token.
     *
     * Acceptance happens from the emailed link with no tenant context resolved,
     * so the tenant scope must be lifted here; the token itself is the authority.
     */
    public static function findByToken(string $plain): ?self
    {
        return static::withoutGlobalScope(TenantScope::class)
            ->where('token_hash', static::hashToken($plain))
            ->first();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Single-use: only a sent, unexpired invitation can be accepted.
     */
    public function isAcceptable(): bool
    {
        return $this->status === self::STATUS_SENT && !$this->isExpired();
    }

    /**
     * Status as shown to admins, folding expiry into the value.
     */
    public function displayStatus(): string
    {
        if ($this->status === self::STATUS_SENT && $this->isExpired()) {
            return 'expired';
        }

        return $this->status;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
