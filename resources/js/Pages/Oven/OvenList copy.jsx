import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { Inbox, Power, Clock, X, Save, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function OvenList() {
    const { emp_data } = usePage().props;

    const role = emp_data?.emp_system_role?.toLowerCase().trim();
    const { ovenList, ovenDetails, ovenStatus, bakePackageDetails } = usePage().props;

    const alarmRef = useRef(null);
    const triggeredRef = useRef({});

    const [now, setNow] = useState(new Date());





    useEffect(() => {
    const interval = setInterval(() => {
        router.reload({
    only: ["ovenList", "ovenDetails", "ovenStatus", "bakePackageDetails"],
    preserveState: true,
    preserveScroll: true,
});
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
}, []);

    /*
    | CLOCK
    */
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    /*
    | AUDIO UNLOCK
    */
    useEffect(() => {
        const unlock = () => {
            if (alarmRef.current) {
                alarmRef.current.play()
                    .then(() => {
                        alarmRef.current.pause();
                        alarmRef.current.currentTime = 0;
                    })
                    .catch(() => {});
            }
        };

        window.addEventListener("click", unlock, { once: true });
        return () => window.removeEventListener("click", unlock);
    }, []);

    /*
    | TIMER + SPEECH + ALARM
    */
useEffect(() => {
    let hasActiveAlarm = false;



    ovenDetails.forEach((ch) => {


        const end = new Date(ch.end);
        const remainingSec = Math.floor((end - now) / 1000);

        const key = `${ch.oven}-${ch.chamber}`;

        const isDone = remainingSec <= 0;
        const is30MinWarning = remainingSec <= 1800 && remainingSec > 0;

        const cooldownEnd = ch.cooldown_end ? new Date(ch.cooldown_end) : null;
        const cooldownRemaining = cooldownEnd
            ? Math.floor((cooldownEnd - now) / 1000)
            : null;

        // 🔴 UNLOADING ALARM
        if (isDone && !cooldownEnd && !triggeredRef.current[`done-${key}`]) {
            triggeredRef.current[`done-${key}`] = true;

            if (alarmRef.current) {
                alarmRef.current.loop = true;
                alarmRef.current.play().catch(() => {});
            }
        }

        // 🟠 30 MIN WARNING
        if (is30MinWarning && !triggeredRef.current[`warn-${key}`]) {
            triggeredRef.current[`warn-${key}`] = true;

            const msg = new SpeechSynthesisUtterance(
                `Be ready for Oven ${ch.oven}, ${ch.chamber}, 30 minutes before unloading`
            );

            speechSynthesis.cancel();
            speechSynthesis.speak(msg);
        }

        // 🟣 COOLDOWN DONE ALARM
        if (
            cooldownEnd &&
            cooldownRemaining <= 0 &&
            !triggeredRef.current[`cool-${key}`]
        ) {
            triggeredRef.current[`cool-${key}`] = true;

            if (alarmRef.current) {
                alarmRef.current.loop = true;
                alarmRef.current.play().catch(() => {});
            }
        }

        if (
            isDone ||
            (cooldownRemaining !== null && cooldownRemaining <= 0)
        ) {
            hasActiveAlarm = true;
        }
    });

    if (!hasActiveAlarm && alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
    }

}, [now, ovenDetails]);

    /*
    | FORMAT TIME
    */
    const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return "00:00:00";

    const years = Math.floor(seconds / (365 * 24 * 3600));
    seconds %= 365 * 24 * 3600;

    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    // 👉 kung may years or days, show full format
    if (years || days) {
        return `${years ? years + "y " : ""}${days ? days + "d " : ""}${hours}h ${minutes}m ${secs}s`;
    }

    // 👉 normal countdown (under 24hrs)
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

    /*
    | OVEN CARD COLOR
    */
    const getOvenCardColor = (ovenName) => {
        const status = ovenStatus?.[ovenName]?.status || "idle";

        switch (status) {
            case "shutdown":
                return "bg-blue-500/30 border-blue-600";
            case "idle":
                return "bg-gray-200/30 border-gray-400";
            case "inuse":
                return "bg-green-500/20 border-green-600";
            case "unloading":
                return "bg-red-500/20 border-red-600 animate-pulse";
            case "cooldown":
                return "bg-purple-500/20 border-purple-600 animate-pulse";
            default:
                return "bg-gray-100/30 border-gray-300";
        }
    };

    /*
    | CHAMBER COLOR (FIXED LOGIC)
    */
const getChamberColor = (remainingSec, status) => {
    if (status === "interrupted") {
        return "bg-black/80 text-white";
    }

    // ✅ PRIORITY: cooldown muna
    if (status === "cooldown") {
        return "bg-purple-500/20 border-purple-500 animate-pulse";
    }

    const is30Min = remainingSec <= 1800 && remainingSec > 0;
    const isDone = remainingSec <= 0;

    if (isDone) return "bg-red-500 text-white animate-pulse";
    if (is30Min) return "bg-orange-400/30 border-orange-500";

    switch (status) {
        case "inuse":
            return "bg-green-500/20 border-green-500";
        case "shutdown":
            return "bg-blue-500/20 border-blue-500";
        default:
            return "bg-gray-200/20 border-gray-400";
    }
};

const [addTimeModal, setAddTimeModal] = useState(false);
const [selectedOven, setSelectedOven] = useState(null);

const [timeInput, setTimeInput] = useState({
    hours: "",
    minutes: "",
    seconds: ""
});


    /*
    | TOGGLE STATUS
    */
const toggleOvenStatus = (ovenName, currentStatus) => {
    const newStatus = currentStatus === "shutdown" ? "idle" : "shutdown";
    // const chambers = ovenDetails.filter(
    //     d => d.oven === oven.machine_num
    // );

    if (currentStatus === "shutdown") {



        setSelectedOven({ ovenName, newStatus });
        setAddTimeModal(true);
        return;
    }

    router.put(route("ovenstatus.shutdown", ovenName), {
        status: newStatus
    });
};

const submitAddTime = () => {
    const h = Number(timeInput.hours || 0);
    const m = Number(timeInput.minutes || 0);
    const s = Number(timeInput.seconds || 0);

    if (h < 0 || m < 0 || s < 0) {
        alert("Invalid input");
        return;
    }

    const totalSeconds =
        (h * 3600) +
        (m * 60) +
        s;

    // if (totalSeconds <= 0) {
    //     alert("Please enter time");
    //     return;
    // }

    router.put(route("ovenstatus.update", selectedOven.ovenName), {
        status: selectedOven.newStatus,
        add_seconds: totalSeconds
    }, {
        onSuccess: () => {
            setAddTimeModal(false);
            setTimeInput({ hours: "", minutes: "", seconds: "" });
            setSelectedOven(null);

            router.reload({ only: ["ovenStatus", "ovenDetails"] });
        }
    });
};

const startCooldown = (ch) => {
    router.put(route("bake.cooldown", ch.id), {}, {
        preserveScroll: true,
        onSuccess: () => {
            router.reload({
                only: ["ovenDetails", "ovenStatus"],
                preserveState: false
            });
            window.location.reload();
        }
    });
};

const [loadingId, setLoadingId] = useState(null);

const markAsComplete = (id) => {
    setLoadingId(id);

    router.put(route("bake.complete", id), {}, {
        onFinish: () => setLoadingId(null),
        onSuccess: () => {
            router.reload({ only: ["ovenDetails"] });
        }
    });
};

    /*
    | TEMP
    */
    const getLatestTemp = (ovenName) => {
        const records = ovenDetails.filter(d => d.oven === ovenName);
        if (!records.length) return "N/A";

        const latest = records.reduce((a, b) =>
            new Date(a.end) > new Date(b.end) ? a : b
        );

        return latest.temperature ?? "N/A";
    };



    return (
        <AuthenticatedLayout>
            <Head title="Oven List" />

            <audio ref={alarmRef} src="/sounds/freesound_community-security-alarm-80493.mp3" />

            {/* HEADER */}
            <div className="flex items-center gap-2 mb-4">
                <Inbox className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Oven Status</h1>
            </div>
                        {/* LEGEND */}
<div className="mb-4">
    <p className="text-sm font-semibold mb-2">Color Legend:</p>

    <div className="p-4 border rounded bg-blue-300/10 border-blue-300 text-xs grid grid-cols-2 md:grid-cols-7 gap-3 dark:bg-gray-900">

        <div className="flex items-center gap-2 font-semibold text-gray-500">
            <span className="w-3 h-3 bg-gray-500 border rounded-sm dark:border-white"></span>
            IDLE
        </div>

        <div className="flex items-center gap-2 font-semibold text-green-500">
            <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
            ONGOING
        </div>

        <div className="flex items-center gap-2 font-semibold text-orange-500">
            <span className="w-3 h-3 bg-orange-500 rounded-sm"></span>
            30 MIN WARNING
        </div>

        <div className="flex items-center gap-2 font-semibold text-red-500">
            <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
            UNLOADING
        </div>

        <div className="flex items-center gap-2 font-semibold text-purple-500">
            <span className="w-3 h-3 bg-purple-500 rounded-sm"></span>
            COOLDOWN
        </div>

        <div className="flex items-center gap-2 font-semibold text-blue-500">
            <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
            SHUTDOWN
        </div>

        <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
            <span className="w-3 h-3 bg-black rounded-sm dark:bg-white"></span>
            INTERRUPTED
        </div>

    </div>
</div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

                {ovenList.map((oven, i) => {

                    const currentStatus = ovenStatus?.[oven.machine_num]?.status || "idle";
                    const temp = getLatestTemp(oven.machine_num);

                    const chambers = ovenDetails.filter(
                        d => d.oven === oven.machine_num
                    );

                    return (
                        <div
                            key={i}
                            className={`p-4 border rounded-xl shadow ${getOvenCardColor(oven.machine_num)}`}
                        >

                            {/* HEADER */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h2 className="font-bold">{oven.machine_num}</h2>
                                    <p className="text-xs">Status: <b>{currentStatus}</b></p>
                                    <p className="text-xs">Temp: <b>{temp}°C</b></p>
                                </div>

                                {["superadmin"].includes(role) && (
                                <button onClick={() =>
                                    toggleOvenStatus(oven.machine_num, currentStatus)
                                }>
                                    <Power className="w-6 h-6 text-green-600 hover:text-red-600" />
                                </button>
                                )}
                            </div>

                            {/* CHAMBERS */}
                            {chambers.map((ch, idx) => {

                               const end = new Date(ch.end);
const remaining = Math.floor((end - now) / 1000);

const cooldownEnd = ch.cooldown_end ? new Date(ch.cooldown_end) : null;
const cooldownRemaining = cooldownEnd
    ? Math.floor((cooldownEnd - now) / 1000)
    : null;

const isCoolingDown = cooldownEnd && cooldownRemaining > 0;
const isCooldownDone = cooldownEnd && cooldownRemaining <= 0;

                                return (
    <div
        key={idx}
        className={`p-3 mb-2 rounded border ${getChamberColor(remaining, ch.status)}`}
    >
        <div className="flex justify-between text-sm font-semibold">
            <span>{ch.chamber}</span>

            {ch.status === "interrupted" ? (
    <span>INTERRUPTED</span>

) : isCoolingDown ? (

    <span className="text-purple-800 font-bold ml-2">
       🟣 cooldown remaining: {formatTime(cooldownRemaining)}
    </span>

) : isCooldownDone ? (

    <div className="grid gap-2">
        <span className="text-emerald-600 font-bold ml-4">
           🟢 Done Cooldown READY TO UNLOAD
        </span>

        <button
            onClick={() => markAsComplete(ch.id)}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded"
        >
            Unload Package
        </button>
    </div>

) : remaining <= 0 ? (

    <div className="grid gap-2">
        <span className="text-white font-bold">
            🔵 FOR COOLDOWN
        </span>

        <button
            onClick={() => startCooldown(ch)}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
        >
            Start Cooldown
        </button>
    </div>

) : (
    <span>{formatTime(remaining)}</span>
)}
        </div>
    </div>
);
                            })}

                        </div>
                    );
                })}
            </div>

{addTimeModal && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">

        <div className="bg-white dark:bg-gray-900 w-[480px] rounded-2xl shadow-2xl p-6 space-y-6 animate-scaleIn border border-gray-200 dark:border-gray-700">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Add Baking Time</h2>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Resume oven with additional time</p>
                    </div>
                </div>

                <button
                    onClick={() => setAddTimeModal(false)}
                    className="text-gray-400 hover:text-red-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* ⚠️ GUIDE BOX (ATTENTION GRABBER) */}
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 dark:bg-gray-900 dark:text-yellow-500 p-3 rounded-lg text-sm flex gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                    <p className="font-semibold">How to input time:</p>
                    <ul className="list-disc ml-4 text-xs">
                        <li>Fill only what you need (hours / minutes / seconds)</li>
                        <li>Example: <b>1h 30m</b> → Hours = 1, Minutes = 30</li>
                        <li>You can leave other fields empty</li>
                    </ul>
                </div>
            </div>

            {/* INPUTS */}
            <div className="grid grid-cols-3 gap-4">

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                    <label className="text-xs text-gray-500 dark:text-gray-300">Hours</label>
                    <input
                        type="number"
                        min="0"
                        value={timeInput.hours}
                        onChange={(e) =>
                            setTimeInput({ ...timeInput, hours: e.target.value })
                        }
                        className="w-full mt-1 border rounded-lg p-2 text-lg font-bold text-center focus:ring-2 focus:ring-green-500 text-gray-600"
                    />
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                    <label className="text-xs text-gray-500 dark:text-gray-300">Minutes</label>
                    <input
                        type="number"
                        min="0"
                        value={timeInput.minutes}
                        onChange={(e) =>
                            setTimeInput({ ...timeInput, minutes: e.target.value })
                        }
                        className="w-full mt-1 border rounded-lg p-2 text-lg font-bold text-center focus:ring-2 focus:ring-green-500 text-gray-600"
                    />
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                    <label className="text-xs text-gray-500 dark:text-gray-300">Seconds</label>
                    <input
                        type="number"
                        min="0"
                        value={timeInput.seconds}
                        onChange={(e) =>
                            setTimeInput({ ...timeInput, seconds: e.target.value })
                        }
                        className="w-full mt-1 border rounded-lg p-2 text-lg font-bold text-center focus:ring-2 focus:ring-green-500 text-gray-600"
                    />
                </div>

            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center pt-2">

                {/* LEFT INFO */}
                <span className="text-xs text-gray-500 dark:text-gray-300">
                    Leave blank if not needed
                </span>

                {/* BUTTONS */}
                <div className="flex gap-2">

                    <button
                        onClick={() => setAddTimeModal(false)}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>

                    <button
                        onClick={submitAddTime}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-lg"
                    >
                        <Save className="w-4 h-4" />
                        Submit
                    </button>

                </div>

            </div>

        </div>
    </div>
)}
        </AuthenticatedLayout>
    );
}
