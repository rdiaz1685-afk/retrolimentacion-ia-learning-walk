
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

interface WeekSelectorProps {
    weeks: string[];
    currentWeek: string;
}

export function WeekSelector({ weeks, currentWeek }: WeekSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const week = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set("semana", week);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-x-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-x-2 text-slate-500">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Semana:</span>
            </div>
            <select
                value={currentWeek}
                onChange={handleWeekChange}
                className="bg-transparent text-sm font-bold text-indigo-600 focus:outline-none cursor-pointer"
            >
                {weeks.map((week) => (
                    <option key={week} value={week}>
                        Semana {week}
                    </option>
                ))}
            </select>
        </div>
    );
}
