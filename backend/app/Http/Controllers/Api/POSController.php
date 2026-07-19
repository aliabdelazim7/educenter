<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\InventoryMovement;
use App\Models\LedgerEntry;
use App\Models\TeacherEarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class POSController extends Controller
{
    /**
     * Process a counter checkout sale.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_profile_id' => ['nullable', 'uuid', 'exists:student_profiles,id'],
            'payment_method' => ['required', 'string', 'in:cash,card,bank_transfer'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $receipt = DB::transaction(function () use ($validated) {
                // Generate invoice number
                $count = Invoice::withTrashed()->count();
                $invoiceNumber = 'POS-' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

                // Compute total price and load items
                $totalAmount = 0;
                $itemsData = [];

                foreach ($validated['items'] as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    $subtotal = $product->selling_price * $item['quantity'];
                    
                    $totalAmount += $subtotal;
                    $itemsData[] = [
                        'product' => $product,
                        'quantity' => $item['quantity'],
                        'selling_price' => $product->selling_price,
                        'subtotal' => $subtotal
                    ];
                }

                $discount = $validated['discount_amount'] ?? 0.00;
                $grandTotal = $totalAmount - $discount;

                // 1. Create Invoice (marked as 'paid' instantly)
                $invoice = Invoice::create([
                    'invoice_number' => $invoiceNumber,
                    'student_profile_id' => $validated['student_profile_id'] ?? null,
                    'total_amount' => $totalAmount,
                    'discount_amount' => $discount,
                    'grand_total' => $grandTotal,
                    'status' => 'paid',
                    'due_date' => now(),
                ]);

                // 2. Save items, decrement stock and log movement
                foreach ($itemsData as $data) {
                    $product = $data['product'];

                    // Enforce stock availability
                    if ($product->stock < $data['quantity']) {
                        throw new \Exception("Insufficient stock for product '{$product->name}'. Available: {$product->stock}, Requested: {$data['quantity']}.");
                    }
                    
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'product_id' => $product->id,
                        'description' => "POS Sale: " . $product->name,
                        'quantity' => $data['quantity'],
                        'unit_price' => $data['selling_price'],
                        'total_price' => $data['subtotal'],
                    ]);

                    // Reduce stock count
                    $product->decrement('stock', $data['quantity']);

                    // Create stock movement record
                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'quantity' => -$data['quantity'], // Negative for sales deduction
                        'type' => 'sale',
                        'remarks' => "POS Checkout {$invoiceNumber}",
                    ]);

                    // Accrue the supplying teacher's cut as a payable. Terms are
                    // snapshotted so later edits to the product cannot rewrite
                    // what was already earned.
                    if ($product->teacher_profile_id && $product->teacher_share_percentage > 0) {
                        $share = round(
                            $data['subtotal'] * ($product->teacher_share_percentage / 100),
                            2
                        );

                        TeacherEarning::create([
                            'teacher_profile_id' => $product->teacher_profile_id,
                            'product_id' => $product->id,
                            'invoice_id' => $invoice->id,
                            'quantity' => $data['quantity'],
                            'unit_price' => $data['selling_price'],
                            'share_percentage' => $product->teacher_share_percentage,
                            'amount' => $share,
                            'status' => TeacherEarning::STATUS_PENDING,
                        ]);
                    }
                }

                // 3. Save Payment entry
                $payment = Payment::create([
                    'invoice_id' => $invoice->id,
                    'amount' => $grandTotal,
                    'payment_method' => $validated['payment_method'],
                    'payment_date' => now(),
                ]);

                // 4. Log credit ledger entry (revenue intake)
                $ledger = LedgerEntry::create([
                    'type' => 'credit',
                    'amount' => $grandTotal,
                    'category' => 'revenue',
                    'description' => "POS Register Checkout Sale {$invoiceNumber}",
                    'reference_id' => $payment->id,
                    'reference_type' => 'Payment',
                ]);

                // 5. Log Student Timeline Event
                if ($invoice->student_profile_id) {
                    $itemNames = collect($itemsData)->map(fn($d) => $d['product']->name)->implode(', ');
                    \App\Models\StudentTimelineEvent::logEvent(
                        $invoice->student_profile_id,
                        'payment',
                        "سداد فاتورة مبيعات: {$invoiceNumber}",
                        "تم دفع مبلغ {$grandTotal} جنيه لشراء: {$itemNames}."
                    );
                }

                return [
                    'invoice' => $invoice->load('items'),
                    'payment' => $payment
                ];
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'POS transaction completed successfully.',
            'data' => $receipt
        ], Response::HTTP_CREATED);
    }
}
