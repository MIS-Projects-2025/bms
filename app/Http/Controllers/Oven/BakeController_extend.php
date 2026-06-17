<?php

// routes/web.php:
// Route::put('/bake/{id}/extend', [OvenListController::class, 'extendTime'])->name('bake.extend');

/**
 * Extend date_time_out by the number of seconds the temp was below target.
 *
 * PUT /bake/{id}/extend
 * Body: { add_seconds: int }   ← total seconds, e.g. 332 for 00:05:32
 */
// public function extendTime(Request $request, $id)
// {
//     $request->validate([
//         'add_seconds' => ['required', 'integer', 'min:1'],
//     ]);

//     $record = DB::table('dbakeformtable')->where('id', $id)->first();

//     if (!$record) {
//         return redirect()->back()->with('error', 'Record not found.');
//     }

//     if (!in_array($record->bake_status, ['inuse', 'ongoing', 'active'])) {
//         return redirect()->back()->with('error', 'Bake record is not active.');
//     }

//     $addSeconds     = (int) $request->add_seconds;
//     $oldDateTimeOut = $record->date_time_out;

//     $newDateTimeOut = \Carbon\Carbon::parse($oldDateTimeOut)
//         ->addSeconds($addSeconds);

//     // TEMP DEBUG LOG — remove once confirmed working.
//     // Check storage/logs/laravel.log after a drop-recovery event.
//     \Illuminate\Support\Facades\Log::info('extendTime called', [
//         'id'              => $id,
//         'add_seconds'     => $addSeconds,
//         'old_date_time_out' => $oldDateTimeOut,
//         'new_date_time_out' => $newDateTimeOut->toDateTimeString(),
//     ]);

//     DB::table('dbakeformtable')
//         ->where('id', $id)
//         ->update([
//             'old_date_time_out' => $oldDateTimeOut,
//             'date_time_out'     => $newDateTimeOut,
//         ]);

//     return redirect()->back();
// }
