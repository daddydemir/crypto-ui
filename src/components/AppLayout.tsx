import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            {/* Sol Menü */}
            <Sidebar />

            {/* Sağ Taraf */}
            <div className="flex flex-col flex-1">
                <Topbar />
                <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
