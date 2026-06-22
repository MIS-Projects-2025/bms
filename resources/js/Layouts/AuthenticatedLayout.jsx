import NavBar from "@/Components/NavBar";
import Sidebar from "@/Components/Sidebar/SideBar";
import LoadingScreen from "@/Components/LoadingScreen";
import { usePage } from "@inertiajs/react";
import { Smile } from "lucide-react";

export default function AuthenticatedLayout({ children }) {
    const { emp_data } = usePage().props;

    if (!emp_data) {
        return <LoadingScreen text="Loading user data..." />;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar /> {/* vertical sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                <NavBar /> {/* top navbar */}
                <main className="flex-1 px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto">
                    {children}
                </main>
                {/* ── Footer ── */}
                <footer className="px-6 py-1.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-start">
                    <span className="flex items-center text-[12px] font-semibold text-zinc-500 dark:text-zinc-400">
                        Developed by: Dharwines <Smile className="ml-1 w-4 h-4 text-yellow-500 dark:text-amber-300/70" />
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400"></span>
                    </span>
                </footer>
            </div>
        </div>
    );
}
