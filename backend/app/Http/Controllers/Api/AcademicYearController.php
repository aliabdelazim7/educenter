<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AcademicYearController extends Controller
{
    public function index(): JsonResponse
    {
        $years = AcademicYear::latest()->get();
        return response()->json(['data' => $years]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (isset($data['status'])) {
            if (in_array($data['status'], ['نشط', 'نشطة', 'active'])) {
                $data['status'] = 'active';
            } else {
                $data['status'] = 'inactive';
            }
        } else {
            $data['status'] = 'active';
        }
        $request->merge($data);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $year = AcademicYear::create($validated);

        return response()->json([
            'message' => 'Academic Year created successfully.',
            'data' => $year
        ], Response::HTTP_CREATED);
    }

    public function show(AcademicYear $academicYear): JsonResponse
    {
        return response()->json(['data' => $academicYear]);
    }

    public function update(Request $request, AcademicYear $academicYear): JsonResponse
    {
        $data = $request->all();
        if (isset($data['status'])) {
            if (in_array($data['status'], ['نشط', 'نشطة', 'active'])) {
                $data['status'] = 'active';
            } else {
                $data['status'] = 'inactive';
            }
        }
        $request->merge($data);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $academicYear->update($validated);

        return response()->json([
            'message' => 'Academic Year updated successfully.',
            'data' => $academicYear
        ]);
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        $academicYear->delete();
        return response()->json(['message' => 'Academic Year deleted successfully.']);
    }
}
