"use client";

import { MobileSidebar } from "./MobileSidebar";
import { GraduationCap } from "lucide-react";

export const MobileNavbar = ({ user }: { user: any }) => {
    return (
        <div className="md:hidden flex h-16 items-center px-4 border-b bg-white fixed top-0 w-full z-40 shadow-sm">
            <MobileSidebar user={user} />
            <div className="flex w-full justify-center items-center gap-x-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg text-gray-900">Learning Walk</span>
            </div>
            <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>
    );
};
