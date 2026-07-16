<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Models\User;
use App\Tenant\TenantManager;
use App\Actions\InitializeTenantRBACAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Register a new Tenant and its Owner user.
     */
    public function register(RegisterRequest $request, InitializeTenantRBACAction $initRBAC): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $initRBAC) {
            // 1. Create the Tenant
            $tenant = Tenant::create([
                'name' => $request->tenant_name,
                'subdomain' => $request->subdomain,
                'status' => 'active',
            ]);

            // 2. Provision Roles and Permissions for this Tenant
            $initRBAC->execute($tenant);

            // 3. Set tenant context temporarily to create the user
            TenantManager::setTenant($tenant);

            // 4. Create the User (BelongsToTenant trait automatically assigns tenant_id)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            // 5. Assign Owner role
            $user->assignRole('Owner');

            // 6. Generate Sanctum token
            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'user' => $user,
                'tenant' => $tenant,
                'token' => $token,
            ];
        });

        return response()->json([
            'message' => 'Tenant and Administrator registered successfully.',
            'user' => new UserResource($result['user']),
            'tenant' => new TenantResource($result['tenant']),
            'access_token' => $result['token'],
            'token_type' => 'Bearer',
        ], Response::HTTP_CREATED);
    }

    /**
     * Authenticate user and return token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Because of the 'tenant' middleware, the query is automatically scoped to the resolved tenant
        $user = User::where('email', $request->email)->first();

        // Invited-but-not-accepted users have a null password; Hash::check would
        // throw on null, so guard before comparing.
        if (!$user || $user->password === null || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->canLogin()) {
            return response()->json([
                'message' => match ($user->status) {
                    User::STATUS_PENDING_INVITATION => 'لم يتم تفعيل حسابك بعد. يرجى إكمال إنشاء الحساب من رابط الدعوة.',
                    User::STATUS_SUSPENDED => 'تم إيقاف هذا الحساب. يرجى التواصل مع إدارة المركز.',
                    default => 'هذا الحساب غير مفعّل. يرجى التواصل مع إدارة المركز.',
                },
            ], Response::HTTP_FORBIDDEN);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Authenticated successfully.',
            'user' => new UserResource($user),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Log out user (revoke token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }
}
