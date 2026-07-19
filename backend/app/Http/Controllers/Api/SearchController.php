<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\Group;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Perform a global search query.
     */
    public function search(Request $request): JsonResponse
    {
        $term = $request->input('query');

        if (empty($term) || strlen($term) < 2) {
            return response()->json([
                'data' => [
                    'students' => [],
                    'groups' => [],
                    'invoices' => [],
                    'teachers' => []
                ]
            ]);
        }

        // 1. Search Students
        $students = StudentProfile::with('user')
            ->where(function ($query) use ($term) {
                $query->whereHas('user', function ($q) use ($term) {
                    $q->where('name', 'like', "%{$term}%")
                      ->orWhere('email', 'like', "%{$term}%");
                })
                ->orWhere('qr_code', 'like', "%{$term}%")
                ->orWhere('barcode', 'like', "%{$term}%");
            })
            ->limit(10)
            ->get();

        // 2. Search Groups
        $groups = Group::where('name', 'like', "%{$term}%")
            ->limit(10)
            ->get();

        // 3. Search Invoices
        $invoices = Invoice::where('invoice_number', 'like', "%{$term}%")
            ->limit(10)
            ->get();

        // 4. Search Teachers
        $teachers = TeacherProfile::with('user')
            ->whereHas('user', function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%");
            })
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'students' => $students,
                'groups' => $groups,
                'invoices' => $invoices,
                'teachers' => $teachers,
            ]
        ]);
    }

    /**
     * Retrieve all students.
     */
    public function allStudents(): JsonResponse
    {
        $students = StudentProfile::with('user')->get();
        return response()->json(['data' => $students]);
    }

    /**
     * Retrieve all teachers.
     */
    public function allTeachers(): JsonResponse
    {
        $teachers = TeacherProfile::with('user')->get();
        return response()->json(['data' => $teachers]);
    }

    /**
     * Register a new student from reception.
     */
    public function storeStudent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'barcode' => 'nullable|string|max:100',
            'qr_code' => 'nullable|string|max:100',
        ]);

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt('password123'), // Default fallback password
        ]);

        $user->assignRole('Student');

        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'barcode' => $validated['barcode'] ?? null,
            'qr_code' => $validated['qr_code'] ?? null,
        ]);

        // Log timeline registration event
        \App\Models\StudentTimelineEvent::logEvent(
            $profile->id,
            'renewal',
            'تم تسجيل الطالب بالنظام',
            "تم إنشاء الملف التعريفي للطالب بواسطة موظف الاستقبال."
        );

        return response()->json(['data' => $profile->load('user')], 201);
    }

    /**
     * Register a new teacher from reception.
     */
    public function storeTeacher(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt('password123'),
        ]);

        $user->assignRole('Teacher');

        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'commission_percentage' => $validated['commission_percentage'] ?? 0.00,
        ]);

        return response()->json(['data' => $profile->load('user')], 201);
    }
}
