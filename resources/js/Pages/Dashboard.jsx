import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import axios from "axios";

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

const generateColors = (count = 1000) => {
    return Array.from({ length: count }, (_, i) => {
        const hue = (i * 137.5) % 360;
        return `hsl(${hue}, 70%, 55%)`;
    });
};

const COLORS = generateColors(1000);
export default function Dashboard() {

    const formatDateLabel = (label) => {
    if (!label) return "";

    const date = new Date(label);

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    });
};



    const [filters, setFilters] = useState({
        trend: "monthly",
        package: "daily",
        oven: "monthly",
        input: "monthly",
    });

    const [graphTypes, setGraphTypes] = useState({
        trend: "bar",
        package: "donut",
        oven: "bar",
        input: "line",
    });

    const [data, setData] = useState({
        trend: [],
        package: [],
        oven: [],
        input: [],
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const response = await axios.get("/dashboard/data", {
                params: filters,
            });

            setData(response.data);
        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

const renderChart = (chartType, chartData, dataKey, nameKey = "label") => {
    if (!chartData || chartData.length === 0) {
        return (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
                No Data Available
            </div>
        );
    }

    // format labels
    const formattedData = chartData.map((item) => ({
        ...item,
        [nameKey]: isNaN(Date.parse(item[nameKey]))
            ? item[nameKey]
            : formatDateLabel(item[nameKey]),
    }));

    /** LINE */
    if (chartType === "line") {
        return (
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="5 5" />
                    <XAxis dataKey={nameKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke="#0088fe"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    }

    /** DONUT */
    if (chartType === "donut") {
        return (
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                        data={formattedData}
                        dataKey={dataKey}
                        nameKey={nameKey}
                        outerRadius={120}
                        innerRadius={70}
                    >
                        {formattedData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        );
    }

    /** STACKED BAR */
    if (chartType === "stacked-bar") {
        const keys = Object.keys(formattedData[0]).filter(
            (k) => k !== nameKey
        );

        return (
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={nameKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    {keys.map((key, i) => (
                        <Bar
                            key={key}
                            dataKey={key}
                            stackId="a"
                            fill={COLORS[i % COLORS.length]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    }

    /** DEFAULT BAR */
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={nameKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={dataKey} fill="#0088fe" />
            </BarChart>
        </ResponsiveContainer>
    );
};

    const cardClass =
        "bg-white shadow-md rounded-2xl p-5 border border-gray-100";

    const selectClass =
        "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="p-6 space-y-8">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Bake Dashboard
                    </h1>

                    {loading && (
                        <div className="text-sm text-indigo-500 font-medium">
                            Loading...
                        </div>
                    )}
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GRAPH 1 */}
                <div className={cardClass}>
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Bake Out Trend
                            </h2>
                        </div>

                        <div className="flex gap-3">
                            {/* <select
                                className={selectClass}
                                value={filters.trend}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        trend: e.target.value,
                                    })
                                }
                            >
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select> */}

                            <select
                                className={`selectClass w-full rounded-lg border border-gray-300`}
                                value={graphTypes.trend}
                                onChange={(e) =>
                                    setGraphTypes({
                                        ...graphTypes,
                                        trend: e.target.value,
                                    })
                                }
                            >
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                                <option value="donut">Donut</option>
                            </select>
                        </div>
                    </div>

                    {renderChart(
                        graphTypes.trend,
                        data.trend,
                        "total_qty"
                    )}
                </div>

                {/* GRAPH 2 */}
                <div className={cardClass}>
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Bake Out Per Package
                            </h2>
                        </div>

                        <div className="flex gap-3">
                            {/* <select
                                className={selectClass}
                                value={filters.package}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        package: e.target.value,
                                    })
                                }
                            >
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select> */}

                            <select
                                className={`selectClass w-full rounded-lg border border-gray-300`}
                                value={graphTypes.package}
                                onChange={(e) =>
                                    setGraphTypes({
                                        ...graphTypes,
                                        package: e.target.value,
                                    })
                                }
                            >
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                                <option value="donut">Donut</option>
                            </select>
                        </div>
                    </div>

                    {renderChart(
                        graphTypes.package,
                        data.package,
                        "total_qty",
                        "package"
                    )}
                </div>

                {/* GRAPH 3 */}
                <div className={cardClass}>
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Oven Usage
                            </h2>
                        </div>

                        <div className="flex gap-3">
                            {/* <select
                                className={selectClass}
                                value={filters.oven}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        oven: e.target.value,
                                    })
                                }
                            >
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select> */}

                            <select
                                className={`selectClass w-full rounded-lg border border-gray-300`}
                                value={graphTypes.oven}
                                onChange={(e) =>
                                    setGraphTypes({
                                        ...graphTypes,
                                        oven: e.target.value,
                                    })
                                }
                            >
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                                <option value="donut">Donut</option>
                            </select>
                        </div>
                    </div>

                    {renderChart(
                        graphTypes.oven,
                        data.oven,
                        "total_count",
                        "oven_num"
                    )}
                </div>

                {/* GRAPH 4 */}
                <div className={cardClass}>
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Bake Out Per Input Type
                            </h2>
                        </div>

                        <div className="flex gap-3">
                            {/* <select
                                className={selectClass}
                                value={filters.input}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        input: e.target.value,
                                    })
                                }
                            >
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select> */}

                            <select
                                className={`{selectClass} w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm leading-6 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 focus:outline-none`} 
                                value={graphTypes.input}
                                onChange={(e) =>
                                    setGraphTypes({
                                        ...graphTypes,
                                        input: e.target.value,
                                    })
                                }
                            >
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                                <option value="donut">Donut</option>
                                <option value="stacked-bar">Stacked Bar</option>
                            </select>
                        </div>
                    </div>

                    {renderChart(
                        graphTypes.input,
                        data.input,
                        "total_qty",
                        "input_type"
                    )}
                </div>
            </div>
            </div>
        </AuthenticatedLayout>
    );
}