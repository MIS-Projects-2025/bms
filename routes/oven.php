<?php


use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Oven\OvenListController;
use App\Http\Controllers\OvenListStatusController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {

    Route::get("/oven-list", [OvenListStatusController::class, 'index'])->name('ovenlist.index');

    Route::put('/ovenlist/update/{id}', [OvenListStatusController::class, 'update'])->name('ovenlist.update');

    Route::put('/ovenlist/update-status/{ovenName}', [OvenListStatusController::class, 'update_status'])->name('ovenstatus.update');

    Route::put('/ovenlist/update-shutdown/{ovenName}', [OvenListStatusController::class, 'update_status'])->name('ovenstatus.shutdown');
  });

  Route::get("/oven", [OvenListController::class, 'index'])->name('oven.index');

  Route::put('/bake/complete/{id}', [OvenListStatusController::class, 'markComplete'])->name('bake.complete');

  Route::put('/bake/{id}/cooldown', [OvenListController::class, 'startCooldown'])->name('bake.cooldown');

  // routes/web.php
  Route::put('/bake/{id}/extend', [OvenListController::class, 'extendTime'])->name('bake.extend');
});
