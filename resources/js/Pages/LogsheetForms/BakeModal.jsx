import { X, Eye } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function BakeModal({
    isOpen,
    onClose,
    selectedOven,
    getChamberStatus,
    groupedData,
}) {
    const { emp_data } = usePage().props;

    const dept = emp_data?.emp_jobtitle_id === 154;

    const [selectedChamber, setSelectedChamber] = useState(null);
    const [loadingId, setLoadingId] = useState(null);

    const handleComplete = (id) => {
        setLoadingId(id);
        router.put(
            route("bake.complete", id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setLoadingId(null),
                onSuccess: () => {
                    router.reload({
                        only: ["bakePackageDetails"],
                        preserveState: true,
                    });
                },
            },
        );
    };

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ["bakePackageDetails"],
                preserveState: true,
                preserveScroll: true,
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    if (!isOpen) return null;

    const safeGroupedData =
        groupedData && typeof groupedData === "object" ? groupedData : {};

    const handleApprove = (id) => {
        router.post(
            route("qa.approve"),
            { id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({
                        only: ["bakePackageDetails"],
                        preserveState: true,
                    });
                },
            },
        );
    };

    return (
        <>
            {/* MAIN MODAL */}
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-2 sm:p-4">
                <div className="bg-white w-[1200px] max-w-7xl h-[100vh] rounded-xl overflow-y-auto p-5">
                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-blue-800">
                            Oven {selectedOven}
                        </h2>

                        <button
                            onClick={onClose}
                            className="text-red-500 hover:text-red-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* COLOR GUIDE */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2 text-gray-600">
                            Color Guide
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="w-4 h-4 bg-gray-500 rounded"></span>
                                IDLE
                            </div>

                            <div className="flex items-center gap-2 text-green-600">
                                <span className="w-4 h-4 bg-green-500/40 rounded"></span>
                                ONGOING
                            </div>

                            <div className="flex items-center gap-2 text-orange-600">
                                <span className="w-4 h-4 bg-orange-500/50 rounded"></span>
                                BE READY
                            </div>

                            <div className="flex items-center gap-2 text-purple-600">
                                <span className="w-4 h-4 bg-purple-500/50 rounded"></span>
                                COOLDOWN
                            </div>

                            <div className="flex items-center gap-2 text-red-600">
                                <span className="w-4 h-4 bg-red-500/80 rounded"></span>
                                TO UNLOAD
                            </div>

                            <div className="flex items-center gap-2 text-black">
                                <span className="w-4 h-4 bg-black rounded"></span>
                                INTERRUPTED
                            </div>
                        </div>
                    </div>

                    {/* CHAMBER CARDS */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {Object.entries(safeGroupedData).map(
                            ([chamber, items]) => {
                                const safeItems = Array.isArray(items)
                                    ? items
                                    : [];

                                const status = getChamberStatus(safeItems);

                                const firstItem = safeItems[0] ?? {};

                                return (
                                    <div
                                        key={chamber}
                                        className={`rounded-lg border shadow-sm p-2 ${status.bg}`}
                                    >
                                        <div
                                            className={`font-bold text-sm ${status.text}`}
                                        >
                                            {chamber}
                                        </div>

                                        {safeItems.length === 0 ? (
                                            <div className="text-xs text-gray-500 mt-2">
                                                IDLE
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mt-2 space-y-1 text-xs">
                                                    <div className="truncate">
                                                        <span
                                                            className={`font-semibold ${status.text}`}
                                                        >
                                                            Lot:
                                                        </span>{" "}
                                                        <label
                                                            className={`font-semibold ${status.text}`}
                                                        >
                                                            {firstItem.lotid}
                                                        </label>
                                                    </div>

                                                    <div className="truncate">
                                                        <span
                                                            className={`font-semibold ${status.text}`}
                                                        >
                                                            Part:
                                                        </span>{" "}
                                                        <label
                                                            className={`font-semibold ${status.text}`}
                                                        >
                                                            {firstItem.partname}
                                                        </label>
                                                    </div>

                                                    <div
                                                        className={`font-semibold ${status.text}`}
                                                    >
                                                        {status.time ??
                                                            status.label}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        setSelectedChamber(
                                                            chamber,
                                                        )
                                                    }
                                                    className="mt-2 w-full text-xs bg-blue-600 text-white rounded py-1"
                                                >
                                                    View
                                                </button>
                                                {status.readyToUnload &&
                                                    firstItem.approved_by && (
                                                        <button
                                                            onClick={() =>
                                                                handleComplete(
                                                                    firstItem.id,
                                                                )
                                                            }
                                                            className="mt-1 w-full text-xs bg-green-600 text-white rounded py-1"
                                                        >
                                                            {loadingId ===
                                                            firstItem.id
                                                                ? "Saving..."
                                                                : "Unload Package"}
                                                        </button>
                                                    )}
                                            </>
                                        )}
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>
            </div>

            {/* DETAILS MODAL */}
            {selectedChamber && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white w-full max-w-6xl rounded-xl p-5 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-xl text-blue-700">
                                {selectedChamber}
                            </h2>

                            <button onClick={() => setSelectedChamber(null)}>
                                <X className="w-6 h-6 text-red-500" />
                            </button>
                        </div>

                        {safeGroupedData[selectedChamber]?.map((item, i) => {
                            const status = getChamberStatus([item]);

                            return (
                                <div key={i} className="overflow-x-auto mb-4">
                                    <table className="min-w-full border text-sm text-center">
                                        <thead>
                                            <tr className="bg-gray-200">
                                                <th className="border p-2">
                                                    Hours
                                                </th>
                                                <th className="border p-2">
                                                    Temp
                                                </th>
                                                <th className="border p-2">
                                                    Time In
                                                </th>
                                                <th className="border p-2">
                                                    Operator
                                                </th>
                                                <th className="border p-2">
                                                    Time Out
                                                </th>
                                                <th className="border p-2">
                                                    Lot
                                                </th>
                                                <th className="border p-2">
                                                    Part
                                                </th>
                                                <th className="border p-2">
                                                    Qty
                                                </th>
                                                <th className="border p-2">
                                                    Status
                                                </th>
                                                <th className="border p-2">
                                                    Remaining
                                                </th>
                                                <th className="border p-2">
                                                    Verifier
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            <tr>
                                                <td className="border p-2">
                                                    {item.hours}
                                                </td>

                                                <td className="border p-2">
                                                    {item.temperature}
                                                </td>

                                                <td className="border p-2">
                                                    {new Date(
                                                        item.date_time_in,
                                                    ).toLocaleString()}
                                                </td>

                                                <td className="border p-2">
                                                    {item.operator_in}
                                                </td>

                                                <td className="border p-2">
                                                    {new Date(
                                                        item.date_time_out,
                                                    ).toLocaleString()}
                                                </td>

                                                <td className="border p-2">
                                                    {item.lotid}
                                                </td>

                                                <td className="border p-2">
                                                    {item.partname}
                                                </td>

                                                <td className="border p-2">
                                                    {item.quantity}
                                                </td>

                                                <td
                                                    className={`border p-2 ${status.text}`}
                                                >
                                                    {status.label}
                                                </td>

                                                <td className="border p-2">
                                                    {status.time ??
                                                        status.label}
                                                </td>

                                                <td className="border">
                                                    {!item?.approved_by ? (
                                                        dept ? (
                                                            <button
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        item.id,
                                                                    )
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
                                                                    {
                                                                        item.approved_by
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
