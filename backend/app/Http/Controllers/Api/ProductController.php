<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\InventoryMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::latest()->get();
        return response()->json(['data' => $products]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:100'],
            'type' => ['required', 'string', 'in:product,book,material,subscription'],
            'purchase_cost' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = DB::transaction(function () use ($validated) {
            $product = Product::create($validated);

            // Record initial stock if greater than 0
            $initialStock = $validated['stock'] ?? 0;
            if ($initialStock > 0) {
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'quantity' => $initialStock,
                    'type' => 'purchase',
                    'remarks' => 'Initial stock intake upon product creation',
                ]);
            }

            return $product;
        });

        return response()->json([
            'message' => 'Product created successfully.',
            'data' => $product
        ], Response::HTTP_CREATED);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['data' => $product]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:100'],
            'type' => ['required', 'string', 'in:product,book,material,subscription'],
            'purchase_cost' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $product
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully.']);
    }

    /**
     * Adjust stock levels manually.
     */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer'], // positive or negative
            'type' => ['required', 'string', 'in:purchase,sale,adjustment,damage'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $adjustedProduct = DB::transaction(function () use ($validated, $product) {
            InventoryMovement::create([
                'product_id' => $product->id,
                'quantity' => $validated['quantity'],
                'type' => $validated['type'],
                'remarks' => $validated['remarks'] ?? null,
            ]);

            // Recalculate and update stock count
            $product->increment('stock', $validated['quantity']);

            return $product;
        });

        return response()->json([
            'message' => 'Stock adjusted successfully.',
            'data' => $adjustedProduct
        ]);
    }
}
