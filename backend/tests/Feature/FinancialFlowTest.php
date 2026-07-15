<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\LedgerEntry;
use App\Models\StudentProfile;
use App\Tenant\TenantManager;

class FinancialFlowTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;
    protected Tenant $tenant;
    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        TenantManager::clear();

        // 1. Sign up a tenant and user to obtain token
        $response = $this->postJson('/api/v1/register', [
            'tenant_name' => 'Alpha Learning',
            'subdomain' => 'alpha',
            'name' => 'Director Sarah',
            'email' => 'sarah@alpha.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $this->token = $response['access_token'];
        $this->tenant = Tenant::where('subdomain', 'alpha')->first();
        
        // Scope TenantManager for model setup in test
        TenantManager::setTenant($this->tenant);
        $this->owner = User::where('email', 'sarah@alpha.com')->first();
    }

    public function test_complete_financial_pos_and_inventory_flow()
    {
        // 2. Create a Product via API (Textbook)
        $productRes = $this->postJson('/api/v1/products', [
            'name' => 'Physics Textbook Vol 1',
            'sku' => 'PHYS-101-BK',
            'type' => 'book',
            'purchase_cost' => 15.00,
            'selling_price' => 25.00,
            'stock' => 10,
            'low_stock_threshold' => 3,
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $productRes->assertStatus(201);
        $productId = $productRes['data']['id'];

        // Assert initial inventory movement logged
        $this->assertDatabaseHas('inventory_movements', [
            'tenant_id' => $this->tenant->id,
            'product_id' => $productId,
            'quantity' => 10,
            'type' => 'purchase',
        ]);

        // 3. Adjust Stock via API (Intake 5 more books)
        $adjustRes = $this->postJson("/api/v1/products/{$productId}/adjust-stock", [
            'quantity' => 5,
            'type' => 'purchase',
            'remarks' => 'Restock shipment',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $adjustRes->assertStatus(200);
        $this->assertEquals(15, $adjustRes['data']['stock']);

        // 4. Create Student Profile directly for billing
        $studentUser = User::create([
            'name' => 'Student Alex',
            'email' => 'alex@alpha.com',
            'password' => bcrypt('password'),
        ]);
        $studentProfile = StudentProfile::create([
            'user_id' => $studentUser->id,
            'qr_code' => 'ALEX-88',
        ]);

        // 5. Create an Invoice via API
        $invoiceRes = $this->postJson('/api/v1/invoices', [
            'student_profile_id' => $studentProfile->id,
            'due_date' => '2026-08-15',
            'items' => [
                [
                    'product_id' => $productId,
                    'description' => 'Physics Textbook Course Material',
                    'quantity' => 1,
                    'unit_price' => 25.00,
                ],
                [
                    'product_id' => null,
                    'description' => 'Registration Fee',
                    'quantity' => 1,
                    'unit_price' => 100.00,
                ]
            ],
            'discount_amount' => 10.00,
            'tax_amount' => 5.00,
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $invoiceRes->assertStatus(201);
        $invoiceId = $invoiceRes['data']['id'];
        
        // Assert invoice total calculations
        // total = 25 + 100 = 125. grandTotal = 125 - 10 + 5 = 120
        $this->assertEquals(120.00, $invoiceRes['data']['grand_total']);
        $this->assertEquals('INV-000001', $invoiceRes['data']['invoice_number']);

        // 6. Record Payment against Invoice
        $paymentRes = $this->postJson("/api/v1/invoices/{$invoiceId}/payment", [
            'amount' => 120.00,
            'payment_method' => 'card',
            'transaction_reference' => 'TXN-9028',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $paymentRes->assertStatus(200);
        $this->assertEquals('paid', $paymentRes['invoice_status']);

        // Assert payment and ledger entries created
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoiceId,
            'amount' => 120.00,
            'payment_method' => 'card',
        ]);
        $this->assertDatabaseHas('ledger_entries', [
            'tenant_id' => $this->tenant->id,
            'type' => 'credit',
            'amount' => 120.00,
            'category' => 'revenue',
        ]);

        // 7. Perform POS Checkout (Checkout 2 textbooks)
        $posRes = $this->postJson('/api/v1/pos/checkout', [
            'student_profile_id' => $studentProfile->id,
            'payment_method' => 'cash',
            'discount_amount' => 5.00,
            'items' => [
                [
                    'product_id' => $productId,
                    'quantity' => 2, // 2 * 25 = 50. grandTotal = 50 - 5 = 45
                ]
            ]
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $posRes->assertStatus(201);
        
        // Assert POS invoice generated and paid
        $posInvoice = $posRes['data']['invoice'];
        $this->assertEquals(45.00, $posInvoice['grand_total']);
        $this->assertEquals('paid', $posInvoice['status']);
        $this->assertStringStartsWith('POS-', $posInvoice['invoice_number']);

        // Verify product stock decremented (15 - 2 = 13)
        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'stock' => 13,
        ]);

        // Assert POS stock movement logged
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $productId,
            'quantity' => -2,
            'type' => 'sale',
        ]);

        // 8. Log an Expense (Rent)
        $expenseRes = $this->postJson('/api/v1/expenses', [
            'amount' => 50.00,
            'category' => 'utility',
            'description' => 'Office internet bill',
            'expense_date' => '2026-07-15',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $expenseRes->assertStatus(201);
        $expenseId = $expenseRes['data']['id'];

        $this->assertDatabaseHas('expenses', [
            'tenant_id' => $this->tenant->id,
            'amount' => 50.00,
            'category' => 'utility',
        ]);
        $this->assertDatabaseHas('ledger_entries', [
            'tenant_id' => $this->tenant->id,
            'type' => 'debit',
            'amount' => 50.00,
            'category' => 'expense',
            'reference_id' => $expenseId,
        ]);

        // 9. Query Ledger Statements via API
        $ledgerRes = $this->getJson('/api/v1/ledger', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $ledgerRes->assertStatus(200);
        
        // Total Credits = 120 (Invoice Payment) + 45 (POS Checkout) = 165.00
        // Total Debits = 50 (Expense) = 50.00
        // Net profit = 165 - 50 = 115.00
        $this->assertEquals(165.00, $ledgerRes['summary']['total_revenue']);
        $this->assertEquals(50.00, $ledgerRes['summary']['total_expenses']);
        $this->assertEquals(115.00, $ledgerRes['summary']['net_profit']);
    }

    public function test_pos_checkout_fails_if_stock_insufficient()
    {
        $product = \App\Models\Product::create([
            'name' => 'Low Stock Book',
            'sku' => 'LOW-STK-01',
            'type' => 'book',
            'purchase_cost' => 10.00,
            'selling_price' => 20.00,
            'stock' => 1,
            'low_stock_threshold' => 0,
        ]);

        $response = $this->postJson('/api/v1/pos/checkout', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // Requesting 5, only 1 available!
                ]
            ]
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Insufficient stock', $response['message']);
    }
}
