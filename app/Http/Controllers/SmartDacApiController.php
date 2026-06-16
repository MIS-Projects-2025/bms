<?php

namespace App\Http\Controllers;

use App\Services\SmartDacService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use App\Models\SmartdacReading;

class SmartDacApiController extends Controller
{
    protected SmartDacService $smartdac;

    public function __construct(SmartDacService $smartdac)
    {
        $this->smartdac = $smartdac;
    }

    /**
     * API endpoint for React dashboard
     */


public function temperatures(): JsonResponse
    {
    $data = $this->smartdac->getTemperatures();

    // SAVE TO DB
    // foreach ($data as $row) {
    //     SmartdacReading::create([
    //         'channel' => $row['channel'],
    //         'status' => $row['status'] ?? null,
    //         'temperature' => $row['temperature'] ?? null,
    //         'is_valid' => $row['is_valid'] ?? true,
    //         'recorded_at' => now(),
    //     ]);
    // }

        return response()->json([
            'success' => true,
            'timestamp' => now()->toDateTimeString(),
            'count' => count($data),
            'data' => $data,
        ]);
}


}
