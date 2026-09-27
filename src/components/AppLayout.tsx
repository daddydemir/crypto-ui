import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f5f7fb] text-slate-800 dark:bg-[#080d19] dark:text-slate-100">
            {sidebarOpen && <button aria-label="Menüyü kapat" className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
            <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="app-canvas flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
