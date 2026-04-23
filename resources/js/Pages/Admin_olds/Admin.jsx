import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";
import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";

export default function Admin({ tableData, tableFilters, emp_data }) {
    const [role, setRole] = useState(null);



    function removeAdmin(id) {
        router.post(
            route("removeAdmin"),
            { id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log("Admin removed");
                    window.location.reload(); // Refresh the page after removal
                },
            }
        );
    }

    function changeRole(id) {
        if (!role) return;

        router.patch(
            route("changeAdminRole"),
            { id, role },
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log("Admin role changed");
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
            <Head title="Manage Admin" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-red-800 hover:text-red-600">
                    <i className="fa-solid fa-users"></i> Administrator`s
                </h1>

                    <Button
                        
                        onClick={() =>
                            router.get(route("index_addAdmin"), {}, { preserveScroll: true })
                        }
                    >
                        <i className="fa-solid fa-user-plus"></i> New Admin
                    </Button>
            </div>

            <DataTable
                columns={[
                    { key: "emp_id", label: "ID" },
                    { key: "emp_name", label: "Employee Name" },
                    { key: "emp_jobtitle", label: "Job Title" },
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
                routeName={route("admin")}
                filters={tableFilters}
                rowKey="emp_id"
                showExport={false}
            >
                {(row, close) => (
                    <Modal
                        id="RowModal"
                        icon="<i className='fa-solid fa-users-gear mr-2 text-blue-600'></i>"
                        title="Employee Details"
                        show={true}
                        onClose={() => tableModalClose(close)}
                        className="max-w-md w-full rounded-2xl shadow-xl bg-white dark:text-gray-200 dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="space-y-4">
                            {/* User Info */}
                            <div className="text-center">
                                <div className="text-4xl text-blue-600 mb-2">
                                    <i className="fa-solid fa-user-circle"></i>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    {row.emp_name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: <span className="font-semibold">{row.emp_id}</span>
                                </p>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Current Role:{" "}
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                        {row.emp_role}
                                    </span>
                                </p>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Job Title:{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {row.emp_jobtitle}
                                    </span>
                                </p>
                            </div>

                            {/* Admin Controls */}
                            {["superadmin", "admin"].includes(emp_data?.emp_role) &&
                                !row.emp_role.includes("superadmin") && (
                                    <div className="mt-6 space-y-4">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Update Role
                                        </label>
                                        <select
                                            defaultValue={row.emp_role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                                        >
                                            {emp_data?.emp_role === "superadmin" && (
                                                <option value="superadmin">Superadmin</option>
                                            )}
                                            {["superadmin", "admin"].includes(emp_data?.emp_role) && (
                                                <option value="admin">Admin</option>
                                            )}
                                        </select>

                                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                onClick={() => changeRole(row.emp_id)}
                                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-all duration-200"
                                            >
                                                <i className="fa-solid fa-rotate me-2"></i> Update Role
                                            </button>
                                            <button
                                                onClick={() => removeAdmin(row.emp_id)}
                                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-all duration-200"
                                            >
                                                <i className="fa-solid fa-user-slash me-2"></i> Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </Modal>
                )}
            </DataTable>
        </AuthenticatedLayout>
    );
}