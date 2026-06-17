<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DryBakeForm;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Dashboard');
    }

    public function data(Request $request)
    {
        try {
            return response()->json([
                'trend' => $this->trendData($request->trend),
                'package' => $this->packageData($request->package),
                'oven' => $this->ovenData($request->oven),
                'input' => $this->inputData($request->input),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getFormat($filter)
    {
        return match ($filter) {
            'monthly' => '%Y-%m',
            'yearly' => '%Y',
            default => '%Y-%m-%d',
        };
    }

    /** GRAPH 1 */
    private function trendData($filter)
    {
        $format = $this->getFormat($filter);

        return DryBakeForm::select(
            DB::raw("DATE_FORMAT(date_time_in, '{$format}') as label"),
            DB::raw("SUM(quantity + 0) as total_qty")
        )
            ->whereNotNull('date_time_in')
            ->groupBy(DB::raw("DATE_FORMAT(date_time_in, '{$format}')"))
            ->orderBy('label')
            ->get();
    }

    /** GRAPH 2 */
    private function packageData($filter)
    {
        $format = $this->getFormat($filter);

        return DryBakeForm::select(
            'package',
            DB::raw("DATE_FORMAT(date_time_in, '{$format}') as label"),
            DB::raw("SUM(quantity + 0) as total_qty")
        )
            ->where('bake_status', 'complete')
            ->whereNotNull('date_time_in')
            ->groupBy(
                'package',
                DB::raw("DATE_FORMAT(date_time_in, '{$format}')")
            )
            ->orderBy('label')
            ->get();
    }

    /** GRAPH 3 */
    private function ovenData($filter)
    {
        $format = $this->getFormat($filter);

        return DryBakeForm::select(
            'oven_num',
            DB::raw("DATE_FORMAT(date_time_in, '{$format}') as label"),
            DB::raw("COUNT(*) as total_count")
        )
            ->where('bake_status', 'complete')
            ->whereNotNull('date_time_in')
            ->groupBy('oven_num', DB::raw("DATE_FORMAT(date_time_in, '{$format}')"))
            ->orderBy('label')
            ->get();
    }

    /** GRAPH 4 */
    private function inputData($filter)
    {
        $format = $this->getFormat($filter);

        return DryBakeForm::select(
            'input_type',
            DB::raw("DATE_FORMAT(date_time_in, '{$format}') as label"),
            DB::raw("SUM(quantity + 0) as total_qty")
        )
            ->where('bake_status', 'complete')
            ->whereNotNull('date_time_in')
            ->groupBy(
                'input_type',
                DB::raw("DATE_FORMAT(date_time_in, '{$format}')")
            )
            ->orderBy('label')
            ->get();
    }
}
