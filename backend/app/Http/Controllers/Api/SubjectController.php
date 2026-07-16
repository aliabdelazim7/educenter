<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;

class SubjectController extends Controller
{
    /**
     * Tenant-scoped subject list, used to populate pickers.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Subject::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }
}
