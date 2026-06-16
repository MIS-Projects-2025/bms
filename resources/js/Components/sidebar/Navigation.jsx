import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import {FileSpreadsheet, LayoutDashboard , Users , SquareStack, BookCopy, ListTree, List, FileClock, Settings } from "lucide-react";
import Dropdown from "./DropDown";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;
    const role = emp_data?.emp_system_role?.toLowerCase().trim();
    const empProduction = emp_data?.emp_dept?.includes("Production");
    const isAdmin = ["superadmin", "admin"].includes(role);

    const isAllowed = empProduction || isAdmin;


    return (
        <nav className="flex flex-col gap-0.5">
            <SidebarLink
                href={route("dashboard")}
                icon={<LayoutDashboard className="w-[18px] h-[18px]" />}
                label="Dashboard"
                isSidebarOpen={isSidebarOpen}
            />
            {isAllowed && (
                <div>
                    <SidebarLink
                        href={route("oven.index")}
                        icon={<SquareStack className="w-5 h-5" />}
                        label="Oven Status"
                        isSidebarOpen={isSidebarOpen}
                    />
                    <SidebarLink
                        href={route("dry-bake.index")}
                        icon={<FileSpreadsheet className="w-5 h-5" />}
                        label="Dry Bake Form"
                        isSidebarOpen={isSidebarOpen}
                    />
                </div>
            )}
            <SidebarLink
                href={route("forms.index")}
                icon={<ListTree className="w-5 h-5" />}
                label="Dry Bake List"
                isSidebarOpen={isSidebarOpen}
            />
            {/* <SidebarLink
                href={route("package.history.index")}
                icon={<FileClock  className="w-5 h-5"/>}
                label="Package History"
                isSidebarOpen={isSidebarOpen}
            /> */}

            <SidebarLink
                href={route("temperature.index")}
                icon={<FileClock  className="w-5 h-5"/>}
                label="Smartdac Temp"
                isSidebarOpen={isSidebarOpen}
            />
            {isAdmin && (
                <div>
                    <Dropdown
                        icon={<Settings className="w-5 h-5" />}
                        label="Maintenance"
                        isSidebarOpen={isSidebarOpen}
                        links={[
                            {
                                href: route("package.history.index"),
                                label: "Package History",
                            },
                            {
                                href: route("partnames.index"),
                                label: "Partname List",
                            },
                            {
                                href: route("ovenlist.index"),
                                label: "Oven Machine",
                            },
                            {
                                href: route("admin"),
                                label: "Administrators",
                            },
                        ]}
                    />

                    {/* <SidebarLink
                        href={route("partnames.index")}
                        label="Partname List"
                        icon={<List className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />

                    <SidebarLink
                        href={route("ovenlist.index")}
                        label="Oven Machine"
                        icon={<BookCopy className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />

                    <SidebarLink
                        href={route("admin")}
                        label="Administrators"
                        icon={<Users className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    /> */}
                </div>
            )}
        </nav>
    );
}
