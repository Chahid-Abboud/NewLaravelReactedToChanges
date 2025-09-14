<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NearbyController;

Route::get('/nearby', [NearbyController::class, 'index'])->name('api.nearby');
