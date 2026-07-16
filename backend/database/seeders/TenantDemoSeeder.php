<?php

namespace Database\Seeders;

use App\Actions\InitializeTenantRBACAction;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Branch;
use App\Models\Classroom;
use App\Models\AcademicYear;
use App\Models\Subject;
use App\Models\Grade;
use App\Models\TeacherProfile;
use App\Models\StudentProfile;
use App\Models\Group;
use App\Models\AcademicSession;
use App\Models\Attendance;
use App\Models\Product;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\LedgerEntry;
use App\Models\Notification;
use App\Models\AuditLog;
use App\Tenant\TenantManager;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TenantDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent: this may run on every deploy, and the subdomain is unique.
        if (Tenant::where('subdomain', 'elite')->exists()) {
            $this->command?->info('Demo tenant already exists — skipping.');

            return;
        }

        DB::transaction(function () {
            // 1. Create Demo Tenant
            $tenant = Tenant::create([
                'name' => 'Elite Academy',
                'subdomain' => 'elite',
            ]);

            // Set active tenant scope
            TenantManager::setTenant($tenant);

            // 2. Seed RBAC Roles and Permissions
            app(InitializeTenantRBACAction::class)->execute($tenant);

            // 3. Create Admin Owner User
            $adminUser = User::create([
                'name' => 'Principal John',
                'email' => 'admin@elite.com',
                'password' => bcrypt('password'),
            ]);
            $adminUser->assignRole('Owner');

            // 4. Create Branches & Rooms
            $mainBranch = Branch::create([
                'name' => 'Elite Main Campus',
                'address' => '789 Academy Blvd, Suite A',
                'phone' => '+1 (555) 100-2000',
            ]);

            $northBranch = Branch::create([
                'name' => 'Elite North Branch',
                'address' => '456 North High St',
                'phone' => '+1 (555) 200-3000',
            ]);

            $room101 = Classroom::create([
                'branch_id' => $mainBranch->id,
                'name' => 'Room 101 (Calculus Room)',
                'capacity' => 25,
            ]);

            $room102 = Classroom::create([
                'branch_id' => $mainBranch->id,
                'name' => 'Room 102 (Physics Lab)',
                'capacity' => 20,
            ]);

            $labA = Classroom::create([
                'branch_id' => $northBranch->id,
                'name' => 'Science Lab A',
                'capacity' => 15,
            ]);

            // 5. Create Academic Cycle, Subjects, and Grades
            $year = AcademicYear::create([
                'name' => '2026/2027',
                'start_date' => '2026-09-01',
                'end_date' => '2027-06-30',
                'status' => 'active',
            ]);

            $calculus = Subject::create(['name' => 'Advanced Calculus', 'code' => 'MATH-301']);
            $physics = Subject::create(['name' => 'AP Physics', 'code' => 'PHYS-202']);
            $english = Subject::create(['name' => 'English Literature', 'code' => 'ENG-101']);

            $grade11 = Grade::create(['name' => 'Grade 11']);
            $grade12 = Grade::create(['name' => 'Grade 12']);

            // 6. Create Teacher Profiles
            $teacherUser1 = User::create([
                'name' => 'Sarah Jenkins',
                'email' => 'sarah@elite.com',
                'password' => bcrypt('password'),
            ]);
            $teacherUser1->assignRole('Teacher');
            $sarahProfile = TeacherProfile::create([
                'user_id' => $teacherUser1->id,
                'salary' => 3200.00,
                'commission_rate' => 10.00,
                'status' => 'active',
            ]);

            $teacherUser2 = User::create([
                'name' => 'Albert Cooper',
                'email' => 'albert@elite.com',
                'password' => bcrypt('password'),
            ]);
            $teacherUser2->assignRole('Teacher');
            $albertProfile = TeacherProfile::create([
                'user_id' => $teacherUser2->id,
                'salary' => 3600.00,
                'commission_rate' => 15.00,
                'status' => 'active',
            ]);

            // 7. Create Student Profiles
            $studentNames = [
                'Billy The Kid' => 'billy@elite.com',
                'Alex Mercer' => 'alex@elite.com',
                'David Miller' => 'david@elite.com',
                'Emily Davis' => 'emily@elite.com',
                'Clara Oswald' => 'clara@elite.com',
            ];

            $studentProfiles = [];
            $i = 1;
            foreach ($studentNames as $name => $email) {
                $studentUser = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => bcrypt('password'),
                ]);
                $studentUser->assignRole('Student');
                
                $studentProfiles[] = StudentProfile::create([
                    'user_id' => $studentUser->id,
                    'qr_code' => 'ELITE-STU-00' . $i,
                    'barcode' => '9920100' . $i,
                ]);
                $i++;
            }

            // 8. Create Groups and enroll Students
            $groupCalc = Group::create([
                'name' => 'Calculus G11 - Main',
                'branch_id' => $mainBranch->id,
                'academic_year_id' => $year->id,
                'subject_id' => $calculus->id,
                'grade_id' => $grade11->id,
                'teacher_profile_id' => $sarahProfile->id,
            ]);

            $groupPhys = Group::create([
                'name' => 'Physics G12 - Lab',
                'branch_id' => $mainBranch->id,
                'academic_year_id' => $year->id,
                'subject_id' => $physics->id,
                'grade_id' => $grade12->id,
                'teacher_profile_id' => $albertProfile->id,
            ]);

            // Enroll all students in Calculus, first 3 in Physics
            $groupCalc->students()->sync(collect($studentProfiles)->pluck('id')->toArray());
            $groupPhys->students()->sync([$studentProfiles[0]->id, $studentProfiles[1]->id, $studentProfiles[2]->id]);

            // 9. Create Academic Sessions (Timetable)
            // Session 1: completed class today at 9:00 AM
            $session1 = AcademicSession::create([
                'group_id' => $groupCalc->id,
                'classroom_id' => $room101->id,
                'teacher_profile_id' => $sarahProfile->id,
                'date' => now()->toDateString(),
                'start_time' => '09:00:00',
                'end_time' => '10:30:00',
                'status' => 'completed',
            ]);

            // Session 2: completed class today at 11:30 AM
            $session2 = AcademicSession::create([
                'group_id' => $groupPhys->id,
                'classroom_id' => $room102->id,
                'teacher_profile_id' => $albertProfile->id,
                'date' => now()->toDateString(),
                'start_time' => '11:30:00',
                'end_time' => '13:00:00',
                'status' => 'completed',
            ]);

            // Session 3: scheduled class tomorrow
            AcademicSession::create([
                'group_id' => $groupCalc->id,
                'classroom_id' => $room101->id,
                'teacher_profile_id' => $sarahProfile->id,
                'date' => now()->addDay()->toDateString(),
                'start_time' => '09:00:00',
                'end_time' => '10:30:00',
                'status' => 'scheduled',
            ]);

            // 10. Mark Attendance logs for Session 1
            Attendance::create(['academic_session_id' => $session1->id, 'student_profile_id' => $studentProfiles[0]->id, 'status' => 'present']);
            Attendance::create(['academic_session_id' => $session1->id, 'student_profile_id' => $studentProfiles[1]->id, 'status' => 'present']);
            Attendance::create(['academic_session_id' => $session1->id, 'student_profile_id' => $studentProfiles[2]->id, 'status' => 'present']);
            Attendance::create(['academic_session_id' => $session1->id, 'student_profile_id' => $studentProfiles[3]->id, 'status' => 'late', 'remarks' => 'Bus was late']);
            Attendance::create(['academic_session_id' => $session1->id, 'student_profile_id' => $studentProfiles[4]->id, 'status' => 'absent']);

            // 11. Create Products Catalog
            $workbook = Product::create([
                'name' => 'Calculus G11 Workbook',
                'sku' => 'ELITE-MATH-11',
                'type' => 'book',
                'purchase_cost' => 12.00,
                'selling_price' => 25.00,
                'stock' => 45,
                'low_stock_threshold' => 5,
            ]);
            InventoryMovement::create(['product_id' => $workbook->id, 'quantity' => 45, 'type' => 'purchase', 'remarks' => 'Supplier intake']);

            $kit = Product::create([
                'name' => 'Physics Mechanics Lab Kit',
                'sku' => 'ELITE-PHYS-12',
                'type' => 'material',
                'purchase_cost' => 22.00,
                'selling_price' => 45.00,
                'stock' => 12,
                'low_stock_threshold' => 5,
            ]);
            InventoryMovement::create(['product_id' => $kit->id, 'quantity' => 12, 'type' => 'purchase', 'remarks' => 'Supplier intake']);

            $uniform = Product::create([
                'name' => 'Elite Academy Polo Shirt',
                'sku' => 'ELITE-UNI-POLO',
                'type' => 'product',
                'purchase_cost' => 15.00,
                'selling_price' => 30.00,
                'stock' => 3, // LOW STOCK!
                'low_stock_threshold' => 5,
            ]);
            InventoryMovement::create(['product_id' => $uniform->id, 'quantity' => 3, 'type' => 'purchase', 'remarks' => 'Supplier intake']);

            // 12. Seed Invoices and Payments (Credit Ledger)
            // Invoice 1: Unpaid Course enrollment invoice
            $invoice1 = Invoice::create([
                'invoice_number' => 'INV-000001',
                'student_profile_id' => $studentProfiles[0]->id,
                'total_amount' => 150.00,
                'discount_amount' => 0.00,
                'tax_amount' => 0.00,
                'grand_total' => 150.00,
                'status' => 'unpaid',
                'due_date' => now()->addDays(10),
            ]);
            InvoiceItem::create([
                'invoice_id' => $invoice1->id,
                'description' => 'Grade 11 Calculus Course Fee',
                'quantity' => 1,
                'unit_price' => 150.00,
                'total_price' => 150.00,
            ]);

            // Invoice 2: Partially Paid invoice (Material + Tuition)
            // Total = 25 + 200 = 225. Paid 100, remaining 125.
            $invoice2 = Invoice::create([
                'invoice_number' => 'INV-000002',
                'student_profile_id' => $studentProfiles[1]->id,
                'total_amount' => 225.00,
                'discount_amount' => 0.00,
                'tax_amount' => 0.00,
                'grand_total' => 225.00,
                'status' => 'partially_paid',
                'due_date' => now()->addDays(5),
            ]);
            InvoiceItem::create([
                'invoice_id' => $invoice2->id,
                'product_id' => $workbook->id,
                'description' => 'Calculus G11 Workbook',
                'quantity' => 1,
                'unit_price' => 25.00,
                'total_price' => 25.00,
            ]);
            InvoiceItem::create([
                'invoice_id' => $invoice2->id,
                'description' => 'AP Tuition Course Fee',
                'quantity' => 1,
                'unit_price' => 200.00,
                'total_price' => 200.00,
            ]);

            $pay1 = Payment::create([
                'invoice_id' => $invoice2->id,
                'amount' => 100.00,
                'payment_method' => 'bank_transfer',
                'transaction_reference' => 'IBAN-8820',
                'payment_date' => now()->subDays(2)->toDateString(),
            ]);
            LedgerEntry::create([
                'type' => 'credit',
                'amount' => 100.00,
                'category' => 'revenue',
                'description' => 'Partial Tuition Payment received for INV-000002',
                'reference_id' => $pay1->id,
                'reference_type' => 'Payment',
            ]);

            // Invoice 3: Paid POS checkout invoice (Today)
            $invoice3 = Invoice::create([
                'invoice_number' => 'POS-000001',
                'student_profile_id' => $studentProfiles[2]->id,
                'total_amount' => 45.00,
                'discount_amount' => 0.00,
                'grand_total' => 45.00,
                'status' => 'paid',
                'due_date' => now()->toDateString(),
            ]);
            InvoiceItem::create([
                'invoice_id' => $invoice3->id,
                'product_id' => $kit->id,
                'description' => 'POS Sale: AP Physics Mechanics Lab Kit',
                'quantity' => 1,
                'unit_price' => 45.00,
                'total_price' => 45.00,
            ]);
            $pay2 = Payment::create([
                'invoice_id' => $invoice3->id,
                'amount' => 45.00,
                'payment_method' => 'cash',
                'payment_date' => now()->toDateString(),
            ]);
            LedgerEntry::create([
                'type' => 'credit',
                'amount' => 45.00,
                'category' => 'revenue',
                'description' => 'POS Checkout payment received for POS-000001',
                'reference_id' => $pay2->id,
                'reference_type' => 'Payment',
            ]);

            // 13. Seed Expenses (Debit Ledger)
            // Expense 1: Rental cost (5 days ago)
            $expense1 = Expense::create([
                'amount' => 1200.00,
                'category' => 'rent',
                'description' => 'Elite Main Campus Monthly Rent payment',
                'expense_date' => now()->subDays(5)->toDateString(),
            ]);
            LedgerEntry::create([
                'type' => 'debit',
                'amount' => 1200.00,
                'category' => 'expense',
                'description' => 'Expense: Rent logged',
                'reference_id' => $expense1->id,
                'reference_type' => 'Expense',
            ]);

            // Expense 2: Utility internet bills (2 days ago)
            $expense2 = Expense::create([
                'amount' => 85.00,
                'category' => 'utility',
                'description' => 'Fibre Internet connection invoice #8209',
                'expense_date' => now()->subDays(2)->toDateString(),
            ]);
            LedgerEntry::create([
                'type' => 'debit',
                'amount' => 85.00,
                'category' => 'expense',
                'description' => 'Expense: utility Fibre Internet logged',
                'reference_id' => $expense2->id,
                'reference_type' => 'Expense',
            ]);

            // 14. Seed Notifications and Audit Logs
            Notification::create([
                'user_id' => $adminUser->id,
                'title' => 'Low Stock Warning',
                'message' => 'Polo shirts inventory stock is below limits (3 left)',
                'type' => 'low_stock',
            ]);

            Notification::create([
                'user_id' => $adminUser->id,
                'title' => 'Outstanding Invoice Notice',
                'message' => 'Invoice INV-000001 is pending with Billy The Kid',
                'type' => 'invoice_due',
            ]);

            AuditLog::create([
                'user_id' => $adminUser->id,
                'action' => 'setup',
                'model_type' => Tenant::class,
                'model_id' => $tenant->id,
                'payload' => ['subdomain' => 'elite', 'name' => 'Elite Academy'],
                'ip_address' => '127.0.0.1',
            ]);

            AuditLog::create([
                'user_id' => $adminUser->id,
                'action' => 'create',
                'model_type' => Branch::class,
                'model_id' => $mainBranch->id,
                'payload' => ['name' => 'Elite Main Campus'],
                'ip_address' => '127.0.0.1',
            ]);
        });
    }
}
