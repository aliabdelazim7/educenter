<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\POSController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\LedgerController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\EducationalContentController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\StudentTimelineController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SubjectController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Central routes (no tenant isolation required to register a new tenant).
    // This is the only public sign-up: it creates a centre and its Owner.
    // Every other account is provisioned by invitation.
    Route::post('/register', [AuthController::class, 'register']);

    // Public invitation acceptance: the invitee has no tenant context yet, so the
    // token itself carries the tenant. Throttled because it is unauthenticated.
    Route::middleware('throttle:10,1')->group(function () {
        Route::get('/invitations/{token}', [InvitationController::class, 'show']);
        Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept']);
    });

    // Tenant-scoped routes (requires a valid subdomain or X-Tenant-ID header)
    Route::middleware(['tenant'])->group(function () {
        Route::post('/login', [AuthController::class, 'login']);

        // Tenant-scoped authenticated routes
        Route::middleware(['auth:sanctum'])->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);

            // Invitations (Owner/Admin only — enforced in the controller/request)
            Route::get('invitations', [InvitationController::class, 'index']);
            Route::post('invitations', [InvitationController::class, 'store']);
            Route::post('invitations/{invitation}/resend', [InvitationController::class, 'resend']);
            Route::patch('invitations/{invitation}/email', [InvitationController::class, 'updateEmail']);
            Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy']);

            // User activation controls
            Route::get('users', [UserController::class, 'index']);
            Route::patch('users/{user}/status', [UserController::class, 'updateStatus']);

            // Lookup used by the invite form
            Route::get('subjects', [SubjectController::class, 'index']);

            // Branches
            Route::apiResource('branches', BranchController::class);

            // Academic Years
            Route::apiResource('academic-years', AcademicYearController::class);

            // Class Groups
            Route::apiResource('groups', GroupController::class);
            Route::post('groups/{group}/enroll', [GroupController::class, 'enrollStudents']);
            Route::delete('groups/{group}/students/{student}', [GroupController::class, 'removeStudent']);
            Route::get('groups/{group}/students', [GroupController::class, 'students']);

            // Academic Sessions (scheduled classes)
            Route::apiResource('academic-sessions', AcademicSessionController::class);

            // Attendance marking
            Route::post('academic-sessions/{academic_session}/attendance', [AttendanceController::class, 'mark']);
            Route::get('academic-sessions/{academic_session}/attendance', [AttendanceController::class, 'sessionAttendance']);

            // Inventory Products & Stock
            Route::apiResource('products', ProductController::class);
            Route::post('products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);

            // Invoices & Invoice Payments
            Route::apiResource('invoices', InvoiceController::class);
            Route::post('invoices/{invoice}/payment', [InvoiceController::class, 'recordPayment']);

            // POS counter Checkout
            Route::post('pos/checkout', [POSController::class, 'checkout']);

            // Expense logs
            Route::apiResource('expenses', ExpenseController::class);

            // Accounting ledger and Balance summaries
            Route::get('ledger', [LedgerController::class, 'index']);

            // Global search
            Route::get('search', [SearchController::class, 'search']);
            Route::get('students', [SearchController::class, 'allStudents']);
            Route::post('students', [SearchController::class, 'storeStudent']);
            Route::get('teachers', [SearchController::class, 'allTeachers']);
            Route::post('teachers', [SearchController::class, 'storeTeacher']);

            // Educational Content, Exams & Timeline
            Route::apiResource('educational-contents', EducationalContentController::class);
            Route::apiResource('exams', ExamController::class);
            Route::post('exams/{exam}/grade', [ExamController::class, 'grade']);
            Route::get('exams/{exam}/grades', [ExamController::class, 'getGrades']);
            Route::get('students/{student}/timeline', [StudentTimelineController::class, 'show']);
            Route::post('students/timeline', [StudentTimelineController::class, 'store']);

            // Audit Logs activity trail
            Route::get('audit-logs', [AuditLogController::class, 'index']);

            // Media uploads
            Route::post('media/upload', [MediaController::class, 'upload']);

            // In-app Notifications
            Route::get('notifications', [NotificationController::class, 'index']);
            Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
            Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

            // Dashboard Analytics
            Route::get('analytics/summary', [AnalyticsController::class, 'summary']);
        });
    });
});
