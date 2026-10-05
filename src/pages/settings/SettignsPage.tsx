import { Bell, Languages, LoaderCircle, LogOut, MonitorSmartphone, Moon, QrCode, RefreshCw, Settings2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { browserNotificationsEnabled, browserNotificationsSupported, setBrowserNotificationsEnabled } from "@/services/browserNotificationService"
import { sessionService, type Session } from "@/services/sessionService"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import QRCode from "qrcode"
import { deviceLinkService } from "@/services/deviceLinkService"

function deviceName(userAgent: string, t: (key: string) => string) {
    const browser = userAgent.includes("Edg/") ? "Edge" : userAgent.includes("Firefox/") ? "Firefox" : userAgent.includes("Chrome/") ? "Chrome" : userAgent.includes("Safari/") ? "Safari" : t("settingsPage.sessions.unknownBrowser")
    const os = userAgent.includes("Windows") ? "Windows" : userAgent.includes("Android") ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : userAgent.includes("Mac OS") ? "macOS" : userAgent.includes("Linux") ? "Linux" : t("settingsPage.sessions.unknownDevice")
    return `${browser} · ${os}`
}

export default function SettingsPage() {
    const { t, i18n } = useTranslation()
    const { isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()
    const toastRef = useRef(toast)
    const translationRef = useRef(t)
    toastRef.current = toast
    translationRef.current = t
    const [darkMode, setDarkModeState] = useState(() => document.documentElement.classList.contains("dark"))
    const [browserNotifications, setBrowserNotifications] = useState(browserNotificationsEnabled)
    const [notificationDenied, setNotificationDenied] = useState(() => browserNotificationsSupported() && Notification.permission === "denied")
    const [sessions, setSessions] = useState<Session[]>([])
    const [loadingSessions, setLoadingSessions] = useState(false)
    const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null)
    const [qrImage, setQrImage] = useState<string | null>(null)
    const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null)
    const [creatingQr, setCreatingQr] = useState(false)

    const loadSessions = useCallback(async () => {
        if (!isAuthenticated) return
        setLoadingSessions(true)
        try { setSessions(await sessionService.list()) }
        catch { toastRef.current.error(translationRef.current("settingsPage.sessions.loadError")) }
        finally { setLoadingSessions(false) }
    }, [isAuthenticated])

    useEffect(() => { void loadSessions() }, [loadSessions])

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

    const revokeSession = async () => {
        if (!sessionToRevoke) return
        const target = sessionToRevoke
        try {
            await sessionService.revoke(target.id)
            if (target.current) { logout(); navigate("/login", { replace: true }); return }
            setSessions(current => current.filter(session => session.id !== target.id))
            toast.success(t("settingsPage.sessions.revoked"))
        } catch { toast.error(t("settingsPage.sessions.revokeError")) }
    }

    const createQrLogin = async () => {
        setCreatingQr(true)
        try {
            const link = await deviceLinkService.create()
            const url = `${window.location.origin}/login?deviceCode=${encodeURIComponent(link.code)}`
            setQrImage(await QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: "M" }))
            setQrExpiresAt(link.expiresAt)
        } catch { toast.error(t("settingsPage.qr.error")) }
        finally { setCreatingQr(false) }
    }

    return <div className="page-shell">
        <section className="page-hero"><div className="relative z-10"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"><Settings2 /></span><h1 className="text-3xl font-bold tracking-tight">{t("sidebar.settings")}</h1><p className="mt-2 text-sm text-slate-300">{t("settingsPage.description")}</p></div></section>
        <section className="surface-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
            <div className="flex items-center justify-between gap-5 p-5 sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/50"><Moon size={20} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.darkMode")}</p><p className="text-sm text-slate-500">{t("settingsPage.darkModeDescription")}</p></div></div><button onClick={() => setDarkMode(!darkMode)} className={`relative h-7 w-12 rounded-full transition ${darkMode ? "bg-indigo-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${darkMode ? "left-6" : "left-1"}`} /></button></div>
            <div className="flex items-center justify-between gap-5 p-5 sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-cyan-50 p-3 text-cyan-600 dark:bg-cyan-950/50"><Languages size={20} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.language")}</p><p className="text-sm text-slate-500">{t("settingsPage.languageDescription")}</p></div></div><div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{["tr", "en"].map(lang => <button key={lang} onClick={() => { void i18n.changeLanguage(lang); localStorage.setItem("language", lang) }} className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase ${i18n.language === lang ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700" : "text-slate-500"}`}>{lang}</button>)}</div></div>
            <div className="flex items-center justify-between gap-5 p-5 sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50"><Bell size={20} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.notifications")}</p><p className="text-sm text-slate-500">{notificationDenied ? t("settingsPage.notificationsDenied") : t("settingsPage.notificationsDescription")}</p></div></div><button type="button" disabled={!browserNotificationsSupported() || notificationDenied} onClick={() => void toggleBrowserNotifications()} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${browserNotifications ? "bg-indigo-600" : "bg-slate-300"}`} aria-label={t("settingsPage.notifications")}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${browserNotifications ? "left-6" : "left-1"}`} /></button></div>
        </section>

        <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50"><MonitorSmartphone size={20} /></span><div><h2 className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.sessions.title")}</h2><p className="text-sm text-slate-500">{t("settingsPage.sessions.description")}</p></div></div><button type="button" onClick={() => void loadSessions()} disabled={loadingSessions} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label={t("common.refresh")}><RefreshCw size={18} className={loadingSessions ? "animate-spin" : ""} /></button></div>
            {loadingSessions && sessions.length === 0 ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />{t("common.loading")}</div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{sessions.map(session => <div key={session.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-semibold text-slate-900 dark:text-white">{deviceName(session.userAgent, t)}</p>{session.current && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{t("settingsPage.sessions.current")}</span>}</div><p className="mt-1 text-sm text-slate-500">{session.ipAddress || t("settingsPage.sessions.unknownIp")}</p><p className="mt-1 text-xs text-slate-400">{t("settingsPage.sessions.lastActive", { date: new Intl.DateTimeFormat(t("common.locale"), { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.lastSeenAt)) })}</p></div><button type="button" onClick={() => setSessionToRevoke(session)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"><LogOut size={16} />{t("settingsPage.sessions.terminate")}</button></div>)}</div>}
        </section>
        <section className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-4"><span className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-950/50"><QrCode size={20}/></span><div><h2 className="font-semibold text-slate-900 dark:text-white">{t("settingsPage.qr.title")}</h2><p className="text-sm text-slate-500">{t("settingsPage.qr.description")}</p></div></div><button type="button" onClick={() => void createQrLogin()} disabled={creatingQr} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><QrCode size={17}/>{creatingQr ? t("common.loading") : t("settingsPage.qr.create")}</button></section>
        {qrImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl dark:bg-slate-900"><button type="button" onClick={() => setQrImage(null)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button><h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("settingsPage.qr.modalTitle")}</h3><p className="mt-2 text-sm text-slate-500">{t("settingsPage.qr.modalDescription")}</p><img src={qrImage} alt={t("settingsPage.qr.title")} className="mx-auto mt-5 w-64 rounded-2xl border border-slate-200"/><p className="mt-4 text-xs font-medium text-amber-600">{t("settingsPage.qr.expires", { time: qrExpiresAt ? new Intl.DateTimeFormat(t("common.locale"), { timeStyle: "short" }).format(new Date(qrExpiresAt)) : "" })}</p></div></div>}
        <ConfirmDialog isOpen={!!sessionToRevoke} onClose={() => setSessionToRevoke(null)} onConfirm={() => void revokeSession()} title={t("settingsPage.sessions.confirmTitle")} message={sessionToRevoke?.current ? t("settingsPage.sessions.confirmCurrent") : t("settingsPage.sessions.confirmOther")} confirmText={t("settingsPage.sessions.terminate")} />
    </div>
}
