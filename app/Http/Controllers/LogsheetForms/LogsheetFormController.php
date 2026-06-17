<?php

namespace App\Http\Controllers\LogsheetForms;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use function Pest\Laravel\get;

class LogsheetFormController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {


        $ovenStatus = DB::connection('mysql')->table('oven_status')->get()->keyBy('oven_name');

        $chamberPerOvenName = DB::connection('mysql')->table('oven_status')->get();

        $bakePackageDetails = DB::connection('mysql')->table('dbakeformtable')->get();

        $result = $this->datatable->handle(
            $request,
            'mysql',
            'dbakeformtable',
            [
                'conditions' => function ($query) {
                    return $query
                        ->select('oven_num')
                        ->where('bake_status', '!=', 'complete')
                        ->distinct();
                },

                'searchColumns' => ['oven_num'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('LogsheetForms/Bakeforms', [
            'tableData' => $result['data'],
            'chamberPerOvenName' => $chamberPerOvenName,
            'bakePackageDetails' => $bakePackageDetails,
            'ovenStatus' => $ovenStatus,
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
}
