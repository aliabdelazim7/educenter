<?php

namespace App\Services;

use App\Mail\InvitationMail;
use App\Models\AuditLog;
use App\Models\Invitation;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Tenant\TenantManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InvitationService
{
    /**
     * Roles an Owner/Admin may invite, mapped to the profile fields we collect.
     */
    public const INVITABLE_ROLES = [
        'Admin',
        'Reception',
        'Accountant',
        'Teacher',
        'Teacher Assistant',
        'Student',
        'Parent',
    ];

    /**
     * Provision a pending user + invitation, then email the link.
     *
     * @return array{invitation: Invitation, url: string}
     */
    public function invite(array $data, User $inviter): array
    {
        $invitation = DB::transaction(function () use ($data, $inviter) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => User::STATUS_PENDING_INVITATION,
                'password' => null,
            ]);

            $user->assignRole($data['role']);

            $invitation = Invitation::create([
                'user_id' => $user->id,
                'invited_by' => $inviter->id,
                'email' => $data['email'],
                'role' => $data['role'],
                // Unique placeholder; the real token is issued when the mail goes out.
                'token_hash' => hash('sha256', 'init:' . Str::uuid()),
                'profile_payload' => $data['profile'] ?? null,
                'expires_at' => now()->addHours(Invitation::TTL_HOURS),
            ]);

            $this->audit('invitation.sent', $invitation, $inviter, [
                'email' => $data['email'],
                'role' => $data['role'],
            ]);

            return $invitation;
        });

        $url = $this->dispatchMail($invitation);

        return ['invitation' => $invitation->fresh(), 'url' => $url];
    }

    /**
     * Invalidate the previous link and send a fresh one.
     *
     * @return array{invitation: Invitation, url: string}
     */
    public function resend(Invitation $invitation, User $actor): array
    {
        if ($invitation->status === Invitation::STATUS_ACCEPTED) {
            throw new \DomainException('تم قبول هذه الدعوة بالفعل.');
        }

        $this->audit('invitation.resent', $invitation, $actor, ['email' => $invitation->email]);
        $url = $this->dispatchMail($invitation);

        return ['invitation' => $invitation->fresh(), 'url' => $url];
    }

    public function cancel(Invitation $invitation, User $actor): void
    {
        if ($invitation->status === Invitation::STATUS_ACCEPTED) {
            throw new \DomainException('لا يمكن إلغاء دعوة تم قبولها.');
        }

        DB::transaction(function () use ($invitation, $actor) {
            // Burn the token so the emailed link stops working immediately.
            $invitation->forceFill([
                'status' => Invitation::STATUS_CANCELLED,
                'token_hash' => hash('sha256', 'cancelled:' . $invitation->id),
            ])->save();

            $invitation->user?->update(['status' => User::STATUS_INACTIVE]);

            $this->audit('invitation.cancelled', $invitation, $actor, ['email' => $invitation->email]);
        });
    }

    /**
     * Change the destination address and reissue the link.
     *
     * @return array{invitation: Invitation, url: string}
     */
    public function changeEmail(Invitation $invitation, string $email, User $actor): array
    {
        if ($invitation->status === Invitation::STATUS_ACCEPTED) {
            throw new \DomainException('لا يمكن تعديل بريد دعوة تم قبولها.');
        }

        DB::transaction(function () use ($invitation, $email, $actor) {
            $old = $invitation->email;

            $invitation->update(['email' => $email]);
            $invitation->user?->update(['email' => $email]);

            $this->audit('invitation.email_changed', $invitation, $actor, [
                'from' => $old,
                'to' => $email,
            ]);
        });

        $invitation = $invitation->fresh();
        $url = $this->dispatchMail($invitation);

        return ['invitation' => $invitation->fresh(), 'url' => $url];
    }

    /**
     * Complete the account. Single-use: the token is burned on success.
     */
    public function accept(Invitation $invitation, string $password, ?string $phone = null): User
    {
        return DB::transaction(function () use ($invitation, $password, $phone) {
            $user = $invitation->user;

            $user->forceFill([
                'password' => Hash::make($password),
                'status' => User::STATUS_ACTIVE,
                'phone' => $phone ?: $user->phone,
                'email_verified_at' => now(),
            ])->save();

            $invitation->forceFill([
                'status' => Invitation::STATUS_ACCEPTED,
                'accepted_at' => now(),
                // Burn the token: the link cannot be replayed or shared.
                'token_hash' => hash('sha256', 'accepted:' . $invitation->id),
            ])->save();

            // Turn the captured profile data into the real record the portals
            // and rosters read from. Without this the account has no profile
            // and every self-service screen comes up empty.
            $this->provisionProfile($invitation, $user);

            $this->audit('invitation.accepted', $invitation, $user, ['email' => $invitation->email]);

            return $user;
        });
    }

    /**
     * Create the domain profile matching the invited role.
     *
     * Idempotent: re-running for an already-provisioned user is a no-op, so a
     * replayed accept cannot create duplicates.
     */
    private function provisionProfile(Invitation $invitation, User $user): void
    {
        $payload = $invitation->profile_payload ?? [];

        // Acceptance is a public route with no tenant middleware, so the tenant
        // is not resolved and BelongsToTenant cannot fill tenant_id. Set it from
        // the invitation explicitly or the insert violates NOT NULL.
        $tenantId = $invitation->tenant_id;

        if ($invitation->role === 'Student') {
            StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'tenant_id' => $tenantId,
                    // Links the child to the parent account picked at invite
                    // time; the parent portal reads exactly this column.
                    'parent_id' => $payload['parent_id'] ?? null,
                    'qr_code' => (string) Str::uuid(),
                    'barcode' => (string) Str::uuid(),
                ]
            );

            return;
        }

        if (in_array($invitation->role, ['Teacher', 'Teacher Assistant'], true)) {
            $isPercentage = ($payload['contract_type'] ?? null) === 'percentage';
            $compensation = $payload['compensation'] ?? null;

            TeacherProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'tenant_id' => $tenantId,
                    'salary' => $isPercentage ? null : $compensation,
                    // commission_percentage is the column the teacher and
                    // payroll screens read; commission_rate is the older one.
                    'commission_percentage' => $isPercentage ? $compensation : 0,
                    'status' => 'active',
                ]
            );
        }
    }

    /**
     * Issue a fresh token and email the link.
     *
     * Returns the link so the caller can hand it to the admin: students may be
     * enrolled without an address, and mail delivery can fail. The plaintext
     * token is returned, never logged.
     */
    private function dispatchMail(Invitation $invitation): string
    {
        $token = $invitation->issueToken();
        $tenant = $invitation->tenant ?? TenantManager::getTenant();

        $url = rtrim(config('app.frontend_url'), '/') . '/invitation/' . $token;

        if (!$invitation->email) {
            return $url;
        }

        try {
            Mail::to($invitation->email)->send(new InvitationMail($invitation, $tenant, $url));
        } catch (\Throwable $e) {
            // The invitation is still valid; the admin can share the link manually.
            Log::error('Invitation email failed to send', [
                'invitation_id' => $invitation->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $url;
    }

    private function audit(string $action, Invitation $invitation, User $actor, array $payload = []): void
    {
        AuditLog::create([
            'tenant_id' => $invitation->tenant_id,
            'user_id' => $actor->id,
            'action' => $action,
            'model_type' => Invitation::class,
            'model_id' => $invitation->id,
            'payload' => $payload,
            'ip_address' => request()->ip(),
        ]);
    }
}
