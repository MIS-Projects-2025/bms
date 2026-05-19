import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";
import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";

export default function Partnames({ tableData, tableFilters, emp_data }) {

    return (
        <AuthenticatedLayout>
            <Head title="Partname List" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-blue-800 hover:text-blue-900">
                    <i className="fa-solid fa-list"></i> Partname List
                </h1>
            </div>

            <DataTable
                columns={[
                    { key: "Lot_Id", label: "Lot ID" },
                    { key: "Part_Name", label: "Partname" },
                    { key: "Package_Name", label: "Package Type" },
                    { key: "Qty", label: "Quantity" },
                    { key: "Bake_Time_Temp", label: "Bake Time/Temp" },
                ]}
                data={tableData.data}
                meta={{
                    from: tableData.from,
                    to: tableData.to,
                    total: tableData.total,
                    links: tableData.links,
                    currentPage: tableData.current_page,
                    lastPage: tableData.last_page,
                }}
                routeName={route("partnames.index")}
                filters={tableFilters}
                rowKey="customer_data_id"
                showExport={false}
            />
        </AuthenticatedLayout>
    );
}