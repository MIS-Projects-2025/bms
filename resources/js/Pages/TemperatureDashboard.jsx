import { useEffect, useState, useRef, useCallback } from "react";
import { getTemperatures } from "./services/smartdac";

import { Card } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";

const CHANNEL_NAMES = {
    "0001": "TBOVEN03",
    "0002": "06EGOVEN",
    "0003": "03 BLUEM OVEN",
    "0004": "05 BLUEM OVEN",
    "0005": "04 BINDER OVEN",
    "0006": "TBOVEN2",
    "0007": "TBOVEN1",
    "0008": "01 BLUEM OVEN",
    "0009": "OVEN6",
    "0010": "NONE ASSIGN",
    "0101": "10 BINDER OVEN",
    "0102": "07 BINDER OVEN",
    "0103": "005 BLUEM OVEN",
    "0104": "04 BLUEM OVEN",
    "0105": "02 BLUEM OVEN",
    "0106": "EP02OP",
    "0107": "05 BINDER OVEN",
    "0108": "NONE ASSIGN",
    "0109": "NONE ASSIGN",
    "0110": "NONE ASSIGN",
};

// CRITICAL: 3 fast high-pitched beeps
// HIGH:     2 medium beeps
// WARN:     1 low soft beep
function playBeep(audioCtx, type) {
    if (!audioCtx) return;

    const configs = {
        CRITICAL: [
            { offset: 0, freq: 1050, dur: 0.22, vol: 0.5 },
            { offset: 0.32, freq: 1050, dur: 0.22, vol: 0.5 },
            { offset: 0.64, freq: 1050, dur: 0.22, vol: 0.5 },
        ],
        HIGH: [
            { offset: 0, freq: 660, dur: 0.28, vol: 0.4 },
            { offset: 0.4, freq: 660, dur: 0.28, vol: 0.4 },
        ],
        WARN: [{ offset: 0, freq: 440, dur: 0.35, vol: 0.25 }],
    };

    const tones = configs[type] || [];
    tones.forEach(({ offset, freq, dur, vol }) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type === "WARN" ? "sine" : "square";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + offset);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + offset + dur,
        );
        osc.start(audioCtx.currentTime + offset);
        osc.stop(audioCtx.currentTime + offset + dur);
    });
}

const getStatus = (status, temp) => {
    if (status === "O") return "OFF";
    if (temp == null) return "INVALID";
    if (temp >= 130) return "CRITICAL";
    if (temp >= 100) return "HIGH";
    if (temp >= 80) return "WARN";
    return "NORMAL";
};

const normalizeTemp = (temp) => {
    if (temp === -9999999.9) return null;
    if (temp < -1000) return null;
    return temp;
};

const getChannelName = (channel) => CHANNEL_NAMES[channel] ?? `CH ${channel}`;

const ALERT_CONFIG = {
    CRITICAL: {
        interval: 5000,
        badge: "destructive",
        tempColor: "text-red-600",
        cardClass: "ring-2 ring-red-500 bg-red-50",
        icon: "⚠",
        iconColor: "text-red-600",
        bannerClass: "bg-red-600",
        label: "CRITICAL",
    },
    HIGH: {
        interval: 10000,
        badge: "destructive",
        tempColor: "text-orange-500",
        cardClass: "ring-2 ring-orange-400 bg-orange-50",
        icon: "🔺",
        iconColor: "text-orange-500",
        bannerClass: "bg-orange-500",
        label: "HIGH",
    },
    WARN: {
        interval: 20000,
        badge: "secondary",
        tempColor: "text-yellow-500",
        cardClass: "ring-2 ring-yellow-400 bg-yellow-50",
        icon: "⚡",
        iconColor: "text-yellow-500",
        bannerClass: "bg-yellow-500",
        label: "WARN",
    },
};

const STATE_PRIORITY = ["CRITICAL", "HIGH", "WARN"];

