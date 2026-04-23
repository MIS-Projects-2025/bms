import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import {ClipboardList, LayoutDashboard , Users , ScrollText   } from "lucide-react";
import Dropdown from "./DropDown";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;

    const role = emp_data?.emp_system_role?.toLowerCase().trim();

    return (
        <nav className="flex flex-col gap-0.5">
            <SidebarLink
                href={route("dashboard")}
                icon={<LayoutDashboard  className="w-[18px] h-[18px]" />}
                label="Dashboard"
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                // href={route("jorf.table")}
                icon={<ScrollText   className="w-5 h-5" />}
                label="List for Payment"
                isSidebarOpen={isSidebarOpen}
            />
           {["superadmin", "admin"].includes(role) && (
                <div>
                    <SidebarLink
                        href={route("admin")}
                        label="Administrators"
                        icon={<Users className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />
                </div>
            )}

        </nav>


    );
}
