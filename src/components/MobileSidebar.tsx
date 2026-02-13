"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export const MobileSidebar = ({ user }: { user: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Cerrar el menú cuando cambie la ruta
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevenir el scroll cuando el menú está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <div className="flex items-center">
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                aria-label="Abrir menú"
            >
                <Menu className="h-6 w-6" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop / Oscurecimiento del fondo */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 z-[95] backdrop-blur-sm"
                        />

                        {/* Drawer / Menú lateral deslizable */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-[100] shadow-2xl overflow-hidden"
                        >
                            <div className="relative h-full bg-[#111827]">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 z-[110] p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    aria-label="Cerrar menú"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                                <Sidebar user={user} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
