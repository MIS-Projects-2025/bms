<?php

namespace App\Http\Controllers\LogsheetForms;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\DryBakeForm;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;
use Carbon\Carbon;


class DryBakeController extends Controller
{
   public function index()
{
    $chambers = DB::connection('mysql')->table('oven_status')
        ->where('status', '!=', 'shutdown')
        ->get()
        ->map(fn($item) => [
            'oven_name' => $item->oven_name,
            'chamber'   => $item->chamber,
        ])
        ->values();

    $ovens = DB::connection('mysql')->table('oven_status')
        ->where('status', '!=', 'shutdown')
        ->pluck('oven_name');

    // ✅ packageLots ay wala na dito — fetch na lang on demand
    return Inertia::render('LogsheetForms/DryBakeForm', [
        'chambers' => $chambers,
        'ovens'    => $ovens,
    ]);
}

// Bagong endpoint — tinatawag lang kapag may lot_id
public function searchLot(Request $request)
{
    $lotId = trim($request->query('lot_id', ''));

    if (!$lotId) {
        return response()->json([]);
    }

    $results = DB::connection('ppc')->table('customer_data_wip')
        ->selectRaw('
            TRIM(Lot_Id)       as Lot_Id,
            TRIM(Part_Name)    as Part_Name,
            TRIM(Package_Name) as Package_Name,
            Qty,
            Bake_Time_Temp
        ')
        ->where('Lot_Id', 'like', "%{$lotId}%")
        ->groupBy('Lot_Id', 'Part_Name', 'Package_Name', 'Qty', 'Bake_Time_Temp')
        ->limit(20) // para hindi bumagsak ang query
        ->get();

    return response()->json($results);
}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'oven' => 'required',
            'temperature' => 'required|numeric',
            'time' => 'required|numeric',
            'lotid' => 'required',
            'partname' => 'required',
            'package' => 'required',
            'qty' => 'required|numeric',
            'chamber' => 'required',
            'startDateTime' => 'required|date',
        ]);

        DB::beginTransaction();

        try {

            $userId = session('emp_data')['emp_id'];

            // ⏱ compute end datetime (same logic mo sa PHP)
            $start = Carbon::parse($validated['startDateTime']);
            $end = (clone $start)->addHours($validated['time']);

            // 💾 insert main record
            $form = DryBakeForm::create([
                'oven_num' => $validated['oven'],
                'lotid' => $validated['lotid'],
                'package' => $validated['package'],
                'partname' => $validated['partname'],
                'quantity' => $validated['qty'],
                'chamber' => $validated['chamber'],
                'temperature' => $validated['temperature'],
                'hours' => $validated['time'],
                'date_time_in' => $start,
                'date_time_out' => $end,
                'operator_in' => $userId,
                'approved_status' => 'pending',
                'bake_status' => 'waiting',
                'confirmed_data' => 0,
                'added_by' => $userId,
                'date_created' => now(),
            ]);

            DB::commit();

            return back()->with('success', 'Data successfully saved');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'message' => 'Something went wrong inserting data',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'data' => 'required|array|min:1',
            'data.*.oven' => 'required',
            'data.*.temperature' => 'required|numeric',
            'data.*.time' => 'required|numeric',
            'data.*.lotid' => 'required',
            'data.*.partname' => 'required',
            'data.*.package' => 'required',
            'data.*.qty' => 'required|numeric',
            'data.*.chamber' => 'required',
            'data.*.input_type' => 'required',
            'data.*.startDateTime' => 'required|date',
        ]);

        DB::beginTransaction();

        try {
            $userId = session('emp_data')['emp_id'] ?? 'SYSTEM';

            /*
        |--------------------------------------------------------------------------
        | 🔥 1. INSERT ALL ROWS (DETAIL TABLE)
        |--------------------------------------------------------------------------
        */
            foreach ($request->data as $row) {

                $hours = (float) $row['time'];
                $temperature = (float) $row['temperature'];
                $quantity = (int) $row['qty'];

                $start = Carbon::parse($row['startDateTime']);
                $end = (clone $start)->addHours($hours);

                $created = DryBakeForm::create([
                    'oven_num' => $row['oven'],
                    'lotid' => $row['lotid'],
                    'package' => $row['package'],
                    'partname' => $row['partname'],
                    'quantity' => $quantity,
                    'chamber' => $row['chamber'],
                    'input_type' => $row['input_type'],
                    'temperature' => $temperature,
                    'hours' => $hours,
                    'date_time_in' => $start,
                    'date_time_out' => $end,
                    'operator_in' => $userId,
                    'approved_status' => 'pending',
                    'bake_status' => 'inuse',
                    'confirmed_data' => 1,
                    'added_by' => $userId,
                    'date_created' => now(),
                ]);

                DB::connection('mysql')->table('drybake_history')->insert([
                    'dbakeformtable_id' => $created->id,
                    'oven_num' => $row['oven'],
                    'lotid' => $row['lotid'],
                    'package' => $row['package'],
                    'partname' => $row['partname'],
                    'quantity' => $quantity,
                    'chamber' => $row['chamber'],
                    'input_type' => $row['input_type'],
                    'temperature' => $temperature,
                    'hours' => $hours,
                    'date_time_in' => $start,
                    'date_time_out' => $end,
                    'operator_in' => $userId,
                    'approved_status' => 'pending',
                    'bake_status' => 'inuse',
                    'confirmed_data' => 1,
                    'added_by' => $userId,
                    'date_created' => now(),
                ]);
            }



            /*
        |--------------------------------------------------------------------------
        | 🔥 2. GROUP BY OVEN ONLY (IMPORTANT FIX)
        |--------------------------------------------------------------------------
        */
            $grouped = collect($request->data)->groupBy('oven');

            /*
        |--------------------------------------------------------------------------
        | 🔥 3. INSERT SUMMARY TABLES
        |--------------------------------------------------------------------------
        */
            foreach ($grouped as $oven => $rows) {

                // ✅ UNIQUE LOT COUNT
                $lotsIn = $rows->pluck('lotid')->unique()->count();

                // reference row
                $first = $rows->first();

                $temperature = (float) $first['temperature'];
                $hours = (float) $first['time'];

                $start = Carbon::parse($first['startDateTime']);
                $end = (clone $start)->addHours($hours);

                DB::table('oven_dtable')->insert([
                    'OVEN_NAME' => $oven,
                    'LOTS_IN' => $lotsIn,
                    'TEMPERATURE' => $temperature,
                    'STATUS' => 'inuse',
                    'DATE_TIME_IN' => $start,
                    'DATE_TIME_OUT' => $end,
                ]);

                DB::table('oven_monitoring')->insert([
                    'OVEN_NAME' => $oven,
                    'LOTS_IN' => $lotsIn,
                    'TEMPERATURE' => $temperature,
                    'STATUS' => 'inuse',
                    'DATE_CREATED' => now(),
                ]);

                // ========== Transaction History ==========

                DB::table('oven_history')->insert([
                    'oven_name' => $oven,
                    'chamber' => $row['chamber'],
                    'bake_hours' => $hours,
                    'lot_in' => $lotsIn,
                    'temperature' => $temperature,
                    'status' => 'inuse',
                    'activity' => 'transaction in',
                    'performed_by' => $userId,
                ]);

                // ++++++ UPDATE OVEN STATUS ++++++

                DB::table('oven_status')
                    ->where('oven_name', $oven)
                    ->update([
                        'status' => 'inuse',
                        'updated_by' => $userId,
                    ]);
            }

            DB::commit();

            return back()->with('success', 'Bulk saved successfully');
        } catch (\Exception $e) {

            DB::rollBack();

            return back()->withErrors([
                'message' => 'Bulk insert failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function confirmDryBakeForm(Request $request)
    {
        DB::beginTransaction();

        try {

            $oven = $request->oven;
            $dateTimesIn = $request->dateTimesIn;
            $temperatures = $request->temperatures;

            $now = now();

            foreach ($dateTimesIn as $key => $dateTimeIn) {

                $status = ($dateTimeIn <= $now)
                    ? 'ongoing'
                    : 'waiting';

                // update bake form
                DryBakeForm::where('oven_num', $oven)
                    ->where('confirmed_data', 0)
                    ->where('date_time_in', $dateTimeIn)
                    ->update([
                        'confirmed_data' => 1,
                        'bake_status' => $status
                    ]);

                // get summary
                $summary = DryBakeForm::where('oven_num', $oven)
                    ->where('date_time_in', $dateTimeIn)
                    ->selectRaw('COUNT(lotid) as total, MAX(date_time_in) as max_in, MAX(date_time_out) as max_out')
                    ->first();

                // oven_dtable insert
                DB::table('oven_dtable')->insert([
                    'OVEN_NAME' => $oven,
                    'LOTS_IN' => $summary->total,
                    'TEMPERATURE' => $temperatures[$key] ?? null,
                    'STATUS' => 'inuse',
                    'DATE_TIME_IN' => $summary->max_in,
                    'DATE_TIME_OUT' => $summary->max_out,
                ]);

                // oven_monitoring insert
                DB::table('oven_monitoring')->insert([
                    'OVEN_NAME' => $oven,
                    'LOTS_IN' => $summary->total,
                    'STATUS' => 'inuse',
                    'TEMPERATURE' => $temperatures[$key] ?? null,
                    'DATE_CREATED' => $summary->max_in,
                ]);
            }

            DB::commit();

            return back()->with('success', 'Confirmed successfully');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'message' => 'Confirmation failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function rejectDryBakeForm(Request $request)
    {
        try {

            DryBakeForm::where('id', $request->dbakeformId)->delete();

            return back()->with('success', 'Deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors([
                'message' => 'Delete failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function interrupted()
    {
        return Inertia::render('InterruptedDryBake');
    }

    public function approve(Request $request)
    {
        $item = DryBakeForm::find($request->id);

        $item->approved_by = session('emp_data')['emp_id'] ?? 'SYSTEM';
        $item->approved_status = 'approved';
        $item->save();

        DB::table('drybake_history')->insert([
            'dbakeformtable_id' => $request->id,
            'oven_num' => $item->oven_num,
            'lotid' => $item->lotid,
            'package' => $item->package,
            'partname' => $item->partname,
            'quantity' => $item->quantity,
            'chamber' => $item->chamber,
            'input_type' => $item->input_type,
            'temperature' => $item->temperature,
            'hours' => $item->hours,
            'date_time_in' => $item->date_time_in,
            'date_time_out' => $item->date_time_out,
            'old_date_time_out' => $item->old_date_time_out,
            'operator_in' => $item->operator_in,
            'approved_status' => 'approved',
            'bake_status' => 'inuse',
            'approved_by' => session('emp_data')['emp_id'] ?? 'SYSTEM',
            'cooldown_by' => $item->cooldown_by,
            'confirmed_data' => $item->confirmed_data,
            'added_by' => $item->added_by,
            'date_created' => now(),
        ]);

        return back();
    }
}
