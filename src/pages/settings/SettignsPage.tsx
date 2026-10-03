import { Bell, Languages, Moon, Settings2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { browserNotificationsEnabled, browserNotificationsSupported, setBrowserNotificationsEnabled } from "@/services/browserNotificationService"

export default function SettingsPage() {
    const { t, i18n } = useTranslation()
    const [darkMode, setDarkModeState] = useState(() => document.documentElement.classList.contains("dark"))
    const [browserNotifications, setBrowserNotifications] = useState(browserNotificationsEnabled)
    const [notificationDenied, setNotificationDenied] = useState(() => browserNotificationsSupported() && Notification.permission === "denied")

    const setDarkMode = (enabled: boolean) => {
        document.documentElement.classList.toggle("dark", enabled)
        localStorage.setItem("darkMode", enabled.toString())
        setDarkModeState(enabled)
        window.dispatchEvent(new CustomEvent("themechange", { detail: enabled }))
    }

    const toggleBrowserNotifications = async () => {
        const enabled = await setBrowserNotificationsEnabled(!browserNotifications)
        setBrowserNotifications(enabled)
        setNotificationDenied(browserNotificationsSupported() && Notification.permission === "denied")
    }

    return <div className="page-shell">
        <section className="page-hero"><div className="relative z-10"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"><Settings2 /></span><h1 className="text-3xl font-bold tracking-tight">{t("sidebar.settings")}</h1><p className="mt-2 text-sm text-slate-300">{t("settingsPage.description")}</p></div></section>
        <section className="surface-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
            <div className="flex items-center justify-between gap-5 p-5 sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/50"><Moon size={20} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.darkMode")}</p><p className="text-sm text-slate-500">{t("settingsPage.darkModeDescription")}</p></div></div><button onClick={() => setDarkMode(!darkMode)} className={`relative h-7 w-12 rounded-full transition ${darkMode ? "bg-indigo-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${darkMode ? "left-6" : "left-1"}`} /></button></div>
            <div className="flex items-center justify-between gap-5 p-5 sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-cyan-50 p-3 text-cyan-600 dark:bg-cyan-950/50"><Languages size={20} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.language")}</p><p className="text-sm text-slate-500">{t("settingsPage.languageDescription")}</p></div></div><div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{["tr", "en"].map(lang => <button key={lang} onClick={() => { void i18n.changeLanguage(lang); localStorage.setItem("language", lang) }} className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase ${i18n.language === lang ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700" : "text-slate-500"}`}>{lang}</button>)}</div></div>
            <div className="flex items-center justify-between gap-5 p-5 sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50"><Bell size={20} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.notifications")}</p><p className="text-sm text-slate-500">{notificationDenied ? t("settingsPage.notificationsDenied") : t("settingsPage.notificationsDescription")}</p></div></div><button type="button" disabled={!browserNotificationsSupported() || notificationDenied} onClick={() => void toggleBrowserNotifications()} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${browserNotifications ? "bg-indigo-600" : "bg-slate-300"}`} aria-label={t("settingsPage.notifications")}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${browserNotifications ? "left-6" : "left-1"}`} /></button></div>
        </section>
    </div>
}
