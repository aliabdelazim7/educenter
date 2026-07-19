<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Support\RoleLabels;
use Database\Seeders\DemoAccountsSeeder;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lists the seeded demo logins for the sign-in page.
 *
 * Public by design: these are throwaway accounts in the demo tenant only. The
 * query is pinned to that tenant and to the seeded addresses, so it cannot
 * expose a real user's credentials.
 */
class DemoAccountController extends Controller
{
    private const DEMO_SUBDOMAIN = 'elite';

    public function index(): JsonResponse
    {
        $tenant = Tenant::where('subdomain', self::DEMO_SUBDOMAIN)->first();

        if (!$tenant) {
            return response()->json(['data' => ['subdomain' => null, 'accounts' => []]], Response::HTTP_OK);
        }

        $emails = collect(DemoAccountsSeeder::ACCOUNTS)
            ->mapWithKeys(fn (array $a, string $role) => [$a[0] => $role]);

        $roleOrder = array_keys(DemoAccountsSeeder::ACCOUNTS);

        $accounts = User::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereIn('email', $emails->keys())
            ->where('status', User::STATUS_ACTIVE)
            ->get()
            ->map(fn (User $u) => [
                'role' => $emails[$u->email],
                'role_label' => RoleLabels::for($emails[$u->email]),
                'email' => $u->email,
                'password' => DemoAccountsSeeder::PASSWORD,
            ])
            // Present them in the order the roles are declared, not insertion order.
            ->sortBy(fn ($a) => array_search($a['role'], $roleOrder, true))
            ->values();

        return response()->json([
            'data' => [
                'subdomain' => self::DEMO_SUBDOMAIN,
                'accounts' => $accounts,
            ],
        ]);
    }
}
