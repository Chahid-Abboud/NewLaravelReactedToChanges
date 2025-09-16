<?php

namespace App\Http\Controllers;

use App\Models\Food;
use Illuminate\Http\Request;

class FoodController extends Controller
{
    public function search(Request $request)
    {
        $q = (string) $request->query('q', '');
        $category = (string) $request->query('category', '');

        $foods = Food::query()
            ->when($category !== '', fn ($qq) => $qq->where('category', $category))
            ->when($q !== '', fn ($qq) => $qq->where('name', 'like', "%{$q}%"))
            ->orderBy('name')
            ->paginate(15);

        $foods->getCollection()->transform(function ($f) {
            return [
                'id'            => $f->id,
                'name'          => $f->name,
                'category'      => $f->category,
                'serving_size'  => (float) $f->serving_size,
                'serving_unit'  => $f->serving_unit,
                'calories_kcal' => (float) $f->calories_kcal,
                'protein_g'     => (float) $f->protein_g,
                'carbs_g'       => (float) $f->carbs_g,
                'fat_g'         => (float) $f->fat_g,
            ];
        });

        return response()->json($foods);
    }
}
