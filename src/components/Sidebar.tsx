import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Bell as BellIcon, Settings, ChartNoAxesCombined, Bitcoin, WalletCards, GitBranch, FlaskConical, ListFilter, Goal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
    id: string;
    title: string;
    path?: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: { name: string; path: string }[];
}

const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ analyses: true });
    const { t } = useTranslation();
	const { isAuthenticated } = useAuth();

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
                { name: t("sidebar.technical.drs", "Directional Range Strip"), path: '/analyses/directional-range-strip' },
                { name: t("sidebar.technical.charts", "Charts"), path: '/analyses/charts' },
                { name: t("sidebar.technical.marketBreadth", "Market Breadth"), path: '/market-breadth' },
            ],
        },
        { id: "coins", title: t("sidebar.coins"), path: "/coins", icon: Bitcoin },
		...(isAuthenticated ? [{ id: "portfolio", title: t("sidebar.portfolio"), path: "/portfolio", icon: WalletCards }] : []),
		...(isAuthenticated ? [{ id: "purchase-goals", title: t("sidebar.purchaseGoals", "Purchase Goals"), path: "/purchase-goals", icon: Goal }] : []),
		...(isAuthenticated ? [{ id: "trade-journey", title: t("tradeJourney.title"), path: "/portfolio/journey", icon: GitBranch }] : []),
		...(isAuthenticated ? [{ id: "strategy-lab", title: t("strategyLab.title"), path: "/strategy-lab", icon: FlaskConical }] : []),
		...(isAuthenticated ? [{ id: "trade-explorer", title: t("tradeExplorer.title"), path: "/trade-explorer", icon: ListFilter }] : []),
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

    const activeMenuId = menus.find(menu => menu.children?.some(child => child.path === location.pathname))?.id;

    React.useEffect(() => {
        if (activeMenuId) {
            setOpenMenus(prev => prev[activeMenuId] ? prev : { ...prev, [activeMenuId]: true });
        }
    }, [activeMenuId]);

    return (
        <aside className="flex h-full w-[280px] flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950 text-slate-200 shadow-2xl shadow-slate-950/20">
            <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
                <img src="/coinscope-icon.svg?v=20261004" alt="" className="h-10 w-10 rounded-xl shadow-lg shadow-indigo-500/20" />
                <div><p className="font-bold tracking-tight text-white">CoinScope</p><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300">Market intelligence</p></div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                {menus.map((menu) => {
                    const hasChildren = !!menu.children?.length;
                    const isActive = menu.path
                        ? location.pathname === menu.path
                        : hasChildren && menu.children?.some((c) => c.path === location.pathname);

                    if (hasChildren) {
                        return (
                            <div key={menu.id}>
                                <div
                                    className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition ${isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        }`}
                                    onClick={() => toggleMenu(menu.id)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <menu.icon className="h-5 w-5" />
                                        <span className="text-sm font-semibold">{menu.title}</span>
                                    </div>
                                    {openMenus[menu.id] ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronDown size={16} className="-rotate-90" />
                                    )}
                                </div>

                                {openMenus[menu.id] && (
                                    <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
                                        {menu.children!.map((child) => (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                onClick={onNavigate}
                                                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${location.pathname === child.path
                                                    ? "bg-indigo-500/20 font-semibold text-indigo-200"
                                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
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
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive
                                ? "bg-gradient-to-r from-indigo-500 to-indigo-600 font-semibold text-white shadow-lg shadow-indigo-950/30"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <menu.icon className="h-5 w-5" />
                            <span className="text-sm">{menu.title}</span>
                        </Link>
                    );
                })}

            </nav>
            <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-semibold text-indigo-200">{t("sidebar.marketData")}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t("sidebar.marketDataDescription")}</p></div>
        </aside>
    );
};

export default Sidebar;
