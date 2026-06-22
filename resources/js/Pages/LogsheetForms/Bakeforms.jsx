import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, Head } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { ListTree, X, Eye } from "lucide-react";
import { useState, useEffect, usePage } from "react";
import { Button } from "@/Components/ui/button";
import BakeModal from "@/Pages/LogsheetForms/BakeModal";

export default function Bakeforms({
    tableData,
    tableFilters,
    emp_data,
    bakePackageDetails,
    chamberPerOvenName,
    ovenStatus,
}) {

    // console.log("ovenStatus", ovenStatus);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOven, setSelectedOven] = useState(null);
    const [groupedData, setGroupedData] = useState({});

    const [now, setNow] = useState(Date.now());

    const computeCooldownSeconds = (cooldownEnd) => {
    if (!cooldownEnd) return 0;

    const endTime = new Date(cooldownEnd).getTime();
    return Math.max((endTime - now) / 1000, 0);
};

useEffect(() => {
    if (!selectedOven || !isModalOpen) return;

    const oven = chamberPerOvenName.find(
        (item) => item.oven_name === selectedOven,
    );

    let chambers = [];

    if (oven?.chamber) {
        chambers = JSON.parse(oven.chamber);
    }

    const filtered = bakePackageDetails.filter(
        (item) =>
            item.oven_num === selectedOven && item.bake_status !== "complete",
    );

    const chamberMap = chambers.reduce((acc, chamber) => {
        acc[chamber] = filtered.filter((item) => item.chamber === chamber);
        return acc;
    }, {});

    setGroupedData(chamberMap);
}, [bakePackageDetails, selectedOven, isModalOpen]);

    // 🔄 realtime update
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // =========================
    // TIME FUNCTIONS
    // =========================
    const getRunningTime = (seconds) => {
        let s = Math.floor(seconds);

        const years = Math.floor(s / (365 * 24 * 3600));
        s %= 365 * 24 * 3600;

        const days = Math.floor(s / (24 * 3600));
        s %= 24 * 3600;

        const hours = Math.floor(s / 3600);
        s %= 3600;

        const minutes = Math.floor(s / 60);
        const secs = s % 60;

        if (years || days) {
            return `${years ? years + "y " : ""}${days ? days + "d " : ""}${hours}h ${minutes}m ${secs}s`;
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const computeSeconds = (start, end) => {
        const startTime = new Date(start).getTime();

        if (end) {
            const endTime = new Date(end).getTime();
            return Math.max((endTime - now) / 1000, 0);
        }

        return (now - startTime) / 1000;
    };

    // =========================
    // CHAMBER STATUS LOGIC
    // =========================
   const getChamberStatus = (items) => {
       if (!items || items.length === 0) {
           return {
               bg: "bg-gray-100",
               text: "text-gray-700",
               label: "IDLE",
               pulse: false,
               time: null,
           };
       }

       const item = items[0];

       // 🔴 INTERRUPTED
       if (item.bake_status === "interrupted") {
           return {
               bg: "bg-black",
               text: "text-white",
               label: "INTERRUPTED",
               pulse: false,
               time: null,
           };
       }

       // 🟣 NAKA-COOLDOWN NA TALAGA (galing na sa Start Cooldown)
       if (item.bake_status === "cooldown") {
           const cooldownSeconds = computeCooldownSeconds(item.cooldown_end);

           if (cooldownSeconds <= 0) {
               return {
                   bg: "bg-red-500/50",
                   text: "text-red-600",
                   label: "READY TO UNLOAD (COOLDOWN DONE)",
                   pulse: true,
                   time: null,
                   readyToUnload: true,
               };
           }

           return {
               bg: "bg-purple-500/30",
               text: "text-purple-600",
               label: "COOLDOWN",
               pulse: true,
               time: getRunningTime(cooldownSeconds),
               readyToUnload: false,
           };
       }

       const seconds = computeSeconds(item.date_time_in, item.date_time_out);

       // 🔵 FOR COOLDOWN — tapos na ang bake time, hindi pa naka-start ng cooldown
       if (seconds <= 0) {
           return {
               bg: "bg-red-500/50",
               text: "text-red-600",
               label: "FOR COOLDOWN",
               pulse: true,
               time: null,
               needsCooldown: true,
           };
       }

       // 🟠 WARNING
       if (seconds <= 1800) {
           return {
               bg: "bg-orange-500/50",
               text: "text-orange-600",
               label: "BE READY TO UNLOAD",
               pulse: false,
               time: getRunningTime(seconds),
           };
       }

       // 🟢 NORMAL
       return {
           bg: "bg-green-500/20",
           border: "border-green-500",
           text: "text-gray-700",
           label: "IN USE",
           pulse: false,
           time: getRunningTime(seconds),
       };
   };

    // =========================
    // VIEW MODAL
    // =========================
    const handleView = (ovenNum) => {

        const oven = chamberPerOvenName.find(
            (item) => item.oven_name === ovenNum
        );

        let chambers = [];

        if (oven?.chamber) {
            chambers = JSON.parse(oven.chamber);
        }

        const filtered = bakePackageDetails.filter(
            (item) =>
                item.oven_num === ovenNum &&
                item.bake_status !== "complete"
        );

        const chamberMap = chambers.reduce((acc, chamber) => {
            acc[chamber] = filtered.filter(
                (item) => item.chamber === chamber
            );
            return acc;
        }, {});

        setSelectedOven(ovenNum);
        setGroupedData(chamberMap);
        setIsModalOpen(true);
    };

    // useEffect(() => {
    //     if (partName) {
    //         setPrinterOptions(
    //             partName.map((p) => ({
    //                 name: p.printer_name,
    //                 serial: p.serial_number,
    //                 location: p.location,
    //             })),
    //         );
    //     }
    // }, [partName]);

    // // Handle printer select change
    // const handlePrinterChange = (e) => {
    //     const selected = printerOptions.find((p) => p.name === e.target.value);
    //     setSelectedPrinter(e.target.value); // ito ang magpapa-select sa <select>
    //     setSerialNumber(selected?.serial || ""); // fill serial number
    //     setLocation(selected?.location || ""); // fill location
    // };

    // =========================
    // TABLE DATA
    // =========================
    const dataWithAction = tableData.data.map((item) => ({
        ...item,
        actions: (
            <button
                onClick={() => handleView(item.oven_num)}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
                <Eye className="w-4 h-4" />
            </button>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Bakeforms" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="flex items-center text-2xl font-bold text-blue-800">
                    <ListTree className="w-9 h-9" />
                    Dry Bake List
                </h1>
            </div>

            {/* TABLE */}
            <DataTable
                columns={[
                    { key: "oven_num", label: "Oven" },
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
                routeName={route("forms.index")}
                filters={tableFilters}
                rowKey="id"
                showExport={false}
            />

            {/* MODAL */}
            <BakeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedOven={selectedOven}
                groupedData={groupedData}
                setGroupedData={setGroupedData}
                getChamberStatus={getChamberStatus}
                bakePackageDetails={bakePackageDetails}
                ovenStatus={ovenStatus}
            />
        </AuthenticatedLayout>
    );
}
