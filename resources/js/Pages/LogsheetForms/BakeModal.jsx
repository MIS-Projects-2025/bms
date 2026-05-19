import { X } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { useMemo } from "react";

export default function BakeModal({
    isOpen,
    onClose,
    selectedOven,
    getChamberStatus,
    bakePackageDetails
}) {
    const { emp_data } = usePage().props;

    const dept = emp_data?.emp_dept === "Quality Assurance";

    if (!isOpen) return null;

    const activeItems = useMemo(() => {
        return (bakePackageDetails || []).filter(
            item =>
                item.bake_status !== "complete" &&
                item.oven_num === selectedOven
        );
    }, [bakePackageDetails, selectedOven]);

    const groupedData = useMemo(() => {
        return activeItems.reduce((acc, item) => {
            if (!acc[item.chamber]) acc[item.chamber] = [];
            acc[item.chamber].push(item);
            return acc;
        }, {});
    }, [activeItems]);

    const handleApprove = (id) => {
        router.post(route("qa.approve"), { id }, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({
                    only: ["bakePackageDetails"],
                    preserveState: true,
                });
            },
        });
    };

    const safeGroupedData =
        groupedData && typeof groupedData === "object"
            ? groupedData
            : {};

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-2 sm:p-4">

            {/* MODAL */}
            <div className="bg-white w-[1000px] h-[500px] max-h-[1200px] sm:rounded-xl overflow-y-auto p-3 sm:p-5">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <h2 className="text-lg sm:text-xl font-bold text-blue-800">
                        Oven {selectedOven}
                    </h2>

                    <button onClick={onClose} className="text-red-500 hover:text-red-700">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* COLOR GUIDE */}
                <div className="mb-5 text-xs">
                    <h3 className="font-semibold mb-2 text-gray-600">
                        Color Guide:
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        <div className="flex items-center gap-2 font-semibold text-gray-500 text-sm sm:text-base">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-500 border rounded-sm"></span>
                            IDLE
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-green-500 text-sm sm:text-base">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500/40 border rounded-sm"></span>
                            ONGOING
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-orange-500 text-sm sm:text-base">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500/50 border rounded-sm"></span>
                            BE READY
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-purple-500 text-sm sm:text-base">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-500/50 border rounded-sm"></span>
                            COOLDOWN
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-red-500 text-sm sm:text-base">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500/80 border rounded-sm"></span>
                            TO UNLOAD
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-black text-sm sm:text-base">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 bg-black border rounded-sm"></span>
                            INTERRUPTED
                        </div>
                    </div>
                </div>

                {/* CHAMBERS */}
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4">

                    {Object.entries(safeGroupedData).map(([chamber, items]) => {

                        const safeItems = Array.isArray(items) ? items : [];
                        const status = getChamberStatus(safeItems);
                        const firstItem = safeItems[0] ?? {};

                        return (
                            <div
                                key={chamber}
                                className={`rounded-xl p-3 sm:p-4 shadow ${status.bg}`}
                            >

                                <h3 className={`font-bold mb-2 ${status.text}`}>
                                    {chamber}
                                </h3>

                                {safeItems.length === 0 ? (
                                    <p className="text-gray-500 text-sm">
                                        No data
                                    </p>
                                ) : (
                                    safeItems.map((item, i) => (
                                        <div
                                            key={i}
                                            className="bg-gray-50 p-2 mt-2 rounded text-xs sm:text-sm"
                                        >

                                            {/* TABLE WRAPPER */}
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[600px] w-full text-[8px] sm:text-xs border text-center text-gray-700">

                                                    <thead>
                                                        <tr className="border bg-gray-200">
                                                            <th className="border">Hours</th>
                                                            <th className="border">Temp</th>
                                                            <th className="border">Time In</th>
                                                            <th className="border">Operator</th>
                                                            <th className="border">Time Out</th>
                                                            <th className="border">Lot</th>
                                                            <th className="border">Part</th>
                                                            <th className="border">Qty</th>
                                                            <th className="border">Status</th>
                                                            <th className="border">Remaining</th>
                                                            <th className="border">Verifier</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        <tr className="border">
                                                            <td className="border">{item.hours}</td>
                                                            <td className="border">{item.temperature}</td>
                                                            <td className="border">
                                                                {new Date(item.date_time_in).toLocaleString()}
                                                            </td>
                                                            <td className="border">{item.operator_in}</td>
                                                            <td className="border">
                                                                {new Date(item.date_time_out).toLocaleString()}
                                                            </td>
                                                            <td className="border">{item.lotid}</td>
                                                            <td className="border">{item.partname}</td>
                                                            <td className="border">{item.quantity}</td>

                                                            <td className={`border ${status.text}`}>
                                                                {status.label}
                                                            </td>

                                                            <td className="border">
                                                                {status.time ?? status.label}
                                                            </td>

                                                            {/* QA APPROVAL */}
                                                            <td className="border">

                                                                {!firstItem?.approved_by ? (
                                                                    dept ? (
                                                                        <button
                                                                            onClick={() =>
                                                                                handleApprove(firstItem.id)
                                                                            }
                                                                            className="px-2 py-1 sm:px-3 sm:py-1 bg-green-600 text-white rounded text-[10px] sm:text-xs"
                                                                        >
                                                                            QA Approve
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-red-500 text-xs">
                                                                            Not approved
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <div className="flex justify-center">
                                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 relative border border-indigo-700 rounded-full flex items-center justify-center">

                                                                            <div className="absolute top-0 text-[7px] text-amber-500 font-bold">
                                                                                QA
                                                                            </div>

                                                                            <div className="absolute bottom-0 text-[6px] text-green-600 font-semibold">
                                                                                PASSED
                                                                            </div>

                                                                            <div className="text-blue-600 text-[9px] font-semibold text-center px-1">
                                                                                {firstItem.approved_by}
                                                                            </div>

                                                                        </div>
                                                                    </div>
                                                                )}

                                                            </td>
                                                        </tr>
                                                    </tbody>

                                                </table>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        );
                    })}

                </div>
            </div>
        </div>
    );
}