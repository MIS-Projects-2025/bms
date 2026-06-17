<?php

namespace App\Http\Controllers\PackageLots;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PackageLotsController extends Controller
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
            'ppc',
            'customer_data_wip',
            [
                'conditions' => function ($query) {
                    return $query
                        ->selectRaw('
        TRIM(Lot_Id) as Lot_Id,
        TRIM(Part_Name) as Part_Name,
        TRIM(Package_Name) as Package_Name,
        Qty,
        Bake_Time_Temp
    ')
                        ->where('Bake', 'For Bake')
                        ->groupBy('Lot_Id', 'Part_Name', 'Package_Name', 'Qty', 'Bake_Time_Temp')
                        ->orderBy('Lot_Id', 'asc');
                },

                'searchColumns' => ['Lot_Id', 'Part_Name', 'Package_Name', 'Qty', 'Bake_Time_Temp'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('PackageLots/Partnames', [
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

    public function history(Request $request)
    {
        $result = $this->datatable->handle(
            $request,
            'mysql',
            'drybake_history',
            [
                'conditions' => function ($query) {
                    return $query
                        ->selectRaw("
                        TRIM(lotid) as lotid,
                        TRIM(package) as package,
                        TRIM(partname) as partname,
                        quantity
                    ")
                        ->groupByRaw("
                        TRIM(lotid),
                        TRIM(package),
                        TRIM(partname),
                        quantity
                    ")
                        ->orderByRaw('TRIM(lotid) asc');
                },

                'searchColumns' => ['lotid', 'package', 'partname', 'quantity'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('PackageHistory', [
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

    public function timeline(Request $request)
    {
        $data = DB::table('drybake_history')

            ->whereRaw('TRIM(lotid) = ?', [trim($request->lotid)])
            ->whereRaw('TRIM(package) = ?', [trim($request->package)])
            ->orderBy('date_time_in', 'asc')
            ->get();

        return response()->json($data);
    }
}
