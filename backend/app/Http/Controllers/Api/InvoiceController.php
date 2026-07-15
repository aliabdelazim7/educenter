<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\LedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['studentProfile.user', 'payments']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->latest()->get();

        return response()->json(['data' => $invoices]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_profile_id' => ['nullable', 'uuid', 'exists:student_profiles,id'],
            'parent_id' => ['nullable', 'uuid', 'exists:users,id'],
            'due_date' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'uuid', 'exists:products,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $invoice = DB::transaction(function () use ($validated) {
            // Generate unique sequential invoice number
            $count = Invoice::withTrashed()->count();
            $invoiceNumber = 'INV-' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

            // Compute amounts
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $discount = $validated['discount_amount'] ?? 0.00;
            $tax = $validated['tax_amount'] ?? 0.00;
            $grandTotal = $totalAmount - $discount + $tax;

            // Create Invoice
            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'student_profile_id' => $validated['student_profile_id'] ?? null,
                'parent_id' => $validated['parent_id'] ?? null,
                'total_amount' => $totalAmount,
                'discount_amount' => $discount,
                'tax_amount' => $tax,
                'grand_total' => $grandTotal,
                'status' => 'unpaid',
                'due_date' => $validated['due_date'],
            ]);

            // Save items
            foreach ($validated['items'] as $item) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return $invoice;
        });

        return response()->json([
            'message' => 'Invoice generated successfully.',
            'data' => $invoice->load('items')
        ], Response::HTTP_CREATED);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json(['data' => $invoice->load(['items.product', 'payments'])]);
    }

    /**
     * Record a payment against an invoice.
     */
    public function recordPayment(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'in:cash,card,bank_transfer'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
        ]);

        $payment = DB::transaction(function () use ($validated, $invoice) {
            // Save payment
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'payment_date' => now(),
            ]);

            // Recalculate invoice status
            $totalPaid = $invoice->payments()->sum('amount');
            
            if ($totalPaid >= $invoice->grand_total) {
                $invoice->update(['status' => 'paid']);
            } elseif ($totalPaid > 0) {
                $invoice->update(['status' => 'partially_paid']);
            } else {
                $invoice->update(['status' => 'unpaid']);
            }

            // Write credit ledger entry (revenue intake)
            LedgerEntry::create([
                'type' => 'credit',
                'amount' => $validated['amount'],
                'category' => 'revenue',
                'description' => "Payment received for invoice {$invoice->invoice_number}",
                'reference_id' => $payment->id,
                'reference_type' => 'Payment',
            ]);

            return $payment;
        });

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'data' => $payment,
            'invoice_status' => $invoice->status
        ]);
    }
}
