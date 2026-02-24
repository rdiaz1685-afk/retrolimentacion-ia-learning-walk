
"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // router.refresh() le dice a Next.js que vuelva a ejecutar el Server Component
        // sin perder el estado del cliente.
        router.refresh();

        // Simular un pequeño delay visual para el usuario
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
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
