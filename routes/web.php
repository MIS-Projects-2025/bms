<?php

use App\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;

$app_name = env('APP_NAME', '');

// Authentication routes
require __DIR__ . '/auth.php';

// General routes
require __DIR__ . '/general.php';

// Oven routes
require __DIR__ . '/oven.php';

// Logsheet routes
require __DIR__ . '/logsheetforms.php';

// Package lot routes
require __DIR__ . '/packagelots.php';

// Temp API
require __DIR__ . '/api.php';



Route::get("/dashboard/data", [DashboardController::class, 'data']);


Route::fallback(function () {
    return Inertia::render('404');
})->name('404');
