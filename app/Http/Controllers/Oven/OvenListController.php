<?php

namespace App\Http\Controllers\Oven;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OvenListController extends Controller
{
    public function index(Request $request)
    {

        $bakePackageDetails = DB::connection('mysql')->table('dbakeformtable')->get();


        $ovenStatus = DB::connection('mysql')
            ->table('oven_status')
            ->get()
            ->keyBy('oven_name');

        $ovenList = DB::connection('server25')
            ->table('machine_non_tnr_list')
            ->select('machine_num')
            ->whereIn('remarks', ['ACTIVE', 'active', 'Active'])
            ->where('machine_name', 'like', '%oven%')
            ->get();

        $user = 'SYSTEM';

        $defaultChambers = [
            "chamber-001",
            "chamber-002",
            "chamber-003",
        ];

        foreach ($ovenList as $oven) {
            $exists = DB::connection('mysql')
                ->table('oven_status')
                ->where('oven_name', $oven->machine_num)
                ->exists();

            if (!$exists) {
                DB::connection('mysql')
                    ->table('oven_status')
                    ->insert([
                        'oven_name'  => $oven->machine_num,
                        'chamber'    => json_encode($defaultChambers),
                        'status'     => 'idle',
                        'created_by' => $user,
                    ]);
            }
        }

        /*
    |----------------------------------------
    | 🔥 GET LATEST PER OVEN + CHAMBER
    |----------------------------------------
    */
        $records = DB::connection('mysql')
            ->table('dbakeformtable')
            ->where('bake_status', '!=', 'complete')
            ->orderBy('date_time_in', 'desc')
            ->get();

        $now = now();

        $ovenDetails = $records
            ->groupBy(function ($item) {
                return $item->oven_num . '_' . $item->chamber;
            })
            ->map(function ($group) use ($now) {

                $latest = $group->first();

                $start = \Carbon\Carbon::parse($latest->date_time_in);
                $end   = \Carbon\Carbon::parse($latest->date_time_out);

                $status = strtolower($latest->bake_status ?? 'idle');

                if ($status === 'inuse') {
                    $diffMinutes = $now->diffInMinutes($end, false);

                    if ($now >= $end) {
                        $status = 'unloading';
                    } elseif ($diffMinutes <= 30) {
                        $status = '30min_before_unload';
                    }
                }

                return [
                    'id' => $latest->id,
                    'oven' => $latest->oven_num,
                    'chamber' => $latest->chamber,
                    'temperature' => $latest->temperature,
                    'start' => $latest->date_time_in,
                    'end' => $latest->date_time_out,
                    'status' => $status,
                    'cooldown_end' => $latest->cooldown_end ?? null,
                ];
            })
            ->values();

        return Inertia::render('Oven/OvenList', [
            'ovenList' => $ovenList,
            'ovenDetails' => $ovenDetails,
            'ovenStatus' => $ovenStatus,
            'bakePackageDetails' => $bakePackageDetails
        ]);
    }

    public function startCooldown(Request $request, $id)
    {
        $userId = session('emp_data')['emp_id'] ?? 'SYSTEM';

        DB::table('dbakeformtable')
            ->where('id', $id)
            ->update([
                'cooldown_by' => $userId,
                'cooldown_end' => now()->addHour(),
                'bake_status' => 'cooldown'
            ]);

        $dbakeRecord = DB::table('dbakeformtable')->where('id', $id)->first();

        DB::connection('mysql')->table('drybake_history')->insert([
            'dbakeformtable_id' => $dbakeRecord->id,
            'oven_num' => $dbakeRecord->oven_num,
            'lotid' => $dbakeRecord->lotid,
            'package' => $dbakeRecord->package,
            'partname' => $dbakeRecord->partname,
            'quantity' => $dbakeRecord->quantity,
            'chamber' => $dbakeRecord->chamber,
            'input_type' => $dbakeRecord->input_type,
            'approved_status' => $dbakeRecord->approved_status,
            'temperature' => $dbakeRecord->temperature,
            'hours' => $dbakeRecord->hours,
            'date_time_in' => $dbakeRecord->date_time_in,
            'operator_in' => $dbakeRecord->operator_in,
            'date_time_out' => $dbakeRecord->date_time_out,
            'old_date_time_out' => $dbakeRecord->old_date_time_out,
            'confirmed_data' => $dbakeRecord->confirmed_data,
            'operator_out' => $dbakeRecord->operator_out,
            'bake_status' => 'cooldown',
            'approved_by' => $dbakeRecord->approved_by,
            'added_by' => $dbakeRecord->added_by,
            'cooldown_by' => $userId,
            'cooldown_end' => $dbakeRecord->cooldown_end,
            'date_created' => now(),
        ]);

        return back();
    }

    public function extendTime(Request $request, $id)
{
    $request->validate([
        'add_seconds' => 'required|integer|min=1',
    ]);

    $record = DB::table('dbakeformtable')->where('id', $id)->first();

    // Only extend if the bake is still active (not completed/interrupted)
    if (!in_array($record->bake_status, ['inuse', 'ongoing', 'active'])) {
        return response()->json([
            'success' => false,
            'message' => 'Bake record is not active.',
        ], 422);
    }

    $addSeconds = (int) $request->add_seconds;

    // Save old date_time_out before modifying (for audit trail)
    $record->old_date_time_out = $record->date_time_out;

    // Add elapsed drop time to date_time_out
    $record->date_time_out = \Carbon\Carbon::parse($record->date_time_out)
        ->addSeconds($addSeconds);

    $record->save();

    return response()->json([
        'success'          => true,
        'message'          => "Extended date_time_out by {$addSeconds} seconds due to temperature drop.",
        'added_seconds'    => $addSeconds,
        'old_date_time_out'=> $record->old_date_time_out,
        'new_date_time_out'=> $record->date_time_out,
    ]);
}
}
