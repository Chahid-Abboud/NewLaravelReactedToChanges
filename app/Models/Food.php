<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Food extends Model
{
    // IMPORTANT: tell Eloquent the correct table
    protected $table = 'foods';

    protected $fillable = [
        'name','category','serving_size','serving_unit',
        'calories_kcal','protein_g','carbs_g','fat_g','fiber_g','sugar_g','sodium_mg'
    ];

    public function entries(): HasMany
    {
        return $this->hasMany(MealEntry::class);
    }
}
