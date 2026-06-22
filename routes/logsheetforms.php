<?php

use App\Http\Controllers\LogsheetForms\DryBakeController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LogsheetForms\LogsheetFormController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::get("/bakeform", [LogsheetFormController::class, 'index'])->name('forms.index');

  Route::get('/dry-bake', [DryBakeController::class, 'index'])->name('dry-bake.index');
  // Route::post('/dry-bake/store', [DryBakeController::class, 'store'])->name('dry-bake.bulk-store');
  Route::get('/dry-bake/search-lot', [DryBakeController::class, 'searchLot'])->name('dry-bake.search-lot');
  Route::get('/dry-bake/interrupted', [DryBakeController::class, 'interrupted'])->name('dry-bake.interrupted');
  Route::post('/dry-bake/bulk', [DryBakeController::class, 'bulkStore'])
    ->name('dry-bake.bulk-store');

  Route::post('/qa/approve', [DryBakeController::class, 'approve'])->name('qa.approve');
});
