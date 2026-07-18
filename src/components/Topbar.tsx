import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Bell, Sun, Moon, Globe, AlertTriangle, RefreshCw, Maximize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getNotifications, type CryptoNotification } from "@/services/notificationService";
import Modal from "@/components/common/Modal";

const Topbar: React.FC = () => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem("darkMode");
        return saved === "true";
    });
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false); // language dropdown

    // Notifications State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<CryptoNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<CryptoNotification | null>(null);
    const [isImageFullscreen, setIsImageFullscreen] = useState(false);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);

    // Cache for notifications to prevent constant API requests
    const lastFetchedTimeRef = useRef<number>(0);
    const cachedNotificationsRef = useRef<CryptoNotification[]>([]);
    const CACHE_DURATION_MS = 60000; // 1 minute

    const changeLang = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
        setOpen(false);
    };

    useEffect(() => {
        const savedLang = localStorage.getItem("language");
        if (savedLang) {
            i18n.changeLanguage(savedLang);
        }
    }, [i18n]);

    useEffect(() => {
        localStorage.setItem("darkMode", darkMode.toString());
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsImageFullscreen(false);
            }
        };
        if (isImageFullscreen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isImageFullscreen]);

    // Live check for new notifications to show the badge
    useEffect(() => {
        const checkNewNotifications = async () => {
            try {
                const data = await getNotifications();
                if (data && data.length > 0) {
                    const sorted = [...data].sort((a, b) => b.CreateTime - a.CreateTime);
                    
                    // Update cache with the background check results to keep it fresh
                    cachedNotificationsRef.current = sorted;
                    lastFetchedTimeRef.current = Date.now();

                    const savedLastSeen = localStorage.getItem("lastSeenNotificationTime");
                    const lastSeen = savedLastSeen ? parseInt(savedLastSeen, 10) : 0;
                    const newestTime = sorted[0].CreateTime;
                    if (newestTime > lastSeen) {
                        setHasNewNotifications(true);
                    }
                }
            } catch (e) {
                console.error("Error in background check for notifications:", e);
            }
        };

        checkNewNotifications();
        const interval = setInterval(checkNewNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotificationsList = async (force: boolean = false) => {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchedTimeRef.current;

        // Use cache if we're not forcing, have no new notification badge, cache is not expired, and contains data
        if (!force && !hasNewNotifications && timeSinceLastFetch < CACHE_DURATION_MS && cachedNotificationsRef.current.length > 0) {
            setNotifications(cachedNotificationsRef.current);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getNotifications();
            const sorted = [...data].sort((a, b) => b.CreateTime - a.CreateTime);
            setNotifications(sorted);
            
            // Cache the results
            cachedNotificationsRef.current = sorted;
            lastFetchedTimeRef.current = Date.now();
            
            if (sorted.length > 0) {
                const newestTime = sorted[0].CreateTime;
                localStorage.setItem("lastSeenNotificationTime", newestTime.toString());
                setHasNewNotifications(false);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleBellClick = () => {
        const newShow = !showNotifications;
        setShowNotifications(newShow);
        if (newShow) {
            fetchNotificationsList();
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeStyles = (type: string) => {
        switch (type.toLowerCase()) {
            case 'bollinger':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/30',
                    text: 'text-blue-700 dark:text-blue-300',
                    label: 'Bollinger'
                };
            case 'rsi':
                return {
                    bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800/30',
                    text: 'text-purple-700 dark:text-purple-300',
                    label: 'RSI'
                };
            case 'macd':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/30',
                    text: 'text-emerald-700 dark:text-emerald-300',
                    label: 'MACD'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700',
                    text: 'text-gray-700 dark:text-gray-300',
                    label: type.toUpperCase()
                };
        }
    };

    return (
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b shadow-sm">

            <div className="w-1/3"></div>

            <div className="w-1/3">
                <Input placeholder={t("topbar.search")} className="dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"/>
            </div>

            <div className="flex items-center space-x-4">

                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="relative">
                    <button
                        onClick={handleBellClick}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer relative"
                    >
                        <Bell size={18} className="text-gray-600 dark:text-gray-300" />
                        {hasNewNotifications && (
                            <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-[32rem]">
                                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Bell size={16} className="text-gray-600 dark:text-gray-300" />
                                        {t("topbar.notifications")}
                                    </h4>
                                    {notifications.length > 0 && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                            {notifications.length}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {t("topbar.loadingNotifications")}
                                            </p>
                                        </div>
                                    ) : error ? (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                            <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                {t("topbar.errorNotifications")}
                                            </p>
                                            <button
                                                onClick={() => fetchNotificationsList(true)}
                                                className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/95 transition flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <RefreshCw size={12} />
                                                {t("common.retry")}
                                            </button>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                            <Bell size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t("topbar.noNotifications")}
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map((notification, index) => {
                                            const styles = getTypeStyles(notification.Type);
                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedNotification(notification);
                                                        setShowNotifications(false);
                                                    }}
                                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition cursor-pointer flex items-start gap-3"
                                                >
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border shrink-0 ${styles.bg} ${styles.text}`}>
                                                        {styles.label}
                                                    </span>
                                                    
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                                {notification.Coin}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                                {formatTime(notification.CreateTime)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                            {notification.Coin} {styles.label} alert triggered.
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                    >
                        <Globe className="w-4 h-4" />
                        <span>{i18n.language.toUpperCase()}</span>
                    </button>

                    {open && (
                        <>
                            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
                            <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                <button
                                    onClick={() => changeLang("tr")}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left cursor-pointer"
                                >
                                    🇹🇷 Türkçe
                                </button>
                                <button
                                    onClick={() => changeLang("en")}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left cursor-pointer"
                                >
                                    🇬🇧 English
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {selectedNotification && (
                <Modal
                    isOpen={!!selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                    title={`${selectedNotification.Coin} - ${getTypeStyles(selectedNotification.Type).label} Alert`}
                    maxWidth="max-w-4xl"
                >
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium block">Coin</span>
                                <span className="font-bold text-base text-gray-900 dark:text-gray-100">{selectedNotification.Coin}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium block">{t("topbar.creationTime")}</span>
                                <span className="font-bold text-base text-gray-900 dark:text-gray-100">{formatTime(selectedNotification.CreateTime)}</span>
                            </div>
                        </div>

                        <div className="relative group flex justify-center bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[300px] items-center">
                            <img
                                src={selectedNotification.Image.startsWith('data:') ? selectedNotification.Image : `data:image/png;base64,${selectedNotification.Image}`}
                                alt={`${selectedNotification.Coin} Alert Chart`}
                                className="max-w-full h-auto object-contain rounded-lg shadow-md max-h-[60vh] transition-all duration-300 hover:scale-[1.01] cursor-zoom-in"
                                onClick={() => setIsImageFullscreen(true)}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                }}
                            />
                            <button
                                onClick={() => setIsImageFullscreen(true)}
                                className="absolute bottom-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shadow-lg backdrop-blur-sm cursor-pointer border border-white/10"
                                title={t("topbar.fullscreen")}
                            >
                                <Maximize2 size={16} />
                                <span className="text-xs font-semibold pr-0.5">{t("topbar.fullscreen")}</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isImageFullscreen && selectedNotification && (
                <div 
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-custom-fade-in cursor-zoom-out"
                    onClick={() => setIsImageFullscreen(false)}
                >
                    {/* Header bar */}
                    <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent z-10">
                        <div className="text-white">
                            <h3 className="font-bold text-lg md:text-xl">
                                {selectedNotification.Coin}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-300">
                                {getTypeStyles(selectedNotification.Type).label} Alert - {formatTime(selectedNotification.CreateTime)}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsImageFullscreen(false)}
                            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center hover:scale-105"
                            title={t("topbar.close") || "Close"}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Image container */}
                    <div 
                        className="w-full h-full flex items-center justify-center p-4 md:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedNotification.Image.startsWith('data:') ? selectedNotification.Image : `data:image/png;base64,${selectedNotification.Image}`}
                            alt={`${selectedNotification.Coin} Alert Chart`}
                            className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl animate-custom-zoom-in cursor-default border border-gray-800"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                            }}
                        />
                    </div>
                </div>
            )}
        </header>
    );
};

export default Topbar;
