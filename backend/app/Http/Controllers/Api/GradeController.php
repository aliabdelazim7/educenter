<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use Illuminate\Http\JsonResponse;

class GradeController extends Controller
{
    /**
     * Tenant-scoped grade list, used to populate pickers.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Grade::orderBy('name')->get(['id', 'name']),
        ]);
    }
}
