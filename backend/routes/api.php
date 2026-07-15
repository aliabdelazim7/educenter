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
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Central routes (no tenant isolation required to register a new tenant)
    Route::post('/register', [AuthController::class, 'register']);

    // Tenant-scoped routes (requires a valid subdomain or X-Tenant-ID header)
    Route::middleware(['tenant'])->group(function () {
        Route::post('/login', [AuthController::class, 'login']);

        // Tenant-scoped authenticated routes
        Route::middleware(['auth:sanctum'])->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);

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
            Route::get('teachers', [SearchController::class, 'allTeachers']);

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
