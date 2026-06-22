import { useEffect } from "react";

import { X } from "lucide-react";

export default function Modal({
    show,
    title,
    onClose,
    children,
    size = "lg",
}) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        if (show) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "auto";
        };
    }, [show]);

    if (!show) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-6xl",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            {/* MODAL BOX */}
            <div
                className={`w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn`}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-700 to-blue-800">
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-white transition hover:scale-110"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* BODY */}
                <div className="p-5 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
