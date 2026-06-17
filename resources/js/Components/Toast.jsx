import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

/**
 * Simple toast notification — no external dependency.
 *
 * Usage:
 *   <Toast message="Saved!" type="success" onClose={() => setToast(null)} />
 */
export default function Toast({ message, type = "success", duration = 3500, onClose }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onClose?.(), 200); // allow fade-out before unmount
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!message) return null;

    const isSuccess = type === "success";

    return (
        <div
            className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] max-w-sm transition-all duration-200 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            } ${
                isSuccess
                    ? "bg-green-50 border-green-300 text-green-800 dark:bg-green-900/80 dark:border-green-700 dark:text-green-200"
                    : "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/80 dark:border-red-700 dark:text-red-200"
            }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
            )}

            <span className="text-sm font-medium flex-1">{message}</span>

            <button
                onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 200); }}
                className="opacity-60 hover:opacity-100"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
