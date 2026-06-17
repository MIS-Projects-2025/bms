import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { ArchiveRestore, CircleX, SaveAll, BookAlert } from "lucide-react";
import { useState, useEffect } from "react";

export default function OvenListStatus({ tableData, tableFilters }) {

    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isOn, setIsOn] = useState(true);

    const [form, setForm] = useState({
        chamber: [],
    });

    /*
    |--------------------------------------------------
    | SYNC MODAL DATA
    |--------------------------------------------------
    */
    useEffect(() => {
        if (!selectedItem) return;

        setIsOn(selectedItem.status !== "shutdown");

        setForm({
            chamber: Array.isArray(selectedItem.chamber)
                ? selectedItem.chamber
                : JSON.parse(selectedItem.chamber || "[]"),
        });
    }, [selectedItem]);

    /*
    |--------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------
    */
    const handleToggle = () => {
        setIsOn((prev) => !prev);
    };

    /*
    |--------------------------------------------------
    | FORM CHANGE
    |--------------------------------------------------
    */
    const handleChange = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    /*
    |--------------------------------------------------
    | SAVE
    |--------------------------------------------------
    */
const handleSave = () => {
    const status = isOn ? "idle" : "shutdown";

    router.put(route("ovenlist.update", selectedItem.id), {
        chamber: form.chamber,
        status,
    });

    setOpenModal(false);
};

const getStatusBadge = (status) => {
    const base = "px-3 py-1 rounded-full text-xs font-bold capitalize";

    switch ((status || "").toLowerCase()) {
        case "idle":
            return `${base} bg-gray-200 text-gray-800 dark:bg-gray-100/20 dark:text-gray-400`;

        case "shutdown":
            return `${base} bg-blue-300 text-blue-800 dark:bg-blue-100/20 dark:text-blue-400`;

        case "inuse":
            return `${base} bg-green-200 text-green-800 dark:bg-green-100/20 dark:text-green-400`;

        case "unloading":
            return `${base} bg-red-200 text-red-800 animate-pulse dark:bg-red-100/20 dark:text-red-400`;

        case "before_unload":
            return `${base} bg-orange-200 text-orange-800 dark:bg-orange-100/20 dark:text-orange-400`;

        case "interupted":
            return `${base} bg-gray-200 text-gray-800 dark:bg-gray-100/20 dark:text-gray-400`;

        default:
            return `${base} bg-stone-200 text-stone-800 dark:bg-stone-100/20 dark:text-stone-400`;
    }
};

    /*
    |--------------------------------------------------
    | FORMAT TABLE DATA
    |--------------------------------------------------
    */
    const dataWithAction = tableData.data.map((item) => ({
    ...item,

    chamber: Array.isArray(item.chamber)
        ? item.chamber.map((c) => c.toUpperCase()).join(" | ")
        : item.chamber,

    status: (
        <span className={getStatusBadge(item.status)}>
            {item.status}
        </span>
    ),

    actions: (
        <button
            onClick={() => {
                let parsedSections = [];

                try {
                    parsedSections =
                        typeof item.sections === "string"
                            ? JSON.parse(item.sections)
                            : Array.isArray(item.sections)
                            ? item.sections
                            : [];
                } catch {
                    parsedSections = [];
                }

                setSelectedItem({
                    ...item,
                    sections: parsedSections,
                });

                setOpenModal(true);
            }}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
            <i className="fa fa-eye"></i>
        </button>
    ),
}));

    return (
        <AuthenticatedLayout>
            <Head title="ovenlist status" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="flex items-center text-2xl font-bold text-blue-800">
                    <ArchiveRestore className="w-9 h-9" />
                    Oven Machine
                </h1>
            </div>

            {/* TABLE */}
            <DataTable
                columns={[
                    { key: "oven_name", label: "Oven" },
                    { key: "chamber", label: "Chamber" },
                    { key: "status", label: "Status" },
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
                routeName={route("ovenlist.index")}
                filters={tableFilters}
                rowKey="id"
                showExport={false}
            />

            {/* MODAL */}
            {openModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white w-[520px] p-6 rounded-xl shadow-lg border-4 border-blue-800">

                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center text-xl font-bold text-blue-800">
                                <BookAlert className="w-6 h-6 mr-2" />
                                Oven Details
                            </h2>

                            

                            {/* REAL SWITCH */}
<div className="flex items-center gap-3">
    <span
        className={`text-sm font-semibold transition ${
            isOn ? "text-green-600" : "text-red-600"
        }`}
    >
        {isOn ? "ON" : "OFF"}
    </span>

    <div
        onClick={handleToggle}
        className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shadow-inner ${
            isOn ? "bg-green-500" : "bg-red-500"
        }`}
    >
        <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                isOn ? "translate-x-7" : "translate-x-0"
            }`}
        />
    </div>
</div>
                        </div>

                        {/* OVEN NAME (READONLY) */}
                        <div className="mb-3">
                            <label className="text-sm font-semibold">
                                Oven Name
                            </label>
                            <input
                                type="text"
                                value={selectedItem.oven_name}
                                readOnly
                                className="w-full border p-2 rounded bg-gray-100"
                            />
                        </div>

                        {/* CHAMBER EDIT */}
                        <div className="mb-3">
                            <label className="text-sm font-semibold">
                                Chamber
                            </label>
                            <input
                                type="text"
                                value={form.chamber.join(", ")}
                                onChange={(e) =>
                                    handleChange(
                                        "chamber",
                                        e.target.value
                                            .split(",")
                                            .map((c) => c.trim())
                                    )
                                }
                                className="w-full border p-2 rounded"
                                placeholder="chamber-001, chamber-002"
                            />
                        </div>

                        

                        {/* BUTTONS */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setOpenModal(false)}
                                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                            >
                                <CircleX className="w-5 h-5 mr-1" />
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                className="flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md"
                            >
                                <SaveAll className="w-5 h-5 mr-1" />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}