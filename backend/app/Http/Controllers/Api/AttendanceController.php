<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Mark attendance for a scheduled session (bulk save).
     */
    public function mark(Request $request, AcademicSession $academicSession): JsonResponse
    {
        $validated = $request->validate([
            'records' => ['required', 'array'],
            'records.*.student_profile_id' => ['required', 'uuid', 'exists:student_profiles,id'],
            'records.*.status' => ['required', 'string', 'in:present,absent,late,excused'],
            'records.*.remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $records = DB::transaction(function () use ($validated, $academicSession) {
            $saved = [];
            foreach ($validated['records'] as $record) {
                $saved[] = Attendance::updateOrCreate(
                    [
                        'academic_session_id' => $academicSession->id,
                        'student_profile_id' => $record['student_profile_id'],
                    ],
                    [
                        'status' => $record['status'],
                        'remarks' => $record['remarks'] ?? null,
                    ]
                );
            }

            // Mark session as completed
            $academicSession->update(['status' => 'completed']);

            return $saved;
        });

        return response()->json([
            'message' => 'Attendance marked successfully.',
            'data' => $records
        ]);
    }

    /**
     * Retrieve attendance records for a scheduled session.
     */
    public function sessionAttendance(AcademicSession $academicSession): JsonResponse
    {
        $records = Attendance::with(['studentProfile.user'])
            ->where('academic_session_id', $academicSession->id)
            ->get();

        return response()->json(['data' => $records]);
    }
}
