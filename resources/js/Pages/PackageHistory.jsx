import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import axios from "axios";
import { FileClock, Eye, X } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Dialog, DialogContent, DialogHeader } from "@/Components/ui/dialog";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/Components/ui/table";

export default function PackageHistory({ tableData, tableFilters, emp_data }) {
    const [openModal, setOpenModal] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // FORMAT DATE: Jun 14 2024 06:14 am
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);

        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
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
                const res = await axios.get(route("package.history.timeline"), {
                    params: {
                        input_type: selectedItem.input_type,
                        lotid: selectedItem.lotid,
                        package: selectedItem.package,
                        partname: selectedItem.partname,
                    },
                });

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

    const excludedFields = ["id", "dbakeformtable_id", "date_created"];

    const loadTimeline = async (item) => {
        setOpenModal(true);
        setLoadingTimeline(true);
        setSelectedItem(item);

        try {
            const res = await axios.get(route("package.history.timeline"), {
                params: {
                    lotid: item.lotid,
                    package: item.package,
                },
            });

            setTimelineData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTimeline(false);
        }
    };

    // TABLE DATA
    const dataWithAction = tableData.data.map((item) => ({
        ...item,
        actions: (
            <Button
                size="sm"
                onClick={() => loadTimeline(item)}
                className="bg-sky-800 hover:bg-sky-600"
            >
                <Eye className="w-4 h-4" />
            </Button>
        ),
    }));

    // Only show columns that actually have data somewhere in the timeline,
    // in the predictable order defined by `labels`
    const allKeys = Object.keys(labels).filter(
        (key) =>
            key !== "bake_status" &&
            !excludedFields.includes(key) &&
            timelineData.some(
                (row) =>
                    row[key] !== null &&
                    row[key] !== "" &&
                    row[key] !== undefined,
            ),
    );

    return (
        <AuthenticatedLayout>
            <Head title="Package History" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-sky-800 hover:text-sky-600">
                    <i className="fa-solid fa-clock-rotate-left"></i> Package
                    History
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
            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent className="w-full max-w-[95vw] xl:max-w-6xl 2xl:max-w-7xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden">
                    {/* HEADER */}
                    <DialogHeader className="sticky top-0 bg-white z-20 border-b px-6 py-4 flex-row items-center justify-between space-y-0">
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
                            <X className="w-5 h-5" />
                        </button>
                    </DialogHeader>

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
                            <Table className="text-xs sm:text-sm">
                                <TableHeader className="bg-sky-800 sticky top-0 z-10">
                                    <TableRow className="hover:bg-sky-800">
                                        <TableHead className="text-white px-2 sm:px-3 py-2 whitespace-nowrap">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-white px-2 sm:px-3 py-2 whitespace-nowrap">
                                            Date
                                        </TableHead>
                                        {allKeys.map((key) => (
                                            <TableHead
                                                key={key}
                                                className="text-white px-2 sm:px-3 py-2"
                                            >
                                                {labels[key] || key}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {timelineData.map((row, index) => {
                                        const status =
                                            row.bake_status?.toLowerCase();

                                        return (
                                            <TableRow
                                                key={index}
                                                className={
                                                    index % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-gray-50"
                                                }
                                            >
                                                <TableCell className="px-2 sm:px-3 py-2 whitespace-nowrap">
                                                    <Badge
                                                        className={`text-white uppercase font-bold ${statusColors[
                                                            status
                                                        ] || "bg-sky-800"
                                                            }`}
                                                    >
                                                        {row.bake_status}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="px-2 sm:px-3 py-2 whitespace-nowrap text-gray-500">
                                                    {formatDate(
                                                        row.date_created,
                                                    )}
                                                </TableCell>

                                                {allKeys.map((key) => {
                                                    const value = row[key];
                                                    const previous =
                                                        index > 0
                                                            ? timelineData[
                                                            index - 1
                                                            ][key]
                                                            : null;

                                                    const isEmpty =
                                                        value === null ||
                                                        value === "" ||
                                                        value === undefined;

                                                    const changed =
                                                        !isEmpty &&
                                                        previous !== null &&
                                                        previous !== "" &&
                                                        previous !==
                                                        undefined &&
                                                        previous != value;

                                                    const displayValue = isEmpty
                                                        ? "-"
                                                        : key.includes("date")
                                                            ? formatDate(value)
                                                            : String(value);

                                                    const previousDisplay =
                                                        key.includes("date")
                                                            ? formatDate(
                                                                previous,
                                                            )
                                                            : String(previous);

                                                    return (
                                                        <TableCell
                                                            key={key}
                                                            title={
                                                                changed
                                                                    ? `Changed from: ${previousDisplay}`
                                                                    : undefined
                                                            }
                                                            className={`px-2 sm:px-3 py-2 break-words align-top ${changed
                                                                ? "bg-emerald-100 text-emerald-800 font-semibold"
                                                                : "text-gray-700"
                                                                }`}
                                                        >
                                                            {displayValue}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
