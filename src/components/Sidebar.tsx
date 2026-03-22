import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Bell as BellIcon, Settings, ChartNoAxesCombined, Bitcoin, } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MenuItem {
    id: string;
    title: string;
    path?: string;
    icon: React.ComponentType<any>;
    children?: { name: string; path: string }[];
}

const Sidebar: React.FC = () => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ analyses: true });
    const { t } = useTranslation();

    const toggleMenu = (id: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const menus: MenuItem[] = [
        {
            id: "analyses",
            title: t("sidebar.analyses"),
            icon: ChartNoAxesCombined,
            children: [
                { name: t("sidebar.technical.rsi"), path: "/analyses/rsi" },
                { name: t("sidebar.technical.ma"), path: "/analyses/ma" },
                { name: t("sidebar.technical.ema"), path: "/analyses/ema" },
                { name: t("sidebar.technical.bb"), path: '/analyses/bollinger-bands' },
                { name: t("sidebar.technical.dc"), path: '/analyses/donchian-channels' },
                { name: t("sidebar.technical.atr"), path: '/analyses/atr' },
                { name: t("sidebar.technical.macd"), path: '/analyses/macd' },
                { name: t("sidebar.technical.adi"), path: '/analyses/adi' },
            ],
        },
        { id: "coins", title: t("sidebar.coins"), path: "/coins", icon: Bitcoin },
        {
            id: "alarms",
            title: t("sidebar.alarms.normal"),
            icon: BellIcon,
            children: [
                { name: t("sidebar.alarms.normal"), path: "/alarms" },
                { name: t("sidebar.alarms.smart"), path: "/smart-alerts" },
            ]
        },
        { id: "settings", title: t("sidebar.settings"), path: "/settings", icon: Settings },
    ];

    // Auto-expand menu when path changes
    React.useEffect(() => {
        menus.forEach(menu => {
            if (menu.children?.some(child => child.path === location.pathname)) {
                if (!openMenus[menu.id]) {
                    setOpenMenus(prev => ({ ...prev, [menu.id]: true }));
                }
            }
        });
    }, [location.pathname, menus]);

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col text-gray-800 dark:text-gray-100">
            <div className="p-4 text-xl font-semibold border-b border-gray-200 dark:border-gray-700">
                Crypto Dashboard
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menus.map((menu) => {
                    const hasChildren = !!menu.children?.length;
                    const isActive = menu.path
                        ? location.pathname === menu.path
                        : hasChildren && menu.children?.some((c) => c.path === location.pathname);

                    if (hasChildren) {
                        return (
                            <div key={menu.id}>
                                <div
                                    className={`flex items-center justify-between p-2 cursor-pointer rounded-md ${isActive ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }`}
                                    onClick={() => toggleMenu(menu.id)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <menu.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        <span className="font-medium">{menu.title}</span>
                                    </div>
                                    {openMenus[menu.id] ? (
                                        <ChevronDown size={16} className="text-gray-600 dark:text-gray-300" />
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
                                    )}
                                </div>

                                {openMenus[menu.id] && (
                                    <div className="ml-7 mt-1 space-y-1">
                                        {menu.children!.map((child) => (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className={`block p-2 text-sm rounded-md transition-colors ${location.pathname === child.path
                                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                                    }`}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={menu.id}
                            to={menu.path!}
                            className={`flex items-center space-x-2 p-2 rounded-md ${isActive
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                }`}
                        >
                            <menu.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            <span>{menu.title}</span>
                        </Link>
                    );
                })}

            </nav>
        </aside>
    );
};

export default Sidebar;
