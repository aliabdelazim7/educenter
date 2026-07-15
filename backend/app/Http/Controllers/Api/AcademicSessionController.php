<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AcademicSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AcademicSession::with(['group.subject', 'group.grade', 'classroom', 'teacherProfile.user']);

        // Filter sessions by date if provided
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        $sessions = $query->latest()->get();

        return response()->json(['data' => $sessions]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'group_id' => ['required', 'uuid', 'exists:groups,id'],
            'classroom_id' => ['nullable', 'uuid', 'exists:classrooms,id'],
            'teacher_profile_id' => ['nullable', 'uuid', 'exists:teacher_profiles,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/', 'after:start_time'],
            'status' => ['required', 'string', 'in:scheduled,completed,cancelled'],
        ]);

        $session = AcademicSession::create($validated);

        return response()->json([
            'message' => 'Academic session scheduled successfully.',
            'data' => $session->load(['group.subject', 'group.grade', 'classroom', 'teacherProfile.user'])
        ], Response::HTTP_CREATED);
    }

    public function show(AcademicSession $academicSession): JsonResponse
    {
        return response()->json([
            'data' => $academicSession->load(['group.subject', 'group.grade', 'classroom', 'teacherProfile.user'])
        ]);
    }

    public function update(Request $request, AcademicSession $academicSession): JsonResponse
    {
        $validated = $request->validate([
            'group_id' => ['required', 'uuid', 'exists:groups,id'],
            'classroom_id' => ['nullable', 'uuid', 'exists:classrooms,id'],
            'teacher_profile_id' => ['nullable', 'uuid', 'exists:teacher_profiles,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/', 'after:start_time'],
            'status' => ['required', 'string', 'in:scheduled,completed,cancelled'],
        ]);

        $academicSession->update($validated);

        return response()->json([
            'message' => 'Academic session updated successfully.',
            'data' => $academicSession->load(['group.subject', 'group.grade', 'classroom', 'teacherProfile.user'])
        ]);
    }

    public function destroy(AcademicSession $academicSession): JsonResponse
    {
        $academicSession->delete();
        return response()->json(['message' => 'Academic session deleted successfully.']);
    }
}
