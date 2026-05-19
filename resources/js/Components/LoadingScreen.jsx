export default function LoadingScreen({ text = "Loading..." }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-[Poppins] overflow-hidden">

            {/* Floating background glow */}
            <div className="absolute w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl animate-pulse top-[-200px] left-[-200px]" />
            <div className="absolute w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse bottom-[-200px] right-[-200px]" />

            {/* Floating dots */}
            <div className="absolute inset-0 opacity-30">
                <div className="w-2 h-2 bg-white rounded-full absolute top-20 left-20 animate-bounce" />
                <div className="w-1 h-1 bg-white rounded-full absolute top-40 right-40 animate-ping" />
                <div className="w-2 h-2 bg-white rounded-full absolute bottom-32 left-1/3 animate-bounce delay-200" />
                <div className="w-1 h-1 bg-white rounded-full absolute bottom-20 right-1/4 animate-ping delay-300" />
            </div>

            {/* Main loader */}
            <div className="flex flex-col items-center space-y-6 z-10">

                {/* Animated core loader */}
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 rounded-full border-2 border-blue-400/30 animate-ping"></div>
                    <div className="w-14 h-14 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                </div>

                {/* Typing / pulse text */}
                <div className="text-center">
                    <p className="text-white text-lg font-semibold animate-pulse tracking-wide">
                        {text}
                    </p>

                    <p className="text-slate-400 text-sm mt-1 animate-pulse">
                        Please wait while system is processing...
                    </p>
                </div>

                {/* Animated loading bar */}
                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-blue-500 animate-[loading_1.5s_ease-in-out_infinite]" />
                </div>
            </div>

            {/* Custom keyframe */}
            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
}