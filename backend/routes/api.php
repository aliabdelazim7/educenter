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
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\GradeController;
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

            // Shared lookups: any signed-in member needs these to render pickers.
            Route::get('subjects', [SubjectController::class, 'index']);
            Route::get('grades', [GradeController::class, 'index']);

            // Branches
            Route::get('branches', [BranchController::class, 'index'])->middleware('permission:view branches');
            Route::get('branches/{branch}', [BranchController::class, 'show'])->middleware('permission:view branches');
            Route::middleware('permission:manage branches')->group(function () {
                Route::post('branches', [BranchController::class, 'store']);
                Route::match(['put', 'patch'], 'branches/{branch}', [BranchController::class, 'update']);
                Route::delete('branches/{branch}', [BranchController::class, 'destroy']);
            });

            // Academic: years, groups, sessions
            Route::middleware('permission:view academic')->group(function () {
                Route::get('academic-years', [AcademicYearController::class, 'index']);
                Route::get('academic-years/{academic_year}', [AcademicYearController::class, 'show']);
                Route::get('groups', [GroupController::class, 'index']);
                Route::get('groups/{group}', [GroupController::class, 'show']);
                Route::get('groups/{group}/students', [GroupController::class, 'students']);
                Route::get('academic-sessions', [AcademicSessionController::class, 'index']);
                Route::get('academic-sessions/{academic_session}', [AcademicSessionController::class, 'show']);
            });
            Route::middleware('permission:manage academic')->group(function () {
                Route::post('academic-years', [AcademicYearController::class, 'store']);
                Route::match(['put', 'patch'], 'academic-years/{academic_year}', [AcademicYearController::class, 'update']);
                Route::delete('academic-years/{academic_year}', [AcademicYearController::class, 'destroy']);
                Route::post('groups', [GroupController::class, 'store']);
                Route::match(['put', 'patch'], 'groups/{group}', [GroupController::class, 'update']);
                Route::delete('groups/{group}', [GroupController::class, 'destroy']);
                Route::post('groups/{group}/enroll', [GroupController::class, 'enrollStudents']);
                Route::delete('groups/{group}/students/{student}', [GroupController::class, 'removeStudent']);
                Route::post('academic-sessions', [AcademicSessionController::class, 'store']);
                Route::match(['put', 'patch'], 'academic-sessions/{academic_session}', [AcademicSessionController::class, 'update']);
                Route::delete('academic-sessions/{academic_session}', [AcademicSessionController::class, 'destroy']);
            });

            // Attendance
            Route::get('academic-sessions/{academic_session}/attendance', [AttendanceController::class, 'sessionAttendance'])
                ->middleware('permission:view attendance');
            Route::post('academic-sessions/{academic_session}/attendance', [AttendanceController::class, 'mark'])
                ->middleware('permission:mark attendance');

            // Inventory
            Route::get('products', [ProductController::class, 'index'])->middleware('permission:view inventory');
            Route::get('products/{product}', [ProductController::class, 'show'])->middleware('permission:view inventory');
            Route::middleware('permission:manage inventory')->group(function () {
                Route::post('products', [ProductController::class, 'store']);
                Route::match(['put', 'patch'], 'products/{product}', [ProductController::class, 'update']);
                Route::delete('products/{product}', [ProductController::class, 'destroy']);
                Route::post('products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);
            });

            // Financials: invoices, payments, expenses, ledger
            Route::middleware('permission:view financial')->group(function () {
                Route::get('invoices', [InvoiceController::class, 'index']);
                Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
                Route::get('expenses', [ExpenseController::class, 'index']);
                Route::get('expenses/{expense}', [ExpenseController::class, 'show']);
                Route::get('ledger', [LedgerController::class, 'index']);
                Route::get('analytics/summary', [AnalyticsController::class, 'summary']);
            });
            Route::middleware('permission:manage financial')->group(function () {
                Route::post('invoices', [InvoiceController::class, 'store']);
                Route::match(['put', 'patch'], 'invoices/{invoice}', [InvoiceController::class, 'update']);
                Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy']);
                Route::post('invoices/{invoice}/payment', [InvoiceController::class, 'recordPayment']);
                Route::post('expenses', [ExpenseController::class, 'store']);
                Route::match(['put', 'patch'], 'expenses/{expense}', [ExpenseController::class, 'update']);
                Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy']);
            });

            // POS
            Route::post('pos/checkout', [POSController::class, 'checkout'])->middleware('permission:manage pos');

            // Students & teachers directory
            Route::get('search', [SearchController::class, 'search']);
            Route::get('students', [SearchController::class, 'allStudents'])->middleware('permission:view students');
            Route::post('students', [SearchController::class, 'storeStudent'])->middleware('permission:manage students');
            Route::get('teachers', [SearchController::class, 'allTeachers'])->middleware('permission:view teachers');
            Route::post('teachers', [SearchController::class, 'storeTeacher'])->middleware('permission:manage teachers');

            // Educational content
            Route::get('educational-contents', [EducationalContentController::class, 'index'])->middleware('permission:view academic');
            Route::get('educational-contents/{educational_content}', [EducationalContentController::class, 'show'])->middleware('permission:view academic');
            Route::middleware('permission:manage media')->group(function () {
                Route::post('educational-contents', [EducationalContentController::class, 'store']);
                Route::match(['put', 'patch'], 'educational-contents/{educational_content}', [EducationalContentController::class, 'update']);
                Route::delete('educational-contents/{educational_content}', [EducationalContentController::class, 'destroy']);
                Route::post('media/upload', [MediaController::class, 'upload']);
            });

            // Exams
            Route::get('exams', [ExamController::class, 'index'])->middleware('permission:view academic');
            Route::get('exams/{exam}', [ExamController::class, 'show'])->middleware('permission:view academic');
            Route::middleware('permission:manage exams')->group(function () {
                Route::post('exams', [ExamController::class, 'store']);
                Route::match(['put', 'patch'], 'exams/{exam}', [ExamController::class, 'update']);
                Route::delete('exams/{exam}', [ExamController::class, 'destroy']);
            });
            Route::post('exams/{exam}/grade', [ExamController::class, 'grade'])->middleware('permission:grade exams');
            Route::get('exams/{exam}/grades', [ExamController::class, 'getGrades'])->middleware('permission:view academic');

            // Student timeline
            Route::get('students/{student}/timeline', [StudentTimelineController::class, 'show'])->middleware('permission:view students');
            Route::post('students/timeline', [StudentTimelineController::class, 'store'])->middleware('permission:manage students');

            // Audit trail
            Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:view audit logs');

            // Self-service portal. No permission gate: every query inside is
            // scoped to the caller's own profile or their children.
            Route::prefix('portal')->group(function () {
                Route::get('me', [PortalController::class, 'me']);
                Route::get('children', [PortalController::class, 'children']);
                Route::get('content', [PortalController::class, 'content']);
                Route::get('invoices', [PortalController::class, 'invoices']);
            });

            // Notifications are personal to the signed-in user.
            Route::get('notifications', [NotificationController::class, 'index']);
            Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
            Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        });
    });
});
