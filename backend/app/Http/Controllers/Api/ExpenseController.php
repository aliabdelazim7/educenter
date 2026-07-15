<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\LedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ExpenseController extends Controller
{
    public function index(): JsonResponse
    {
        $expenses = Expense::latest()->get();
        return response()->json(['data' => $expenses]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'category' => ['required', 'string', 'in:rent,salaries,utility,marketing,other'],
            'description' => ['required', 'string', 'max:500'],
            'expense_date' => ['required', 'date'],
        ]);

        $expense = DB::transaction(function () use ($validated) {
            $expense = Expense::create($validated);

            // Record debit ledger entry (expense outflow)
            LedgerEntry::create([
                'type' => 'debit',
                'amount' => $validated['amount'],
                'category' => 'expense',
                'description' => "Expense logged: " . $validated['description'],
                'reference_id' => $expense->id,
                'reference_type' => 'Expense',
            ]);

            return $expense;
        });

        return response()->json([
            'message' => 'Expense recorded successfully.',
            'data' => $expense
        ], Response::HTTP_CREATED);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json(['data' => $expense]);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'category' => ['required', 'string', 'in:rent,salaries,utility,marketing,other'],
            'description' => ['required', 'string', 'max:500'],
            'expense_date' => ['required', 'date'],
        ]);

        DB::transaction(function () use ($validated, $expense) {
            $oldAmount = $expense->amount;
            $expense->update($validated);

            // Adjust ledger entry
            $ledger = LedgerEntry::where('reference_id', $expense->id)
                ->where('reference_type', 'Expense')
                ->first();

            if ($ledger) {
                $ledger->update([
                    'amount' => $validated['amount'],
                    'description' => "Expense logged: " . $validated['description'],
                ]);
            }
        });

        return response()->json([
            'message' => 'Expense updated successfully.',
            'data' => $expense
        ]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        DB::transaction(function () use ($expense) {
            $expense->delete();

            // Void associated ledger entry
            LedgerEntry::where('reference_id', $expense->id)
                ->where('reference_type', 'Expense')
                ->delete();
        });

        return response()->json(['message' => 'Expense deleted successfully.']);
    }
}
