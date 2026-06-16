<?php

namespace App\Http\Controllers;

use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OvenListStatusController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {
        $result = $this->datatable->handle(
            $request,
            'mysql',
            'oven_status',
            [
                'conditions' => function ($query) {
                    return $query
                        ->orderBy('id', 'desc');
                },

                'searchColumns' => ['oven_name', 'chamber', 'status'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('OvenListStatus', [
            'tableData' => $result['data'],
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
            ]),
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'chamber' => 'nullable',
            'status' => 'required|string',
        ]);

        DB::connection('mysql')
            ->table('oven_status')
            ->where('id', $id)
            ->update([
                'chamber' => is_array($validated['chamber'])
                    ? json_encode($validated['chamber'])
                    : $validated['chamber'],

                'status' => $validated['status'],
                'updated_by' => session('emp_data')['emp_id'] ?? null,
            ]);

        return back()->with('success', 'Updated successfully');
    }

    public function update_status(Request $request, $ovenName)
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'add_seconds' => 'nullable|numeric|min:0',
        ]);

        $newStatus = $validated['status'];

        $dbakeRecord = DB::table('dbakeformtable')
            ->where('bake_status', 'inuse')
            ->where('oven_num', $ovenName)->first();


        /*
        | =========================
        | CASE 1: SHUTDOWN (STOP)
        | =========================
        */
        if ($newStatus === 'shutdown') {

            $interrupted = DB::connection('mysql')
                ->table('dbakeformtable')
                ->where('oven_num', $ovenName)
                ->where('bake_status', 'inuse')
                ->get();

            DB::connection('mysql')
                ->table('dbakeformtable')
                ->where('oven_num', $ovenName)
                ->where('bake_status', 'inuse')
                ->update([
                    'bake_status' => 'interrupted',
                ]);

            foreach ($interrupted as $row) {

                DB::connection('mysql')->table('drybake_history')->insert([
                    'dbakeformtable_id' => $row->id,
                    'oven_num' => $row->oven_num,
                    'lotid' => $row->lotid,
                    'package' => $row->package,
                    'partname' => $row->partname,
                    'quantity' => $row->quantity,
                    'chamber' => $row->chamber,
                    'input_type' => $row->input_type,
                    'temperature' => $row->temperature,
                    'approved_status' => $row->approved_status,
                    'hours' => $row->hours,
                    'date_time_in' => $row->date_time_in,
                    'operator_in' => $row->operator_in,
                    'date_time_out' => $row->date_time_out,
                    'old_date_time_out' => $row->old_date_time_out,
                    'confirmed_data' => $row->confirmed_data,
                    'operator_out' => $row->operator_out,
                    'bake_status' => 'interrupted',
                    'approved_by' => $row->approved_by,
                    'added_by' => $row->added_by,
                    'cooldown_end' => $row->cooldown_end,
                    'cooldown_by' => $row->cooldown_by,
                    'date_created' => now(),
                ]);
            }

            DB::connection('mysql')
                ->table('oven_status')
                ->where('oven_name', $ovenName)
                ->update([
                    'status' => 'shutdown',
                    'updated_by' => session('emp_data')['emp_id'] ?? null,
                ]);

            return back();
        }

        /*
        | =========================
        | CASE 2: RESUME (SHUTDOWN → IDLE CLICK)
        | =========================
        */
        if ($newStatus === 'idle') {

            // 🔍 kunin lahat ng interrupted chambers
            $interrupted = DB::connection('mysql')
                ->table('dbakeformtable')
                ->where('oven_num', $ovenName)
                ->where('bake_status', 'interrupted')
                ->get();

            if ($interrupted->count() > 0) {

                $addSeconds = $validated['add_seconds'] ?? 0;

                foreach ($interrupted as $ch) {

                    $now = now();

                    $oldEnd = \Carbon\Carbon::parse($ch->date_time_out);

                    // remaining time
                    $remainingSeconds = max(0, $oldEnd->diffInSeconds($now, false) * -1);

                    // 🔥 WITH ADD SECONDS
                    $newEnd = $now->copy()
                        ->addSeconds($remainingSeconds)
                        ->addSeconds($addSeconds);

                    DB::connection('mysql')
                        ->table('dbakeformtable')
                        ->where('id', $ch->id)
                        ->update([
                            'bake_status' => 'inuse',
                            'date_time_out' => $newEnd,
                            'old_date_time_out' => $oldEnd,
                        ]);

                    DB::connection('mysql')->table('drybake_history')->insert([
                        'dbakeformtable_id' => $ch->id,
                        'oven_num' => $ch->oven_num,
                        'lotid' => $ch->lotid,
                        'package' => $ch->package,
                        'partname' => $ch->partname,
                        'quantity' => $ch->quantity,
                        'chamber' => $ch->chamber,
                        'input_type' => $ch->input_type,
                        'temperature' => $ch->temperature,
                        'hours' => $ch->hours,
                        'date_time_in' => $ch->date_time_in,
                        'date_time_out' => $newEnd,
                        'old_date_time_out' => $oldEnd,
                        'operator_in' => $ch->operator_in,
                        'approved_status' => $ch->approved_status,
                        'bake_status' => 'inuse',
                        'approved_by' => $ch->approved_by,
                        'cooldown_by' => $ch->cooldown_by,
                        'confirmed_data' => $ch->confirmed_data,
                        'added_by' => $ch->added_by,
                        'date_created' => now(),
                    ]);
                }

                // 🔥 may ongoing pa → dapat INUSE
                DB::connection('mysql')
                    ->table('oven_status')
                    ->where('oven_name', $ovenName)
                    ->update([
                        'status' => 'inuse',
                        'updated_by' => session('emp_data')['emp_id'] ?? null,
                    ]);
            } else {
                // 🔥 walang interrupted → idle lang
                DB::connection('mysql')
                    ->table('oven_status')
                    ->where('oven_name', $ovenName)
                    ->update([
                        'status' => 'idle',
                        'updated_by' => session('emp_data')['emp_id'] ?? null,
                    ]);
            }

            return back();
        }
    }

    public function markComplete($id)
    {
        // 🔍 Step 1: kunin yung record
        $record = DB::connection('mysql')
            ->table('dbakeformtable')
            ->where('id', $id)
            ->first();

        if (!$record) {
            return back()->with('error', 'Record not found');
        }

        $ovenNum = $record->oven_num;
        $chamber = $record->chamber;
        $bakeHours = $record->hours;
        // $lotsIn = $record->lots_in;
        $temperature = $record->temperature;
        $userId = session('emp_data')['emp_id'] ?? 'SYSTEM';

        // 🔥 Step 2: update this chamber to COMPLETE
        DB::connection('mysql')
            ->table('dbakeformtable')
            ->where('id', $id)
            ->update([
                'bake_status' => 'complete',
                'operator_out' => session('emp_data')['emp_id'] ?? null,
            ]);

        $dbakeRecords = DB::table('dbakeformtable')->where('id', $id)->first();

        DB::connection('mysql')->table('drybake_history')->insert([
            'dbakeformtable_id' => $dbakeRecords->id,
            'oven_num' => $dbakeRecords->oven_num,
            'lotid' => $dbakeRecords->lotid,
            'package' => $dbakeRecords->package,
            'partname' => $dbakeRecords->partname,
            'quantity' => $dbakeRecords->quantity,
            'chamber' => $dbakeRecords->chamber,
            'input_type' => $dbakeRecords->input_type,
            'approved_status' => $dbakeRecords->approved_status,
            'temperature' => $dbakeRecords->temperature,
            'hours' => $dbakeRecords->hours,
            'date_time_in' => $dbakeRecords->date_time_in,
            'operator_in' => $dbakeRecords->operator_in,
            'date_time_out' => $dbakeRecords->date_time_out,
            'old_date_time_out' => $dbakeRecords->old_date_time_out,
            'confirmed_data' => $dbakeRecords->confirmed_data,
            'operator_out' => session('emp_data')['emp_id'] ?? null,
            'bake_status' => 'complete',
            'approved_by' => $dbakeRecords->approved_by,
            'added_by' => $dbakeRecords->added_by,
            'cooldown_by' => $dbakeRecords->cooldown_by,
            'cooldown_end' => $dbakeRecords->cooldown_end,
            'date_created' => now(),
        ]);

        // 🔍 Step 3: check kung may natitirang IN USE sa same oven
        $stillInUse = DB::connection('mysql')
            ->table('dbakeformtable')
            ->where('oven_num', $ovenNum)
            ->whereIn('bake_status', ['inuse', 'cooldown']) // inuse, interrupted, cooldown'inuse')
            ->exists();

        // 🔥 Step 4: if wala nang inuse → set oven to IDLE
        if (!$stillInUse) {
            DB::connection('mysql')
                ->table('oven_status')
                ->where('oven_name', $ovenNum)
                ->update([
                    'status' => 'idle',
                    'updated_by' => 'SYSTEM',
                ]);
        }

        // ========== Transaction History ==========

        DB::table('oven_history')->insert([
            'oven_name' => $ovenNum,
            'chamber' => $chamber,
            'bake_hours' => $bakeHours,
            // 'lot_in' => $lotsIn,
            'temperature' => $temperature,
            'status' => 'inuse',
            'activity' => 'transaction out',
            'performed_by' => $userId,
        ]);

        return back()->with('success', 'Chamber marked as complete');
    }

        public function extendTime(Request $request, $id)
{
    $request->validate([
        'add_seconds' => 'required|integer|min:1',
    ]);

    $record = DB::table('dbakeformtable')->where('id', $id)->first();

    // Only extend if the bake is still active (not completed/interrupted)
    if (!in_array($record->bake_status, ['inuse', 'ongoing', 'active', 'interrupted'])) {
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
