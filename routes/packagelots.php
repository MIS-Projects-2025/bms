<?php

use App\Http\Controllers\PackageLots\PackageLotsController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {
    Route::get("/packagelots", [PackageLotsController::class, 'index'])->name('partnames.index');
  });



  Route::get("/packagelots/history", [PackageLotsController::class, 'history'])->name('package.history.index');

  Route::get('/package-history/timeline', [PackageLotsController::class, 'timeline'])
    ->name('package.history.timeline');
});
