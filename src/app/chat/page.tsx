
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

export default function ChatPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await axios.post("/api/chat", {
                messages: [...messages, userMessage],
            });
            setMessages((prev) => [...prev, response.data]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Lo siento, hubo un error al procesar tu solicitud." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-8">
            <div className="flex items-center gap-x-3 mb-8">
                <div className="p-2 bg-pink-100 rounded-lg">
                    <Sparkles className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Asistente Master Academic</h1>
                    <p className="text-sm text-slate-500">Consulta tendencias, propuestas de mejora y análisis de tu campus.</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col glass-card rounded-2xl shadow-xl">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <Bot className="h-12 w-12 text-slate-400" />
                            <p className="max-w-[300px]">Hola, soy tu Master Academic. ¿Qué te gustaría saber hoy sobre las observaciones?</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={cn("flex items-start gap-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn("p-2 rounded-lg shrink-0", m.role === "user" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200")}>
                                {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5 text-indigo-600" />}
                            </div>
                            <div className={cn("max-w-[80%] rounded-2xl p-4 shadow-sm", m.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-100 rounded-tl-none")}>
                                <p className={cn("text-sm leading-relaxed whitespace-pre-wrap font-medium", m.role === "user" ? "text-white" : "text-slate-900")}>{m.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-x-4 opacity-70">
                            <div className="p-2 rounded-lg bg-white border border-slate-200">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                <p className="text-sm text-slate-900 font-medium italic">Analizando datos y preparando respuesta...</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-md">
                    <form onSubmit={onSubmit} className="flex gap-x-4">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pregunta sobre tendencias o ideas de mejora..."
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
