<?php

// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS METHOD to your existing BakeController (or whichever controller
// handles the bake routes)
// ─────────────────────────────────────────────────────────────────────────────

// routes/web.php — add this line:
// Route::put('/bake/{id}/extend', [BakeController::class, 'extendTime'])->name('bake.extend');

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extend date_time_out by the number of seconds the temp was below target.
 * Called automatically by the frontend when actual temp recovers.
 *
 * PUT /bake/{id}/extend
 * Body: { add_seconds: int }
 */
// public function extendTime(Request $request, $id)
// {
//     $request->validate([
//         'add_seconds' => 'required|integer|min=1',
//     ]);

//     $record = \App\Models\DbakeFormTable::findOrFail($id);

//     // Only extend if the bake is still active (not completed/interrupted)
//     if (!in_array($record->bake_status, ['inuse', 'ongoing', 'active'])) {
//         return response()->json([
//             'success' => false,
//             'message' => 'Bake record is not active.',
//         ], 422);
//     }

//     $addSeconds = (int) $request->add_seconds;

//     // Save old date_time_out before modifying (for audit trail)
//     $record->old_date_time_out = $record->date_time_out;

//     // Add elapsed drop time to date_time_out
//     $record->date_time_out = \Carbon\Carbon::parse($record->date_time_out)
//         ->addSeconds($addSeconds);

//     $record->save();

//     return response()->json([
//         'success'          => true,
//         'message'          => "Extended date_time_out by {$addSeconds} seconds due to temperature drop.",
//         'added_seconds'    => $addSeconds,
//         'old_date_time_out'=> $record->old_date_time_out,
//         'new_date_time_out'=> $record->date_time_out,
//     ]);
// }
