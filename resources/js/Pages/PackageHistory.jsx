import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import axios from "axios";
import { FileClock } from "lucide-react";

export default function PackageHistory({
    tableData,
    tableFilters,
    emp_data,
}) {
    const [openModal, setOpenModal] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // FORMAT DATE: Jun 14 2024 06:14 am
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);

        const months = [
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"
        ];

        const month = months[date.getMonth()];
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "pm" : "am";

        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${month} ${day} ${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    };

    // AUTO REFRESH TABLE
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ["tableData"],
                preserveState: true,
                preserveScroll: true,
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // AUTO REFRESH TIMELINE
    useEffect(() => {
        if (!openModal || !selectedItem) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(
                    route("package.history.timeline"),
                    {
                        params: {
                            input_type: selectedItem.input_type,
                            lotid: selectedItem.lotid,
                            package: selectedItem.package,
                            partname: selectedItem.partname,
                        },
                    }
                );

                setTimelineData(res.data);
            } catch (err) {
                console.error(err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [openModal, selectedItem]);

    // LABELS
    const labels = {
        oven_num: "Oven",
        lotid: "Lot ID",
        package: "Package",
        partname: "Part Name",
        quantity: "Quantity",
        chamber: "Chamber",
        input_type: "Input",
        approved_status: "Approved Status",
        temperature: "Temperature",
        hours: "Hours",
        date_time_in: "Date Time In",
        operator_in: "Operator In",
        date_time_out: "Date Time Out",
        old_date_time_out: "Old Date Out",
        confirmed_data: "Confirmed",
        operator_out: "Operator Out",
        bake_status: "Bake Status",
        approved_by: "Approved By",
        added_by: "Added By",
        cooldown_end: "Cooldown End",
        cooldown_by: "Cooldown By",
    };

    // COLORS
    const statusColors = {
        pending: "bg-yellow-500",
        inuse: "bg-green-500",
        interrupted: "bg-black",
        cooldown: "bg-purple-500",
        complete: "bg-emerald-500",
    };

    const excludedFields = [
        "id",
        "dbakeformtable_id",
        "date_created",
    ];

    // TABLE DATA
    const dataWithAction = tableData.data.map((item) => ({
        ...item,
        actions: (
            <button
                onClick={async () => {
                    setOpenModal(true);
                    setLoadingTimeline(true);
                    setSelectedItem(item);

                    try {
                        const res = await axios.get(
                            route("package.history.timeline"),
                            {
                                params: {
                                    lotid: item.lotid,
                                    package: item.package,
                                },
                            }
                        );

                        setTimelineData(res.data);
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setLoadingTimeline(false);
                    }
                }}
                className="px-3 py-1 bg-sky-800 text-white rounded hover:bg-sky-600 transition"
            >
                <i className="fa fa-eye"></i> View
            </button>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Package History" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-sky-800 hover:text-sky-600">
                    <i className="fa-solid fa-clock-rotate-left"></i>{" "}
                    Package History
                </h1>
            </div>

            <DataTable
                columns={[
                    { key: "lotid", label: "Lot ID" },
                    { key: "package", label: "Package" },
                    { key: "partname", label: "Part Name" },
                    { key: "actions", label: "Actions" },
                ]}
                data={dataWithAction}
                meta={{
                    from: tableData.from,
                    to: tableData.to,
                    total: tableData.total,
                    links: tableData.links,
                    currentPage: tableData.current_page,
                    lastPage: tableData.last_page,
                }}
                routeName={route("package.history.index")}
                filters={tableFilters}
                rowKey="lotid"
                showExport={false}
            />

            {/* MODAL */}
            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden">

                        {/* HEADER */}
                        <div className="sticky top-0 bg-white z-20 border-b px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <FileClock className="w-10 h-10 text-sky-800 mr-2" />

                                <div>
                                    <h2 className="text-xl font-bold text-sky-800">
                                        Bake Timeline
                                    </h2>

                                    {selectedItem && (
                                        <p className="text-sm text-blue-500 font-semibold">
                                            {selectedItem.input_type} •{" "}
                                            {selectedItem.lotid} •{" "}
                                            {selectedItem.package} •{" "}
                                            {selectedItem.partname}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setOpenModal(false)}
                                className="text-red-500 hover:text-red-600 transition"
                            >
                                <i className="fa fa-times"></i>
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="overflow-y-auto max-h-[80vh] p-6">

                            {loadingTimeline ? (
                                <div className="text-center py-16 text-gray-500">
                                    Loading Timeline...
                                </div>
                            ) : timelineData.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    No timeline found.
                                </div>
                            ) : (
                                <div className="relative border-l-4 border-sky-800 ml-4">

                                    {timelineData.map((row, index) => {

                                        const status =
                                            row.bake_status?.toLowerCase();

                                        return (
                                            <div
                                                key={index}
                                                className="mb-6 ml-6 relative"
                                            >

                                                {/* DOT */}
                                                <div
                                                    className={`absolute -left-[34px] top-1 w-5 h-5 rounded-full border-4 border-white shadow ${
                                                        statusColors[status] ||
                                                        "bg-sky-800"
                                                    }`}
                                                ></div>

                                                {/* CARD */}
                                                <div className="bg-gray-50 border rounded-xl p-5 shadow-sm hover:shadow-md transition">

                                                    {/* STATUS */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-white text-xs font-bold uppercase ${
                                                                statusColors[
                                                                    status
                                                                ] ||
                                                                "bg-sky-800"
                                                            }`}
                                                        >
                                                            {row.bake_status}
                                                        </span>

                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(row.date_created)}
                                                        </span>
                                                    </div>

                                                    {/* DETAILS */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">

                                                        {Object.entries(row)
                                                            .filter(([key, value]) => {
                                                                return (
                                                                    !excludedFields.includes(key) &&
                                                                    value !== null &&
                                                                    value !== ""
                                                                );
                                                            })
                                                            .map(([key, value], indexRow) => {

                                                                const previous =
                                                                    index > 0
                                                                        ? timelineData[index - 1][key]
                                                                        : null;

                                                                const changed =
                                                                    previous !== null &&
                                                                    previous != value;

                                                                const displayValue =
                                                                    key.includes("date")
                                                                        ? formatDate(value)
                                                                        : String(value);

                                                                const displayPrevious =
                                                                    key.includes("date")
                                                                        ? formatDate(previous)
                                                                        : String(previous);

                                                                return (
                                                                    <div
                                                                        key={key}
                                                                        className={`rounded-lg border p-3 transition-all ${
                                                                            changed
                                                                                ? "bg-emerald-100 border-emerald-400"
                                                                                : "bg-white"
                                                                        }`}
                                                                    >
                                                                        <div className="font-semibold text-gray-700 mb-1">
                                                                            {labels[key] || key}
                                                                        </div>

                                                                        <div className="text-gray-800 break-all">
                                                                            {displayValue}
                                                                        </div>

                                                                        {changed && (
                                                                            <div className="mt-2 text-xs text-red-600 font-medium">
                                                                                Changed from: {displayPrevious}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}