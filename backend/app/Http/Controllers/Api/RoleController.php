<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\RoleLabels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class RoleController extends Controller
{
    /**
     * Owner always holds everything; letting it be edited is how an admin locks
     * the whole centre out of its own settings.
     */
    private const LOCKED_ROLES = ['Owner'];

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        // config('permission.column_names.model_morph_key') is 'model_id' here.
        $counts = User::query()
            ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->whereNull('users.deleted_at')
            ->selectRaw('roles.name as role_name, count(*) as total')
            ->groupBy('roles.name')
            ->pluck('total', 'role_name');

        $roles = Role::with('permissions:id,name')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => RoleLabels::for($role->name),
                'locked' => in_array($role->name, self::LOCKED_ROLES, true),
                'users_count' => (int) ($counts[$role->name] ?? 0),
                'permissions' => $role->permissions->pluck('name'),
            ])
            ->values();

        return response()->json([
            'data' => [
                'roles' => $roles,
                'catalog' => collect(PermissionCatalog::GROUPS)->map(
                    fn (array $perms, string $group) => [
                        'group' => $group,
                        'permissions' => collect($perms)->map(
                            fn (string $label, string $key) => ['key' => $key, 'label' => $label]
                        )->values(),
                    ]
                )->values(),
            ],
        ]);
    }

    /**
     * Replace a role's permission set for this tenant.
     */
    public function updatePermissions(Request $request, string $roleId): JsonResponse
    {
        $this->authorizeAdmin($request);

        $role = Role::findOrFail($roleId);

        if (in_array($role->name, self::LOCKED_ROLES, true)) {
            return response()->json([
                'message' => 'لا يمكن تعديل صلاحيات مالك المركز.',
            ], Response::HTTP_CONFLICT);
        }

        $data = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => [Rule::in(PermissionCatalog::all())],
        ], [
            'permissions.*.in' => 'صلاحية غير معروفة.',
        ]);

        // Resolve within this tenant's permission set.
        $permissions = Permission::whereIn('name', $data['permissions'])->get();

        $before = $role->permissions->pluck('name')->sort()->values()->all();
        $role->syncPermissions($permissions);

        // Cached permissions would otherwise keep serving the old grants.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        AuditLog::create([
            'tenant_id' => $request->user()->tenant_id,
            'user_id' => $request->user()->id,
            'action' => 'role.permissions_updated',
            'model_type' => Role::class,
            'model_id' => null,
            'payload' => [
                'role' => $role->name,
                'from' => $before,
                'to' => collect($data['permissions'])->sort()->values()->all(),
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'تم تحديث صلاحيات ' . RoleLabels::for($role->name) . '.',
            'data' => [
                'name' => $role->name,
                'permissions' => $role->fresh()->permissions->pluck('name'),
            ],
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->hasAnyRole(['Owner', 'Admin']),
            Response::HTTP_FORBIDDEN,
            'غير مصرح لك بإدارة الصلاحيات.'
        );
    }
}
