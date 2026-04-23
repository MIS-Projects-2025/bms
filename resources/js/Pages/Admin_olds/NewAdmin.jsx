import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";

import { useState } from "react";

export default function NewAdmin({ tableData, tableFilters, emp_data }) {
    const [role, setRole] = useState(null);

    function addAdmin(id, name, job_title) {
        if (!role) return;

        router.post(
            route("addAdmin"),
            { id, name, job_title, role }, // ✅ Isinama na ang job_title
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route("admin"));
                },
            }
        );
    }

    const tableModalClose = (close) => {
        setRole(null);
        close();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Administrators" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-500 hover:text-gray-600">
                    <i className="fa-solid fa-users-between-lines"></i> Employee List
                </h1>
            </div>

            <DataTable
                columns={[
                    { key: "EMPLOYID", label: "ID" },
                    { key: "EMPNAME", label: "Employee Name" },
                    { key: "JOB_TITLE", label: "Job Title" },
                    { key: "DEPARTMENT", label: "Department" },
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
                routeName={route("index_addAdmin")}
                filters={tableFilters}
                rowKey="EMPLOYID"
                showExport={false}
            >
                {(row, close) => (
                    <Modal
                        id="MasterlistRowModal"
                        title="Employee Details"
                        show={true}
                        onClose={() => tableModalClose(close)}
                        className="max-w-md w-full rounded-2xl shadow-xl bg-white dark:text-gray-200 dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="space-y-4">
                            {/* Employee Info */}
                            <div className="text-center">
                                <div className="text-4xl text-teal-500 mb-2">
                                    <i className="fa-solid fa-id-card"></i>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-600">
                                    {row.EMPNAME}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                    Employee ID: <span className="font-semibold">{row.EMPLOYID}</span>
                                </p>
                                <div className="mt-3 text-sm text-gray-600 dark:text-gray-500 space-y-1">
                                    <p>
                                        <span className="font-semibold text-gray-700 dark:text-gray-600">
                                            Job Title:
                                        </span>{" "}
                                        {row.JOB_TITLE}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-gray-700 dark:text-gray-600">
                                            Department:
                                        </span>{" "}
                                        {row.DEPARTMENT}
                                    </p>
                                </div>
                            </div>

                            {/* Role Selector */}
                            <div className="mt-6 space-y-3">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-600">
                                    Assign System Role
                                </label>
                                <select
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-6000 text-sm p-2"
                                >
                                    <option value="">-- Select Role --</option>
                                    {emp_data?.emp_role === "superadmin" && (
                                        <option value="superadmin">Superadmin</option>
                                    )}
                                    {["superadmin", "admin"].includes(emp_data?.emp_role) && (
                                                <option value="admin">Admin</option>
                                            )}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            {role && (
                                <div className="flex justify-end pt-4 border-t border-gray-400 dark:border-gray-700">
                                    <button
                                        onClick={() => addAdmin(row.EMPLOYID, row.EMPNAME, row.JOB_TITLE)} // ✅ Ipinapasa na ang JOB_TITLE
                                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium transition-all duration-200"
                                    >
                                        <i className="fa-solid fa-user-plus me-1"></i> Add as {role}
                                    </button>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}
            </DataTable>
        </AuthenticatedLayout>
    );
}