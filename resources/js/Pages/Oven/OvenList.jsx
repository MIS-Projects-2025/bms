import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { Inbox, Power, Clock, X, Save, AlertTriangle, Eye } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import Toast from "@/Components/Toast";

const CHANNEL_MAP = {
    "0001": "TBOVEN03",
    "0002": "06EGOVEN",
    "0003": "03 BLUEM OVEN",
    "0004": "05 BLUEM OVEN",
    "0005": "04 BINDER OVEN",
    "0006": "TBOVEN2",
    "0007": "TBOVEN1",
    "0008": "01 BLUEM OVEN",
    "0009": "OVEN6",
    "0101": "10 BINDER OVEN",
    "0102": "07 BINDER OVEN",
    "0103": "005 BLUEM OVEN",
    "0104": "04 BLUEM OVEN",
    "0105": "02 BLUEM OVEN",
    "0106": "EP02OP",
    "0107": "05 BINDER OVEN",
};

function buildTempMap(smartdacData) {
    const map = {};
    smartdacData.forEach((ch) => {
        const ovenName = CHANNEL_MAP[ch.channel];
        if (ovenName && ch.temperature != null && ch.temperature > -1000) {
            map[ovenName] = ch.temperature;
        }
    });
    return map;
}

async function fetchSmartDAC() {
    const res = await fetch("/api/smartdac/temperatures");
    const json = await res.json();
    return json.data || [];
}

