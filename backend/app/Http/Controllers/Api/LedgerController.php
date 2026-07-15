<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    /**
     * List all ledger transactions and display summary balance sheet metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = LedgerEntry::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Clone base query to compute summaries prior to type restriction
        $summaryQuery = clone $query;

        $totalCredits = (clone $summaryQuery)->where('type', 'credit')->sum('amount');
        $totalDebits = (clone $summaryQuery)->where('type', 'debit')->sum('amount');
        $netBalance = $totalCredits - $totalDebits;

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $entries = $query->latest()->get();

        return response()->json([
            'summary' => [
                'total_revenue' => (float) $totalCredits,
                'total_expenses' => (float) $totalDebits,
                'net_profit' => (float) $netBalance,
            ],
            'data' => $entries
        ]);
    }
}
