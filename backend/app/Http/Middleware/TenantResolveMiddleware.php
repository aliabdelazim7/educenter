<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;
use App\Tenant\TenantManager;

class TenantResolveMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;

        // 1. Resolve by Header (fallback for API / postman testing)
        if ($request->hasHeader('X-Tenant-ID')) {
            $tenantId = $request->header('X-Tenant-ID');
            $tenant = Tenant::where('id', $tenantId)->first();
        }

        // 2. Resolve by Subdomain
        if (!$tenant) {
            $host = $request->getHost();
            // Split host by dots
            $parts = explode('.', $host);
            
            // Assuming subdomain is the first part, e.g. "alpha.educenter.com" -> "alpha"
            // We ignore localhost, ip addresses, and system subdomains
            if (count($parts) >= 2 && !filter_var($host, FILTER_VALIDATE_IP)) {
                $subdomain = $parts[0];
                
                // Exclude system subdomains
                $systemSubdomains = ['www', 'admin', 'api', 'landing', 'portal'];
                if (!in_array($subdomain, $systemSubdomains)) {
                    $tenant = Tenant::where('subdomain', $subdomain)->first();
                }
            }
        }

        if (!$tenant) {
            return response()->json([
                'error' => 'Tenant unresolved. Please specify a valid X-Tenant-ID header or use a valid tenant subdomain.'
            ], Response::HTTP_NOT_FOUND);
        }

        // Check if tenant is active
        if ($tenant->status !== 'active') {
            return response()->json([
                'error' => 'This account is currently ' . $tenant->status . '.'
            ], Response::HTTP_FORBIDDEN);
        }

        // Set the global tenant context
        TenantManager::setTenant($tenant);

        // Set the Spatie Permission team context
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

        return $next($request);
    }
}
