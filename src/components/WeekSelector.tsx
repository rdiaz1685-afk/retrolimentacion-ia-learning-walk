
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

interface FortnightSelectorProps {
    fortnights: number[];
    currentFortnight: number;
}

export function FortnightSelector({ fortnights, currentFortnight }: FortnightSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleFortnightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set("quincena", val);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-x-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-x-2 text-slate-500">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Mostrando:</span>
            </div>
            <select
                value={currentFortnight}
                onChange={handleFortnightChange}
                className="bg-transparent text-sm font-bold text-indigo-600 focus:outline-none cursor-pointer"
            >
                {fortnights.map((f) => (
                    <option key={f} value={f}>
                        Quincena {f} (Semanas {f * 2 - 1}-{f * 2})
                    </option>
                ))}
            </select>
        </div>
    );
}
