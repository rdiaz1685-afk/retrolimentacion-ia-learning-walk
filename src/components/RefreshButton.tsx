
"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);

        // Forzar actualización de cache en el servidor
        router.refresh();

        // Pequeño truco para forzar actualización de RSC
        const currentPath = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('t', Date.now().toString());
        router.push(`${currentPath}?${searchParams.toString()}`);

        setTimeout(() => {
            setIsRefreshing(false);
        }, 800);
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
        >
            <RotateCw className={`h-4 w-4 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar Información'}
        </button>
    );
}
