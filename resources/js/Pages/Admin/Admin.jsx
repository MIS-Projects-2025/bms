import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";
import { useState } from "react";

import { Button } from "@/Components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

import {
    UserRoundPlus,
    UsersRound,
    UserCircle2,
    ShieldCheck,
    Pencil,
    Trash2,
} from "lucide-react";

export default function Admin({ tableData, tableFilters, emp_data }) {
    const [role, setRole] = useState(null);

    const Adminrole = emp_data?.emp_system_role?.toLowerCase().trim();

    console.log(role);

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
            },
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
            },
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
                <h1 className="flex items-center gap-2 text-2xl font-bold">
                    <UsersRound className="h-6 w-6" />
                    Administrators
                </h1>

                <Button
                    onClick={() =>
                        router.get(
                            route("index_addAdmin"),
                            {},
                            { preserveScroll: true },
                        )
                    }
                >
                    <UserRoundPlus className="h-4 w-4 mr-2" />
                    New Admin
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
                        icon={<UsersRound className="h-5 w-5 text-primary" />}
                        title="Employee Details"
                        show={true}
                        onClose={() => tableModalClose(close)}
                        className="max-w-md w-full rounded-2xl shadow-xl bg-white dark:text-gray-200 dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="space-y-4">
                            {/* User Info */}
                            <div className="text-center">
                                <div className="flex justify-center mb-3">
                                    <UserCircle2 className="h-16 w-16 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-800">
                                    {row.emp_name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-800">
                                    ID:{" "}
                                    <span className="font-semibold">
                                        {row.emp_id}
                                    </span>
                                </p>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-800">
                                    Current Role:{" "}
                                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                        <ShieldCheck className="h-4 w-4" />
                                        {row.emp_role}
                                    </span>
                                </p>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-800">
                                    Job Title:{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {row.emp_jobtitle}
                                    </span>
                                </p>
                            </div>

                            {["superadmin", "admin"].includes(Adminrole) && (
                                <div className="mt-6 space-y-4">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Update Role
                                    </label>

                                    <Select
                                        defaultValue={row.emp_role}
                                        onValueChange={(value) =>
                                            setRole(value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="admin">
                                                Admin
                                            </SelectItem>

                                            {Adminrole === "superadmin" && (
                                                <SelectItem value="superadmin">
                                                    Superadmin
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <div className="flex justify-end gap-3 pt-3">
                                        <Button
                                            onClick={() =>
                                                changeRole(row.emp_id)
                                            }
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Update Role
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                removeAdmin(row.emp_id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
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
