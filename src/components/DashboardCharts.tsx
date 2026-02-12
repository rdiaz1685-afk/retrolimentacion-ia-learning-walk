
"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981'];

export const DashboardCharts = ({ data, role, progressData }: { data: any[], role?: string, progressData?: any[] }) => {
    const isRector = role === "RECTOR";
    const isCoordinadora = role === "COORDINADORA";

    // Process data for charts
    let pieData = [];
    let chartTitle = "";

    if (isCoordinadora && progressData) {
        pieData = progressData;
        chartTitle = "Avance de Evaluaciones (Tus Maestras)";
    } else {
        const aggregationKey = isRector ? "campus" : "coordinadora";

        const counts = data.reduce((acc: any, curr: any) => {
            const key = curr[aggregationKey] || (isRector ? "Sin Campus" : "Sin Coordinadora");
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        pieData = Object.keys(counts).map(name => ({
            name,
            value: counts[name]
        }));
        chartTitle = isRector ? "Evaluaciones por Campus" : "Evaluaciones por Coordinadora";
    }

    const barData = [
        { name: 'Semana 1', count: 12 },
        { name: 'Semana 2', count: 19 },
        { name: 'Semana 3', count: 15 },
        { name: 'Semana 4', count: data.length },
    ];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        return `${(percent * 100).toFixed(0)}%`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                <h2 className="text-xl font-bold text-slate-900 mb-6 font-sans">
                    {chartTitle}
                </h2>
                <div className="h-72 outline-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={renderCustomizedLabel}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                <h2 className="text-xl font-bold text-slate-900 mb-6 font-sans">Tendencia Mensual</h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
