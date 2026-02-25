
"use client";

import { useState, useMemo } from "react";
import {
    Save, User, MapPin, Sparkles, AlertCircle,
    CheckCircle2, HelpCircle, MessageSquare, Brain
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface EvaluationFormProps {
    teachers: any[];
    classrooms: any[];
    campus: string;
    coordinator: { id: string, name: string, role: string, email?: string };
}

const QuestionRow = ({ id, label, valField, obsField, formData, handleChange }: any) => (
    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-3 transition-all hover:border-indigo-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                {["SÍ", "NO", "N/A"].map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => handleChange(valField, opt)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${formData[valField as keyof typeof formData] === opt
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
        {formData[valField as keyof typeof formData] !== "N/A" && (
            <textarea
                placeholder="Describe lo observado..."
                value={formData[obsField as keyof typeof formData] as string}
                onChange={(e) => handleChange(obsField, e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-black font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-24 shadow-inner"
            />
        )}
    </div>
);

export function EvaluationForm({ teachers, classrooms, campus, coordinator }: EvaluationFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const isExtracurricular = campus === "Extracurricular";

    // Estado del Formulario
    const [formData, setFormData] = useState({
        maestroId: "",
        aula: "",
        p1_val: "N/A", p1_obs: "",
        p2_val: "N/A", p2_obs: "",
        p3_val: "N/A", p3_obs: "",
        p4_val: "N/A", p4_obs: "",
        p5_val: "N/A", p5_obs: "",
        p6_val: "N/A", p6_obs: "",
        colab_val: "N/A", colab_obs: "",
        tax_nivel: isExtracurricular ? "" : "1 - Recordar",
        tax_preguntas: "",
        wows: "",
        wonders: ""
    });

    // Ordenar y filtrar maestros por rol
    const filteredAndSortedTeachers = useMemo(() => {
        let list = [...teachers];

        // Si el rol es COORDINADORA, filtrar solo por sus maestros asignados
        if (coordinator.role === "COORDINADORA") {
            list = list.filter(t => {
                const coordId = String(coordinator.id).toLowerCase();
                const coordEmail = coordinator.email?.toLowerCase();
                const coordName = coordinator.name?.toLowerCase();

                return (
                    String(t.id_usuario_coordinador).toLowerCase() === coordId ||
                    String(t.id_coordinadora).toLowerCase() === coordId ||
                    String(t.id_coordinador).toLowerCase() === coordId ||
                    (coordEmail && String(t.id_usuario_coordinador).toLowerCase() === coordEmail) ||
                    (coordEmail && String(t.correo_coordinador).toLowerCase() === coordEmail) ||
                    (coordName && t.coordinador?.toLowerCase().includes(coordName))
                );
            });
        }

        return list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
    }, [teachers, coordinator]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- VALIDACIONES DE CAMPOS OBLIGATORIOS ---
        if (!formData.maestroId) return alert("⚠️ Por favor selecciona una maestra.");
        if (!formData.aula) return alert("⚠️ Por favor selecciona el aula.");
        if (!isExtracurricular && !formData.tax_preguntas.trim()) return alert("⚠️ Por favor indica cuántas preguntas se hicieron en la taxonomía.");

        // Validar que si marcaron SÍ o NO, tengan que escribir un comentario
        const indicatorChecks = isExtracurricular ? [
            { val: formData.p1_val, obs: formData.p1_obs, label: "# of students engaged" },
            { val: formData.p2_val, obs: formData.p2_obs, label: "Propósito de la clase" },
            { val: formData.p3_val, obs: formData.p3_obs, label: "Material Manipulativo" },
            { val: formData.p4_val, obs: formData.p4_obs, label: "Participación Aleatoria" },
        ] : [
            { val: formData.p1_val, obs: formData.p1_obs, label: "Communicates Purpose" },
            { val: formData.p2_val, obs: formData.p2_obs, label: "Didactic Material" },
            { val: formData.p3_val, obs: formData.p3_obs, label: "Manipulative Material" },
            { val: formData.p4_val, obs: formData.p4_obs, label: "Engagement" },
            { val: formData.p5_val, obs: formData.p5_obs, label: "Roles" },
            { val: formData.p6_val, obs: formData.p6_obs, label: "Learning Evaluation" },
            { val: formData.colab_val, obs: formData.colab_obs, label: "Trabajo Colaborativo" }
        ];

        for (const check of indicatorChecks) {
            if (check.val !== "N/A" && !check.obs.trim()) {
                return alert(`⚠️ Por favor agrega un comentario pedagógico para el indicador: ${check.label}`);
            }
        }

        setIsSaving(true);
        setStatus('idle');

        try {
            const today = new Date();
            // Ajuste de semana escolar (Feb 23 = Semana 24 según el usuario)
            const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
            const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
            const calendarWeek = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            const schoolWeek = calendarWeek + 15; // Offset de 15 semanas para el ciclo escolar

            // Transformar valores para el Excel del usuario
            const mapValue = (v: string) => v === "SÍ" ? "YES" : (v === "N/A" ? "No Aplica" : "NO");

            await axios.post("/api/evaluations/save", {
                campus,
                data: {
                    id_coordinador: coordinator.id,
                    id_maestro: formData.maestroId,
                    fecha: today.toLocaleDateString('es-MX'),
                    semana: schoolWeek,
                    ...formData,
                    p1_val: mapValue(formData.p1_val),
                    p2_val: mapValue(formData.p2_val),
                    p3_val: mapValue(formData.p3_val),
                    p4_val: mapValue(formData.p4_val),
                    p5_val: mapValue(formData.p5_val),
                    p6_val: mapValue(formData.p6_val),
                    colab_val: mapValue(formData.colab_val),
                }
            });
            setStatus('success');
            setTimeout(() => router.push("/evaluations"), 2000);
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsSaving(false);
        }
    };


    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Evaluación Guardada!</h2>
                <p className="text-slate-500">Se ha registrado correctamente en Google Sheets.</p>
                <p className="text-xs text-slate-400 mt-4 italic italic">Redirigiendo al listado...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Encabezado de Selección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Maestro(a) a Observar</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                        <select
                            value={formData.maestroId}
                            onChange={(e) => handleChange("maestroId", e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-white border-transparent rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="">Selecciona una maestra...</option>
                            {filteredAndSortedTeachers.map((t: any) => (
                                <option key={t.id_maestro} value={t.id_maestro}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Aula / Espacio</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                        <select
                            value={formData.aula}
                            onChange={(e) => handleChange("aula", e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border-transparent rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="">Selecciona aula...</option>
                            {classrooms.map(c => (
                                <option key={c.id_aula} value={c.nombre_aula}>{c.nombre_aula}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Sección de Indicadores */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">
                        {isExtracurricular ? "Observación Extracurricular" : "Indicadores de Desempeño"}
                    </h3>
                </div>
                {isExtracurricular ? (
                    <>
                        <QuestionRow id="p1" label="# of students engaged" valField="p1_val" obsField="p1_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p2" label="El alumno entiende el propósito de la clase" valField="p2_val" obsField="p2_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p3" label="El maestro utiliza material manipulativo" valField="p3_val" obsField="p3_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p4" label="El maestro selecciona de manera aleatoria la participacion del alumno" valField="p4_val" obsField="p4_obs" formData={formData} handleChange={handleChange} />
                    </>
                ) : (
                    <>
                        <QuestionRow id="p1" label="Communicates Purpose" valField="p1_val" obsField="p1_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p2" label="Didactic Material" valField="p2_val" obsField="p2_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p3" label="Manipulative Material" valField="p3_val" obsField="p3_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p4" label="Engagement" valField="p4_val" obsField="p4_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p5" label="Roles" valField="p5_val" obsField="p5_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="p6" label="Learning Evaluation" valField="p6_val" obsField="p6_obs" formData={formData} handleChange={handleChange} />
                        <QuestionRow id="colab" label="Trabajo Colaborativo" valField="colab_val" obsField="colab_obs" formData={formData} handleChange={handleChange} />
                    </>
                )}
            </div>

            {/* Taxonomía - No se muestra en Extracurriculares */}
            {!isExtracurricular && (
                <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
                    <Brain className="absolute -right-4 -top-4 h-32 w-32 text-white/5" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-400" />
                            <h3 className="font-bold">Nivel de Pensamiento (Taxonomía)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Total de preguntas realizadas</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 5 preguntas abiertas..."
                                    value={formData.tax_preguntas}
                                    onChange={(e) => handleChange("tax_preguntas", e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Nivel más alto alcanzado</label>
                                <select
                                    value={formData.tax_nivel}
                                    onChange={(e) => handleChange("tax_nivel", e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option className="text-slate-900" value="1 - Recordar">1 - Recordar</option>
                                    <option className="text-slate-900" value="2 - Entender">2 - Entender</option>
                                    <option className="text-slate-900" value="3 - Aplicar">3 - Aplicar</option>
                                    <option className="text-slate-900" value="4 - Analizar">4 - Analizar</option>
                                    <option className="text-slate-900" value="5 - Evaluar/Crear">5 - Evaluar/Crear</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Wows & Wonders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-yellow-600 uppercase tracking-wide">
                        <Sparkles className="h-4 w-4" /> Wows (Fortalezas)
                    </label>
                    <textarea
                        required
                        value={formData.wows}
                        onChange={(e) => handleChange("wows", e.target.value)}
                        placeholder="Aspectos positivos y destacados de la observación..."
                        className="w-full h-32 p-4 bg-white border border-slate-300 rounded-2xl shadow-inner focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none text-sm text-black font-medium leading-relaxed"
                    />
                </div>
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-purple-600 uppercase tracking-wide">
                        <HelpCircle className="h-4 w-4" /> Wonders (Oportunidades)
                    </label>
                    <textarea
                        required
                        value={formData.wonders}
                        onChange={(e) => handleChange("wonders", e.target.value)}
                        placeholder="Preguntas reflexivas o áreas de mejora identificadas..."
                        className="w-full h-32 p-4 bg-white border border-slate-300 rounded-2xl shadow-inner focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm text-black font-medium leading-relaxed"
                    />
                </div>
            </div>

            {status === 'error' && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 animate-bounce">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-bold">Error al conectar con Google. Revisa tu sesión o inténtalo de nuevo.</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {isSaving ? (
                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Save className="h-6 w-6" /> Guardar Observación
                    </>
                )}
            </button>
        </form>
    );
}
