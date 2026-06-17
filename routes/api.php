<?php
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SmartDacController;
use App\Http\Controllers\SmartDacApiController;

Route::get('/temperature-dashboard', [SmartDacController::class, 'index'])->name('temperature.index');
Route::get('/api/smartdac/temperatures', [SmartDacApiController::class, 'temperatures']);