export default function TemperatureDashboard() {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // { CRITICAL: [...channels], HIGH: [...], WARN: [...] }
    const [alertMap, setAlertMap] = useState({
        CRITICAL: [],
        HIGH: [],
        WARN: [],
    });

    const audioCtxRef = useRef(null);
    const alarmTimers = useRef({});

    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (
                window.AudioContext || window.webkitAudioContext
            )();
        }
    }, []);

    const toggleSound = () => {
        initAudio();
        setSoundEnabled((prev) => !prev);
    };

    // Manage repeating alarms per severity
    useEffect(() => {
        STATE_PRIORITY.forEach((sev) => {
            clearInterval(alarmTimers.current[sev]);
            const affected = alertMap[sev] || [];

            if (affected.length > 0 && soundEnabled) {
                initAudio();
                playBeep(audioCtxRef.current, sev);
                alarmTimers.current[sev] = setInterval(() => {
                    playBeep(audioCtxRef.current, sev);
                }, ALERT_CONFIG[sev].interval);
            }
        });

        return () =>
            STATE_PRIORITY.forEach((sev) =>
                clearInterval(alarmTimers.current[sev]),
            );
    }, [alertMap, soundEnabled]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const res = await getTemperatures();
                if (!isMounted) return;

                const data = res.data || [];
                setChannels(data);
                setLoading(false);
                setError(null);
                setLastUpdated(new Date().toLocaleTimeString());

                const newAlertMap = { CRITICAL: [], HIGH: [], WARN: [] };
                data.forEach((ch) => {
                    const temp = normalizeTemp(ch.temperature);
                    const state = getStatus(ch.status, temp);
                    if (newAlertMap[state]) newAlertMap[state].push(ch.channel);
                });
                setAlertMap(newAlertMap);
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError("Failed to load y0k0g4w4 data");
                    setLoading(false);
                }
            }
        };

        loadData();
        const interval = setInterval(loadData, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500 text-lg">
                Loading y0k0g4w4 data...
            </div>
        );

    if (error)
        return (
            <div className="flex items-center justify-center h-screen text-red-500 text-lg">
                {error}
            </div>
        );

    const activeAlerts = STATE_PRIORITY.filter((s) => alertMap[s].length > 0);

    return (

        <div className="flex flex-col h-screen overflow-hidden p-3 gap-2">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold">SmartDAC Oven Monitor</h1>

                    {/* Alert banners */}
                    {activeAlerts.map((sev) => (
                        <span
                            key={sev}
                            className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full animate-pulse ${ALERT_CONFIG[sev].bannerClass}`}
                        >
                            {ALERT_CONFIG[sev].icon} {sev}: CH{" "}
                            {alertMap[sev].join(", ")}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <button
                        onClick={toggleSound}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition ${soundEnabled
                                ? "border-green-500 text-green-600 bg-green-50"
                                : "border-gray-300 text-gray-400"
                            }`}
                    >
                        {soundEnabled ? "🔔 Sound ON" : "🔕 Sound OFF"}
                    </button>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                        Live · {lastUpdated ?? "—"}
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-hidden">
                <div
                    className="grid h-full gap-2 m-2"
                    style={{
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(190px, 1fr))",
                        gridTemplateRows:
                            "repeat(auto-fill, minmax(120px, 1fr))",
                    }}
                >
                    {Array.isArray(channels) &&
                        channels.map((ch) => {
                            const temp = normalizeTemp(ch.temperature);
                            const state = getStatus(ch.status, temp);
                            const name = getChannelName(ch.channel);
                            const isNoneAssign = name === "NONE ASSIGN";
                            const cfg = ALERT_CONFIG[state];

                            const badgeVariant =
                                cfg?.badge ??
                                (state === "OFF"
                                    ? "outline"
                                    : state === "INVALID"
                                        ? "destructive"
                                        : "default");

                            const tempColor =
                                cfg?.tempColor ??
                                (state === "OFF" || state === "INVALID"
                                    ? "text-gray-400"
                                    : "text-green-600");

                            return (
                                <Card
                                    key={ch.channel}
                                    className={`relative shadow-sm transition flex flex-col justify-between p-2 ${isNoneAssign
                                            ? "opacity-50"
                                            : "hover:shadow-md"
                                        } ${cfg?.cardClass ?? ""} ${state === "CRITICAL"
                                            ? "animate-pulse"
                                            : ""
                                        }`}
                                >
                                    {/* Status dot / icon */}
                                    {cfg ? (
                                        <span
                                            className={`absolute top-1.5 right-2 text-xs font-bold ${cfg.iconColor}`}
                                        >
                                            {cfg.icon}
                                        </span>
                                    ) : (
                                        !isNoneAssign && (
                                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        )
                                    )}

                                    {/* CH number + badge */}
                                    <div className="flex items-center justify-between pr-4">
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            CH {ch.channel}
                                        </span>
                                        <Badge
                                            variant={badgeVariant}
                                            className="text-[9px] px-1 py-0 h-4"
                                        >
                                            {state}
                                        </Badge>
                                    </div>

                                    {/* Name */}
                                    <div className="text-xs font-semibold truncate leading-tight">
                                        {name}
                                    </div>

                                    {/* Temp */}
                                    <div
                                        className={`text-2xl font-bold leading-none ${tempColor}`}
                                    >
                                        {temp !== null ? `${temp}°C` : "--"}
                                    </div>
                                </Card>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
