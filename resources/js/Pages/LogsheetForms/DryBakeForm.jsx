import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { Vault, ClipboardList } from "lucide-react";

export default function DryBakeForm({
    ovens = [],
    chambers = [],
    packageLots = [],
}) {
    const [availableChambers, setAvailableChambers] = useState([]);
    const [showChamberDropdown, setShowChamberDropdown] = useState(false);
    const [timeOptions, setTimeOptions] = useState([]);
    const [tempOptions, setTempOptions] = useState([]);
    const [processing, setProcessing] = useState(false);
    const chamberRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                chamberRef.current &&
                !chamberRef.current.contains(event.target)
            ) {
                setShowChamberDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const normalizedChambers = (
        Array.isArray(chambers) ? chambers : []
    ).flatMap((item) => {
        let list = item.chamber;

        // if JSON string
        if (typeof list === "string") {
            try {
                list = JSON.parse(list);
            } catch {
                list = [list];
            }
        }

        // ensure array
        if (!Array.isArray(list)) {
            list = [list];
        }

        return list.map((ch) => ({
            oven: item.oven_name,
            chamber: ch,
        }));
    });

    /*
    |--------------------------------------------------
    | GROUP CHAMBERS BY OVEN
    |--------------------------------------------------
    */
    const chamberMap = normalizedChambers.reduce((acc, item) => {
        if (!acc[item.oven]) acc[item.oven] = [];
        acc[item.oven].push(item.chamber);
        return acc;
    }, {});

    const getCurrentDateTimeLocal = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    /*
    |--------------------------------------------------
    | FORM STATE
    |--------------------------------------------------
    */
    const { data, setData } = useForm({
        oven: "",
        temperature: "",
        time: "",
        lotid: "",
        partname: "",
        package: "",
        qty: "",
        chamber: "",
        input_type: "",
        startDateTime: getCurrentDateTimeLocal(),
    });

    const isValidRow = () => {
        return (
            data.oven &&
            data.temperature &&
            data.time &&
            data.lotid &&
            data.partname &&
            data.package &&
            data.qty &&
            data.chamber &&
            data.input_type &&
            data.startDateTime
        );
    };

    const [rows, setRows] = useState([]);

    /*
    |--------------------------------------------------
    | ADD ROW
    |--------------------------------------------------
    */
    const addRow = () => {
        if (!isValidRow()) {
            alert("Please complete all fields before adding.");
            return;
        }

        setRows([...rows, { ...data }]);

        setData({
            ...data,
            temperature: "",
            time: "",
            lotid: "",
            partname: "",
            package: "",
            qty: "",
            chamber: "",
        });

        setData("startDateTime", getCurrentDateTimeLocal());
    };

    /*
    |--------------------------------------------------
    | REMOVE ROW
    |--------------------------------------------------
    */
    const removeRow = (index) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    /*
    |--------------------------------------------------
    | SAVE ALL
    |--------------------------------------------------
    */
    const saveAll = () => {
        setProcessing(true);
        router.post(
            route("dry-bake.bulk-store"),
            {
                data: rows,
            },
            {
                onSuccess: () => {
                    alert("✅ Saved successfully!");
                    setRows([]);
                    // window.location.reload();

                    setData({
                        oven: "",
                        temperature: "",
                        time: "",
                        lotid: "",
                        partname: "",
                        package: "",
                        qty: "",
                        chamber: "",
                        input_type: "",
                        startDateTime: getCurrentDateTimeLocal(),
                    });

                    setProcessing(false);
                },
                onError: () => {
                    alert("❌ error with validation");
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dry Bake Form" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="flex items-center text-2xl font-bold text-blue-800">
                    <Vault className="w-9 h-9" />
                    Bakeform`s
                </h1>
            </div>

            {/* FORM */}
            <div className="space-y-4">
                {/* TOP */}
                <div className="bg-white shadow rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* OVEN */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Oven
                            </label>
                            <select
                                className="border w-full rounded p-2 text-gray-600"
                                value={data.oven}
                                onChange={(e) => {
                                    const oven = e.target.value;

                                    setData("oven", oven);

                                    const found = chamberMap[oven] || [];
                                    setAvailableChambers([
                                        ...new Set(found.flat()),
                                    ]);

                                    setData("chamber", "");
                                }}
                            >
                                <option value="">Select Oven</option>
                                {ovens.map((o, i) => (
                                    <option key={i} value={o}>
                                        {o}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* LOT ID */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Lot ID
                            </label>
                            <input
                                className="border w-full rounded p-2 text-gray-600"
                                placeholder="Enter Lot ID"
                                value={data.lotid}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    setData("lotid", value);

                                    const found = packageLots.find((item) =>
                                        item.Lot_Id.toUpperCase().includes(
                                            value,
                                        ),
                                    );

                                    if (found) {
                                        setData(
                                            "partname",
                                            found.Part_Name || "",
                                        );
                                        setData(
                                            "package",
                                            found.Package_Name || "",
                                        );
                                        setData("qty", found.Qty || "");

                                        const bake = found.Bake_Time_Temp || "";

                                        // split OR cases
                                        const options = bake
                                            .split(/OR/i)
                                            .map((s) => s.trim());

                                        const parsed = options
                                            .map((opt) => {
                                                if (!opt) return null;

                                                const cleaned = opt
                                                    .toUpperCase()
                                                    .replace(/AT/gi, "@");

                                                // TIME (handles spaces automatically)
                                                const timeMatch =
                                                    cleaned.match(
                                                        /(\d+)\s*HRS?/i,
                                                    );

                                                // TEMP (handles: 125'C, 125' C, 125C, +135'C)
                                                const tempMatch =
                                                    cleaned.match(
                                                        /(\+?\d+)\s*'?\s*C/i,
                                                    );

                                                // fallback kung baliktad format
                                                if (!timeMatch || !tempMatch) {
                                                    const reverse =
                                                        cleaned.match(
                                                            /(\+?\d+)\s*'?\s*C.*?(\d+)\s*HRS?/i,
                                                        );

                                                    if (reverse) {
                                                        return {
                                                            time: reverse[2],
                                                            temp: reverse[1],
                                                        };
                                                    }
                                                }

                                                if (!timeMatch || !tempMatch)
                                                    return null;

                                                return {
                                                    time: timeMatch[1],
                                                    temp: tempMatch[1],
                                                };
                                            })
                                            .filter(Boolean);

                                        if (parsed.length === 1) {
                                            // SINGLE VALUE MODE
                                            setData("time", parsed[0].time);
                                            setData(
                                                "temperature",
                                                parsed[0].temp,
                                            );

                                            setTimeOptions([]);
                                            setTempOptions([]);
                                        } else if (parsed.length > 1) {
                                            // MULTIPLE MODE (SELECT MODE)
                                            setTimeOptions([
                                                ...new Set(
                                                    parsed.map((p) => p.time),
                                                ),
                                            ]);
                                            setTempOptions([
                                                ...new Set(
                                                    parsed.map((p) => p.temp),
                                                ),
                                            ]);

                                            setData("time", "");
                                            setData("temperature", "");
                                        } else {
                                            // fallback
                                            setData("time", "");
                                            setData("temperature", "");
                                            setTimeOptions([]);
                                            setTempOptions([]);
                                        }
                                    } else {
                                        setData("partname", "");
                                        setData("package", "");
                                        setData("qty", "");
                                        setData("temperature", "");
                                        setData("time", "");
                                        setTimeOptions([]);
                                        setTempOptions([]);
                                    }
                                }}
                            />
                        </div>

                        {/* PART NAME */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Part Name
                            </label>
                            <input
                                className="border-gray-300 w-full rounded p-2 text-gray-600 bg-gray-100"
                                value={data.partname}
                                readOnly
                            />
                            <span className="text-xs text-emerald-500 mt-1">
                                Auto-filled from Lot ID *
                            </span>
                        </div>

                        {/* PACKAGE */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Package
                            </label>
                            <input
                                className="border-gray-300 w-full rounded p-2 text-gray-600 bg-gray-100"
                                value={data.package}
                                readOnly
                            />
                            <span className="text-xs text-emerald-500 mt-1">
                                Auto-filled from Lot ID *
                            </span>
                        </div>

                        {/* TEMPERATURE */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Temperature (°C)
                            </label>

                            {tempOptions.length > 0 ? (
                                <select
                                    className="border w-full rounded p-2 text-gray-600"
                                    value={data.temperature}
                                    onChange={(e) =>
                                        setData("temperature", e.target.value)
                                    }
                                >
                                    <option value="">Select Temperature</option>
                                    {tempOptions.map((t, i) => (
                                        <option key={i} value={t}>
                                            {t} °C
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div>
                                    <input
                                        type="number"
                                        className="border-gray-300 w-full rounded p-2 text-gray-600"
                                        value={data.temperature}
                                        onChange={(e) =>
                                            setData(
                                                "temperature",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        {/* HOURS */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Time (Hours)
                            </label>

                            {timeOptions.length > 0 ? (
                                <select
                                    className="border w-full rounded p-2 text-gray-600"
                                    value={data.time}
                                    onChange={(e) =>
                                        setData("time", e.target.value)
                                    }
                                >
                                    <option value="">Select Hours</option>
                                    {timeOptions.map((t, i) => (
                                        <option key={i} value={t}>
                                            {t} Hours
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div>
                                    <input
                                        type="number"
                                        className="border-gray-300 w-full rounded p-2 text-gray-600"
                                        value={data.time}
                                        onChange={(e) =>
                                            setData("time", e.target.value)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DETAILS */}
                <div className="bg-white shadow rounded-xl p-4 space-y-4">
                    {/* ROW 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3"></div>

                    {/* ROW 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* QTY */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                className="border w-full rounded p-2 text-gray-600"
                                value={data.qty}
                                onChange={(e) => setData("qty", e.target.value)}
                            />
                        </div>

                        {/* CHAMBER */}
                        <div className="flex flex-col relative">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Chamber
                            </label>

                            <input
                                type="text"
                                placeholder="Search Chamber..."
                                className="border w-full rounded p-2 text-gray-600"
                                value={data.chamber}
                                onChange={(e) => {
                                    setData("chamber", e.target.value);
                                    setShowChamberDropdown(true);
                                }}
                                onFocus={() => setShowChamberDropdown(true)}
                            />

                            {/* {showChamberDropdown && (
                                <div className="absolute top-full mt-1 w-full bg-white border rounded shadow max-h-40 overflow-y-auto z-10">
                                    {(chamberMap[data.oven] || [])
                                        .filter((ch) =>
                                            ch
                                                .toLowerCase()
                                                .includes(
                                                    data.chamber.toLowerCase(),
                                                ),
                                        )
                                        .map((ch, i) => (
                                            <div
                                                key={i}
                                                className="p-2 hover:bg-blue-100 cursor-pointer text-gray-600"
                                                onClick={() => {
                                                    setData("chamber", ch);
                                                    setShowChamberDropdown(
                                                        false,
                                                    );
                                                }}
                                            >
                                                {ch}
                                            </div>
                                        ))} */}

                            {/* pag walang result */}
                            {/* {(chamberMap[data.oven] || []).filter(
                                        (ch) =>
                                            ch
                                                .toLowerCase()
                                                .includes(
                                                    data.chamber.toLowerCase(),
                                                ),
                                    ).length === 0 && (
                                        <div className="p-2 text-gray-400 text-sm">
                                            No results found
                                        </div>
                                    )} */}
                            {/* </div>
                            )} */}

                            {showChamberDropdown && (
                                <div className="absolute top-full mt-1 w-full bg-white border rounded shadow max-h-40 overflow-y-auto z-10">
                                    {(chamberMap[data.oven] || [])
                                        .filter((ch) =>
                                            (ch || "")
                                                .toLowerCase()
                                                .includes(
                                                    (
                                                        data.chamber || ""
                                                    ).toLowerCase(),
                                                ),
                                        )
                                        .map((ch, i) => (
                                            <div
                                                key={i}
                                                className="p-2 hover:bg-blue-100 cursor-pointer text-gray-600"
                                                onClick={() => {
                                                    setData("chamber", ch);
                                                    setShowChamberDropdown(
                                                        false,
                                                    );
                                                }}
                                            >
                                                {ch}
                                            </div>
                                        ))}

                                    {(chamberMap[data.oven] || []).filter(
                                        (ch) =>
                                            (ch || "")
                                                .toLowerCase()
                                                .includes(
                                                    (
                                                        data.chamber || ""
                                                    ).toLowerCase(),
                                                ),
                                    ).length === 0 && (
                                        <div className="p-2 text-gray-400 text-sm">
                                            No results found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/*Input Type*/}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Input Type
                            </label>
                            <select
                                name="input_type"
                                id=""
                                className="border w-full rounded p-2 text-gray-600"
                                onChange={(e) =>
                                    setData("input_type", e.target.value)
                                }
                            >
                                <option value="">Select Input Type</option>
                                <option value="tube">Tube</option>
                                <option value="tray">Tray</option>
                                <option value="canister">Canister</option>
                            </select>
                        </div>

                        {/* START DATE */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Start Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                className="border w-full rounded p-2 bg-gray-100/50 text-gray-600"
                                value={data.startDateTime}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* BUTTON */}
                    <div className="flex justify-center mt-6">
                        <button
                            type="button"
                            onClick={addRow}
                            disabled={!isValidRow()}
                            className={`px-4 py-2 rounded text-white ${
                                isValidRow()
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            + Add
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            {rows.length > 0 && (
                <div className="mt-6 bg-white shadow rounded-xl p-4">
                    <h2 className="flex items-center text-lg font-bold mb-3 text-gray-500">
                        <ClipboardList className="w-7 h-7" />
                        Pending Rows
                    </h2>

                    <table className="w-full text-sm text-left text-gray-500">
                        <thead>
                            <tr className="border-b">
                                <th>Oven</th>
                                <th>Lot</th>
                                <th>Partname</th>
                                <th>Package</th>
                                <th>Temp. (°C)</th>
                                <th>Time (Hours)</th>
                                <th>Qty</th>
                                <th>Chamber</th>
                                <th>Input Type</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} className="border-b">
                                    <td>{row.oven}</td>
                                    <td>{row.lotid}</td>
                                    <td>{row.partname}</td>
                                    <td>{row.package}</td>
                                    <td>{row.temperature}</td>
                                    <td>{row.time}</td>
                                    <td>{row.qty}</td>
                                    <td>{row.chamber}</td>
                                    <td>{row.input_type}</td>
                                    <td>
                                        <button
                                            disabled={
                                                rows.length === 0 || processing
                                            }
                                            onClick={() => removeRow(i)}
                                            className={`
                                     ${
                                         rows.length === 0 || processing
                                             ? "text-gray-400 cursor-not-allowed"
                                             : "text-red-600 hover:text-red-700"
                                     }`}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-center mt-6">
                        <button
                            disabled={rows.length === 0 || processing}
                            onClick={saveAll}
                            className={`mt-4 w-2/6 px-4 py-2 rounded text-white flex items-center justify-center gap-2
                ${
                    rows.length === 0 || processing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
                        >
                            {processing ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z"
                                        />
                                    </svg>
                                    Saving Please wait...
                                </>
                            ) : (
                                `(${rows.length}) Save`
                            )}
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
