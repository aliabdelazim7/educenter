<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\StudentProfile;
use App\Models\Tenant;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Tenant\TenantManager;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

/**
 * One ready-to-use login per role in the demo tenant, so every surface can be
 * tried without provisioning accounts by hand.
 *
 * Idempotent: runs on every deploy and only fills in what is missing.
 */
class DemoAccountsSeeder extends Seeder
{
    public const PASSWORD = 'demo1234';

    /**
     * role => [email, display name]
     */
    public const ACCOUNTS = [
        'Owner' => ['owner@demo.com', 'مالك المركز التجريبي'],
        'Admin' => ['admin@demo.com', 'مدير تجريبي'],
        'Reception' => ['reception@demo.com', 'موظف استقبال تجريبي'],
        'Accountant' => ['accountant@demo.com', 'محاسب تجريبي'],
        'Teacher' => ['teacher@demo.com', 'مدرس تجريبي'],
        'Teacher Assistant' => ['assistant@demo.com', 'مساعد مدرس تجريبي'],
        'Student' => ['student@demo.com', 'طالب تجريبي'],
        'Parent' => ['parent@demo.com', 'ولي أمر تجريبي'],
    ];

    public function run(): void
    {
        $tenant = Tenant::where('subdomain', 'elite')->first();

        if (!$tenant) {
            $this->command?->warn('Demo tenant "elite" not found — skipping demo accounts.');

            return;
        }

        TenantManager::setTenant($tenant);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

        DB::transaction(function () use ($tenant) {
            $created = [];

            foreach (self::ACCOUNTS as $role => [$email, $name]) {
                $user = User::where('email', $email)->first();

                if (!$user) {
                    $user = User::create([
                        'tenant_id' => $tenant->id,
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make(self::PASSWORD),
                        'status' => User::STATUS_ACTIVE,
                    ]);
                    $created[] = $role;
                } else {
                    // Keep the credentials predictable even if someone changed them.
                    $user->forceFill([
                        'password' => Hash::make(self::PASSWORD),
                        'status' => User::STATUS_ACTIVE,
                    ])->save();
                }

                if (!$user->hasRole($role)) {
                    $user->syncRoles([$role]);
                }

                $this->attachProfile($user, $role, $tenant);
            }

            $this->linkParentAndChild();

            $this->command?->info(
                'Demo accounts ready (' . count(self::ACCOUNTS) . ' roles'
                . ($created ? ', new: ' . implode(', ', $created) : '') . ').'
            );
        });
    }

    /**
     * Teachers and students need a domain profile or their screens are empty.
     */
    private function attachProfile(User $user, string $role, Tenant $tenant): void
    {
        if (in_array($role, ['Teacher', 'Teacher Assistant'], true)) {
            TeacherProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'tenant_id' => $tenant->id,
                    'salary' => 4000,
                    'commission_percentage' => 20,
                    'status' => 'active',
                ]
            );

            return;
        }

        if ($role === 'Student') {
            $profile = StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'tenant_id' => $tenant->id,
                    'qr_code' => 'DEMO-' . Str::upper(Str::random(6)),
                    'barcode' => 'DEMO-' . Str::upper(Str::random(6)),
                ]
            );

            // Enrol in every group so the schedule and content tabs have data.
            $groupIds = Group::pluck('id');
            if ($groupIds->isNotEmpty()) {
                $profile->groups()->syncWithoutDetaching($groupIds);
            }
        }
    }

    /**
     * The parent portal shows children by parent_id, so the demo parent needs
     * the demo student attached or their dashboard is empty.
     */
    private function linkParentAndChild(): void
    {
        $parent = User::where('email', self::ACCOUNTS['Parent'][0])->first();
        $student = User::where('email', self::ACCOUNTS['Student'][0])->first();

        if (!$parent || !$student) {
            return;
        }

        StudentProfile::where('user_id', $student->id)
            ->update(['parent_id' => $parent->id]);
    }
}
