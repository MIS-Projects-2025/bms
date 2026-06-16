<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class SmartDacController extends Controller
{
    public function index()
    {

        return Inertia::render('TemperatureDashboard');
    }
}