// ── Chamber Detail Modal ─────────────────────────────────────────────────────
function ChamberModal({ ovenName, chambers, now, onClose, onCooldown, onComplete, loadingId, formatTime, getChamberColor }) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 w-[480px] max-h-[80vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
                    <h2 className="text-lg font-bold">{ovenName} — Pending Chambers</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Chamber list */}
                <div className="overflow-y-auto p-5 space-y-3">
                    {chambers.map((ch, idx) => {
                        const end               = new Date(ch.end);
                        const remaining         = Math.floor((end - now) / 1000);
                        const cooldownEnd       = ch.cooldown_end ? new Date(ch.cooldown_end) : null;
                        const cooldownRemaining = cooldownEnd ? Math.floor((cooldownEnd - now) / 1000) : null;
                        const isCoolingDown     = cooldownEnd && cooldownRemaining > 0;
                        const isCooldownDone    = cooldownEnd && cooldownRemaining <= 0;

                        return (
                            <div key={idx} className={`p-3 rounded border ${getChamberColor(remaining, ch.status)}`}>
                                <div className="flex justify-between text-sm font-semibold flex-wrap gap-1">
                                    <span>Chamber {ch.chamber}</span>

                                    {ch.status === "interrupted" ? (
                                        <span>INTERRUPTED</span>
                                    ) : isCoolingDown ? (
                                        <span className="text-purple-800 font-bold">
                                            🟣 {formatTime(cooldownRemaining)}
                                        </span>
                                    ) : isCooldownDone ? (
                                        <div className="grid gap-1 w-full mt-1">
                                            <span className="text-emerald-600 font-bold text-xs">🟢 Done Cooldown — READY TO UNLOAD</span>
                                            <button
                                                onClick={() => onComplete(ch.id)}
                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                                            >
                                                {loadingId === ch.id ? "Saving..." : "Unload Package"}
                                            </button>
                                        </div>
                                    ) : remaining <= 0 ? (
                                        <div className="grid gap-1 w-full mt-1">
                                            <span className="text-white font-bold text-xs">🔵 FOR COOLDOWN</span>
                                            <button
                                                onClick={() => onCooldown(ch)}
                                                className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
                                            >
                                                Start Cooldown
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function OvenList() {
    const { emp_data, flash } = usePage().props;
    const role = emp_data?.emp_system_role?.toLowerCase().trim();
    const { ovenList, ovenDetails, ovenStatus, bakePackageDetails } = usePage().props;

    const alarmRef     = useRef(null);
    const triggeredRef = useRef({});

    const [now, setNow]             = useState(new Date());
    const [actualTemps, setActualTemps] = useState({});
    const [dropTimers, setDropTimers]   = useState({});
    const dropTimersRef                 = useRef({});
    const savingRef                     = useRef({});

    // Toast notification
    const [toast, setToast] = useState(null); // { message, type }

    // Watch Inertia flash messages (from redirect()->back()->with(...))
    useEffect(() => {
        if (flash?.success) {
            setToast({ message: flash.success, type: "success" });
        } else if (flash?.error) {
            setToast({ message: flash.error, type: "error" });
        }
    }, [flash]);

    // Modal states
    const [addTimeModal, setAddTimeModal]   = useState(false);
    const [selectedOven, setSelectedOven]   = useState(null);
    const [timeInput, setTimeInput]         = useState({ hours: "", minutes: "", seconds: "" });
    const [loadingId, setLoadingId]         = useState(null);

    // Chamber detail modal
    const [chamberModal, setChamberModal]   = useState(null); // ovenName | null

    // ── Inertia reload ──────────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ["ovenList", "ovenDetails", "ovenStatus", "bakePackageDetails"],
                preserveState: true,
                preserveScroll: true,
            });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // ── Clock ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Audio unlock ────────────────────────────────────────────────────────
    useEffect(() => {
        const unlock = () => {
            if (alarmRef.current) {
                alarmRef.current.play()
                    .then(() => { alarmRef.current.pause(); alarmRef.current.currentTime = 0; })
                    .catch(() => {});
            }
        };
        window.addEventListener("click", unlock, { once: true });
        return () => window.removeEventListener("click", unlock);
    }, []);

    // ── SmartDAC polling ────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        const poll = async () => {
            try {
                const data = await fetchSmartDAC();
                if (!mounted) return;
                setActualTemps(buildTempMap(data));
            } catch (e) { console.error("SmartDAC fetch error", e); }
        };
        poll();
        const interval = setInterval(poll, 5000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // ── Drop timer logic ────────────────────────────────────────────────────
    // Uses a grace period before confirming "recovered" — prevents sensor
    // noise/flicker around the target temp from prematurely cutting the timer
    // and saving only a few seconds instead of the real total drop duration.
    const recoveryGraceRef = useRef({}); // { ovenName: timestamp when recovery first seen }
    const GRACE_MS = 10000; // must stay recovered for 10s before we save & stop

    useEffect(() => {
        ovenList.forEach((oven) => {
            const ovenName = oven.machine_num;
            const status   = ovenStatus?.[ovenName]?.status || "idle";
            if (status !== "inuse") return;

            const activeChambers = ovenDetails.filter(
                (d) => d.oven === ovenName && d.status === "inuse"
            );
            if (!activeChambers.length) return;

            const targetTemp = parseFloat(activeChambers[0].temperature);
            const actualTemp = actualTemps[ovenName];
            if (actualTemp == null || isNaN(targetTemp)) return;

            const isDropping = actualTemp < targetTemp;
            const timerState = dropTimersRef.current[ovenName];

            if (isDropping) {
                recoveryGraceRef.current[ovenName] = null;

                if (!timerState) {
                    const started = { startedAt: Date.now(), elapsed: 0 };
                    dropTimersRef.current[ovenName] = started;
                    setDropTimers((prev) => ({ ...prev, [ovenName]: started }));
                    console.log(`[DropTimer] ${ovenName}: STARTED at`, new Date(started.startedAt).toLocaleTimeString());
                }
                return;
            }

            if (!timerState || savingRef.current[ovenName]) return;

            if (!recoveryGraceRef.current[ovenName]) {
                recoveryGraceRef.current[ovenName] = Date.now();
                console.log(`[DropTimer] ${ovenName}: recovery grace started, waiting ${GRACE_MS / 1000}s to confirm`);
                return;
            }

            const recoveredFor = Date.now() - recoveryGraceRef.current[ovenName];
            if (recoveredFor < GRACE_MS) return;

            // Confirmed recovered — compute elapsed directly from the ORIGINAL startedAt.
            // This is the single source of truth — same ref used for display.
            const elapsedMs = Date.now() - timerState.startedAt;
            const elapsed    = Math.floor(elapsedMs / 1000);

            console.log(`[DropTimer] ${ovenName}: RECOVERED. startedAt=${new Date(timerState.startedAt).toLocaleTimeString()} now=${new Date().toLocaleTimeString()} elapsed=${elapsed}s`);

            savingRef.current[ovenName] = true;
            recoveryGraceRef.current[ovenName] = null;

            activeChambers.forEach((ch) => {
                router.put(route("bake.extend", ch.id), { add_seconds: elapsed }, {
                    preserveScroll: true,
                    onError: (errors) => {
                        console.error(`[DropTimer] ${ovenName}: save FAILED`, errors);
                        setToast({ message: "Failed to extend bake time. Please check the oven manually.", type: "error" });
                    },
                    onFinish: () => { savingRef.current[ovenName] = false; },
                });
            });

            dropTimersRef.current[ovenName] = null;
            setDropTimers((prev) => ({ ...prev, [ovenName]: null }));
        });
    }, [actualTemps, now]);

    // ── Elapsed tick ────────────────────────────────────────────────────────
    useEffect(() => {
        const tick = setInterval(() => {
            setDropTimers((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach((ovenName) => {
                    const ref = dropTimersRef.current[ovenName];
                    if (ref) next[ovenName] = { ...ref, elapsed: Math.floor((Date.now() - ref.startedAt) / 1000) };
                });
                return next;
            });
        }, 1000);
        return () => clearInterval(tick);
    }, []);

    // ── Alarm + speech ──────────────────────────────────────────────────────
    useEffect(() => {
        let hasActiveAlarm = false;
        ovenDetails.forEach((ch) => {
            const end          = new Date(ch.end);
            const remainingSec = Math.floor((end - now) / 1000);
            const key          = `${ch.oven}-${ch.chamber}`;
            const isDone       = remainingSec <= 0;
            const is30MinWarn  = remainingSec <= 1800 && remainingSec > 0;
            const cooldownEnd       = ch.cooldown_end ? new Date(ch.cooldown_end) : null;
            const cooldownRemaining = cooldownEnd ? Math.floor((cooldownEnd - now) / 1000) : null;

            if (isDone && !cooldownEnd && !triggeredRef.current[`done-${key}`]) {
                triggeredRef.current[`done-${key}`] = true;
                if (alarmRef.current) { alarmRef.current.loop = true; alarmRef.current.play().catch(() => {}); }
            }
            if (is30MinWarn && !triggeredRef.current[`warn-${key}`]) {
                triggeredRef.current[`warn-${key}`] = true;
                const msg = new SpeechSynthesisUtterance(`Be ready for Oven ${ch.oven}, ${ch.chamber}, 30 minutes before unloading`);
                speechSynthesis.cancel();
                speechSynthesis.speak(msg);
            }
            if (cooldownEnd && cooldownRemaining <= 0 && !triggeredRef.current[`cool-${key}`]) {
                triggeredRef.current[`cool-${key}`] = true;
                if (alarmRef.current) { alarmRef.current.loop = true; alarmRef.current.play().catch(() => {}); }
            }
            if (isDone || (cooldownRemaining !== null && cooldownRemaining <= 0)) hasActiveAlarm = true;
        });
        if (!hasActiveAlarm && alarmRef.current) {
            alarmRef.current.pause();
            alarmRef.current.currentTime = 0;
        }
    }, [now, ovenDetails]);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const formatTime = (seconds) => {
        if (!seconds || seconds < 0) return "00:00:00";
        const years   = Math.floor(seconds / (365 * 24 * 3600)); seconds %= 365 * 24 * 3600;
        const days    = Math.floor(seconds / (24 * 3600));        seconds %= 24 * 3600;
        const hours   = Math.floor(seconds / 3600);               seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        const secs    = seconds % 60;
        if (years || days) return `${years ? years + "y " : ""}${days ? days + "d " : ""}${hours}h ${minutes}m ${secs}s`;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const getOvenCardColor = (ovenName) => {
        const status = ovenStatus?.[ovenName]?.status || "idle";
        switch (status) {
            case "shutdown":  return "bg-blue-500/30 border-blue-600";
            case "idle":      return "bg-gray-200/30 border-gray-400";
            case "inuse":     return "bg-green-500/20 border-green-600";
            case "unloading": return "bg-red-500/20 border-red-600 animate-pulse";
            case "cooldown":  return "bg-purple-500/20 border-purple-600 animate-pulse";
            default:          return "bg-gray-100/30 border-gray-300";
        }
    };

    const getChamberColor = (remainingSec, status) => {
        if (status === "interrupted") return "bg-black/80 text-white";
        if (status === "cooldown")    return "bg-purple-500/20 border-purple-500 animate-pulse";
        const isDone  = remainingSec <= 0;
        const is30Min = remainingSec <= 1800 && remainingSec > 0;
        if (isDone)   return "bg-red-500 text-white animate-pulse";
        if (is30Min)  return "bg-orange-400/30 border-orange-500";
        switch (status) {
            case "inuse":    return "bg-green-500/20 border-green-500";
            case "shutdown": return "bg-blue-500/20 border-blue-500";
            default:         return "bg-gray-200/20 border-gray-400";
        }
    };

    // Classify a chamber as pending (cooldown/unload)
    const isPendingChamber = (d) => {
        const end               = new Date(d.end);
        const remaining         = Math.floor((end - now) / 1000);
        const cooldownEnd       = d.cooldown_end ? new Date(d.cooldown_end) : null;
        const cooldownRemaining = cooldownEnd ? Math.floor((cooldownEnd - now) / 1000) : null;
        const isCoolingDown     = cooldownEnd && cooldownRemaining > 0;
        const isCooldownDone    = cooldownEnd && cooldownRemaining <= 0;
        return remaining <= 0 || isCoolingDown || isCooldownDone || d.status === "cooldown";
    };

    // ── Actions ──────────────────────────────────────────────────────────────
    const toggleOvenStatus = (ovenName, currentStatus) => {
        const newStatus = currentStatus === "shutdown" ? "idle" : "shutdown";
        if (currentStatus === "shutdown") {
            setSelectedOven({ ovenName, newStatus });
            setAddTimeModal(true);
            return;
        }
        router.put(route("ovenstatus.shutdown", ovenName), { status: newStatus });
    };

    const submitAddTime = () => {
        const h = Number(timeInput.hours || 0);
        const m = Number(timeInput.minutes || 0);
        const s = Number(timeInput.seconds || 0);
        if (h < 0 || m < 0 || s < 0) { alert("Invalid input"); return; }
        router.put(route("ovenstatus.update", selectedOven.ovenName), {
            status: selectedOven.newStatus,
            add_seconds: (h * 3600) + (m * 60) + s,
        }, {
            onSuccess: () => {
                setAddTimeModal(false);
                setTimeInput({ hours: "", minutes: "", seconds: "" });
                setSelectedOven(null);
                router.reload({ only: ["ovenStatus", "ovenDetails"] });
            },
        });
    };

    const startCooldown = (ch) => {
        router.put(route("bake.cooldown", ch.id), {}, {
            preserveScroll: true,
            onSuccess: () => { router.reload({ only: ["ovenDetails", "ovenStatus"], preserveState: false }); window.location.reload(); },
        });
    };

    const markAsComplete = (id) => {
        setLoadingId(id);
        router.put(route("bake.complete", id), {}, {
            onFinish: () => setLoadingId(null),
            onSuccess: () => router.reload({ only: ["ovenDetails"] }),
        });
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <AuthenticatedLayout>
            <Head title="Oven List" />
            <audio ref={alarmRef} src="/sounds/freesound_community-security-alarm-80493.mp3" />

            {/* TOAST */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* HEADER */}
            <div className="flex items-center gap-2 mb-4">
                <Inbox className="w-7 h-7" />
                <h1 className="text-2xl font-bold">Oven Status</h1>
            </div>

            {/* LEGEND */}
            <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Color Legend:</p>
                <div className="p-4 border rounded bg-blue-300/10 border-blue-300 text-xs grid grid-cols-2 md:grid-cols-7 gap-3 dark:bg-gray-900">
                    {[
                        { color: "bg-gray-500",            label: "IDLE",           textColor: "text-gray-500"             },
                        { color: "bg-green-500",           label: "ONGOING",        textColor: "text-green-500"            },
                        { color: "bg-orange-500",          label: "30 MIN WARNING", textColor: "text-orange-500"           },
                        { color: "bg-red-500",             label: "UNLOADING",      textColor: "text-red-500"              },
                        { color: "bg-purple-500",          label: "COOLDOWN",       textColor: "text-purple-500"           },
                        { color: "bg-blue-500",            label: "SHUTDOWN",       textColor: "text-blue-500"             },
                        { color: "bg-black dark:bg-white", label: "INTERRUPTED",    textColor: "text-gray-800 dark:text-white" },
                    ].map(({ color, label, textColor }) => (
                        <div key={label} className={`flex items-center gap-2 font-semibold ${textColor}`}>
                            <span className={`w-3 h-3 ${color} rounded-sm`} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* OVEN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {ovenList.map((oven, i) => {
                    const ovenName      = oven.machine_num;
                    const currentStatus = ovenStatus?.[ovenName]?.status || "idle";
                    const actualTemp    = actualTemps[ovenName];
                    const dropTimer     = dropTimers[ovenName];

                    const activeChambers = ovenDetails.filter(
                        (d) => d.oven === ovenName && d.status === "inuse"
                    );
                    const targetTemp = activeChambers.length ? parseFloat(activeChambers[0].temperature) : null;
                    const isTempDrop = actualTemp != null && targetTemp != null && actualTemp < targetTemp;

                    // All chambers of this oven
                    const allChambers     = ovenDetails.filter((d) => d.oven === ovenName);
                    // Pending = cooldown or unloading
                    const pendingChambers = allChambers.filter(isPendingChamber);
                    const pendingCount    = pendingChambers.length;

                    return (
                        <div key={i} className={`p-4 border rounded-xl shadow ${getOvenCardColor(ovenName)}`}>

                            {/* OVEN HEADER */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h2 className="font-bold text-sm">{ovenName}</h2>
                                    <p className="text-xs">Status: <b>{currentStatus}</b></p>

                                    {/* Actual temp */}
                                    <p className={`text-xs font-semibold mt-0.5 ${isTempDrop ? "text-red-500 animate-pulse" : "text-green-600"}`}>
                                        Temp: <b>
                                            {actualTemp != null ? `${actualTemp}°C` : "N/A"}
                                            {targetTemp != null ? ` / ${targetTemp}°C` : ""}
                                        </b>
                                        {isTempDrop && " ⚠ DROP"}
                                    </p>

                                    {/* Drop timer */}
                                    {isTempDrop && dropTimer && (
                                        <p className="text-xs text-red-600 font-bold mt-0.5">
                                            🕐 {formatTime(dropTimer.elapsed)}
                                        </p>
                                    )}
                                </div>

                                {["superadmin"].includes(role) && (
                                    <button onClick={() => toggleOvenStatus(ovenName, currentStatus)}>
                                        <Power className="w-5 h-5 text-green-600 hover:text-red-600" />
                                    </button>
                                )}
                            </div>

                            {/* CHAMBER NUMBERS ROW */}
                            {allChambers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {allChambers.map((ch, idx) => {
                                        const end       = new Date(ch.end);
                                        const remaining = Math.floor((end - now) / 1000);
                                        const color     = getChamberColor(remaining, ch.status);
                                        // Simplified badge color for number pill
                                        const pillColor = ch.status === "interrupted"
                                            ? "bg-black text-white"
                                            : remaining <= 0
                                                ? "bg-red-500 text-white"
                                                : remaining <= 1800
                                                    ? "bg-orange-400 text-white"
                                                    : ch.status === "cooldown"
                                                        ? "bg-purple-500 text-white"
                                                        : ch.status === "inuse"
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-400 text-white";

                                        return (
                                            <span
                                                key={idx}
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pillColor}`}
                                                title={`Chamber ${ch.chamber}`}
                                            >
                                                {ch.chamber}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* PENDING CHAMBERS SECTION */}
                            {pendingCount === 0 && (
                                <p className="text-xs text-gray-400 italic">No pending chambers</p>
                            )}

                            {pendingCount === 1 && (
                                // Show inline if only 1 pending
                                (() => {
                                    const ch              = pendingChambers[0];
                                    const end             = new Date(ch.end);
                                    const remaining       = Math.floor((end - now) / 1000);
                                    const cooldownEnd     = ch.cooldown_end ? new Date(ch.cooldown_end) : null;
                                    const cooldownRem     = cooldownEnd ? Math.floor((cooldownEnd - now) / 1000) : null;
                                    const isCoolingDown   = cooldownEnd && cooldownRem > 0;
                                    const isCooldownDone  = cooldownEnd && cooldownRem <= 0;

                                    return (
                                        <div className={`p-2 rounded border text-xs ${getChamberColor(remaining, ch.status)}`}>
                                            <div className="font-semibold mb-1">Chamber {ch.chamber}</div>
                                            {ch.status === "interrupted" ? (
                                                <span>INTERRUPTED</span>
                                            ) : isCoolingDown ? (
                                                <span className="text-purple-800 font-bold">🟣 {formatTime(cooldownRem)}</span>
                                            ) : isCooldownDone ? (
                                                <div className="grid gap-1">
                                                    <span className="text-emerald-600 font-bold">🟢 READY TO UNLOAD</span>
                                                    <button onClick={() => markAsComplete(ch.id)} className="px-2 py-1 bg-green-600 text-white rounded">
                                                        {loadingId === ch.id ? "Saving..." : "Unload Package"}
                                                    </button>
                                                </div>
                                            ) : remaining <= 0 ? (
                                                <div className="grid gap-1">
                                                    <span className="text-white font-bold">🔵 FOR COOLDOWN</span>
                                                    <button onClick={() => startCooldown(ch)} className="px-2 py-1 bg-purple-600 text-white rounded">
                                                        Start Cooldown
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })()
                            )}

                            {pendingCount > 1 && (
                                // Show badge + view button if multiple pending
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex gap-1 flex-wrap">
                                        {/* Count badges per type */}
                                        {(() => {
                                            let cooldownCount = 0, unloadCount = 0;
                                            pendingChambers.forEach((ch) => {
                                                const cooldownEnd = ch.cooldown_end ? new Date(ch.cooldown_end) : null;
                                                const cooldownRem = cooldownEnd ? Math.floor((cooldownEnd - now) / 1000) : null;
                                                if (cooldownEnd && cooldownRem > 0) cooldownCount++;
                                                else unloadCount++;
                                            });
                                            return (
                                                <>
                                                    {cooldownCount > 0 && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500 text-white rounded-full">
                                                            🟣 {cooldownCount} Cooldown
                                                        </span>
                                                    )}
                                                    {unloadCount > 0 && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500 text-white rounded-full">
                                                            🔴 {unloadCount} Unload
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <button
                                        onClick={() => setChamberModal(ovenName)}
                                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-900"
                                    >
                                        <Eye className="w-3 h-3" /> View
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CHAMBER DETAIL MODAL */}
            {chamberModal && (
                <ChamberModal
                    ovenName={chamberModal}
                    chambers={ovenDetails.filter(
                        (d) => d.oven === chamberModal && isPendingChamber(d)
                    )}
                    now={now}
                    onClose={() => setChamberModal(null)}
                    onCooldown={startCooldown}
                    onComplete={markAsComplete}
                    loadingId={loadingId}
                    formatTime={formatTime}
                    getChamberColor={getChamberColor}
                />
            )}

            {/* ADD TIME MODAL */}
            {addTimeModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 w-[480px] rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-200 dark:border-gray-700">
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
                            <button onClick={() => setAddTimeModal(false)} className="text-gray-400 hover:text-red-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

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

                        <div className="grid grid-cols-3 gap-4">
                            {["hours", "minutes", "seconds"].map((unit) => (
                                <div key={unit} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                                    <label className="text-xs text-gray-500 dark:text-gray-300 capitalize">{unit}</label>
                                    <input
                                        type="number" min="0"
                                        value={timeInput[unit]}
                                        onChange={(e) => setTimeInput({ ...timeInput, [unit]: e.target.value })}
                                        className="w-full mt-1 border rounded-lg p-2 text-lg font-bold text-center focus:ring-2 focus:ring-green-500 text-gray-600"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-300">Leave blank if not needed</span>
                            <div className="flex gap-2">
                                <button onClick={() => setAddTimeModal(false)} className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                                <button onClick={submitAddTime} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-lg">
                                    <Save className="w-4 h-4" /> Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
