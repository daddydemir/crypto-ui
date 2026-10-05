import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import { Lock, User, Eye, EyeOff, LogIn, Globe, QrCode, X } from "lucide-react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

const LoginPage: React.FC = () => {
    const { login, loginWithDeviceCode, isAuthenticated } = useAuth();
    const { success, error } = useToast();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const deviceCode = searchParams.get("deviceCode");

    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const scannerControlsRef = useRef<IScannerControls | null>(null);
    const acceptingScanRef = useRef(true);

    // Redirect to home page if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/coins");
        }
    }, [isAuthenticated, navigate]);

    const stopScanner = () => {
        scannerControlsRef.current?.stop();
        scannerControlsRef.current = null;
        setScannerOpen(false);
    };

    useEffect(() => () => {
        scannerControlsRef.current?.stop();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!usernameInput.trim()) {
            error(t("login.requiredUsername"));
            return;
        }

        if (!passwordInput) {
            error(t("login.requiredPassword"));
            return;
        }

        setLoading(true);
        try {
            await login(usernameInput, passwordInput);
            success(t("login.welcome"));
            navigate("/coins");
        } catch (err) {
            console.error("Login failed:", err);
            error(t("login.error"));
        } finally {
            setLoading(false);
        }
    };

    const handleDeviceLogin = async () => {
        if (!deviceCode) return;
        setLoading(true);
        try { await loginWithDeviceCode(deviceCode); success(t("login.qrSuccess")); navigate("/coins"); }
        catch { error(t("login.qrError")); }
        finally { setLoading(false); }
    };

    const completeQrLogin = async (rawValue: string) => {
        try {
            const scannedUrl = new URL(rawValue, window.location.origin);
            const code = scannedUrl.searchParams.get("deviceCode");
            if (!code || scannedUrl.pathname !== "/login") throw new Error("invalid QR");
            stopScanner();
            setLoading(true);
            await loginWithDeviceCode(code);
            success(t("login.qrSuccess"));
            navigate("/coins");
            return true;
        } catch {
            setScannerError(t("login.qrInvalid"));
            setLoading(false);
            return false;
        }
    };

    const startQrScanner = async () => {
        setScannerError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setScannerError(t("login.qrUnsupported"));
            setScannerOpen(true);
            return;
        }
        setScannerOpen(true);
        acceptingScanRef.current = true;
        try {
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
            if (!videoRef.current) throw new Error("camera unavailable");
            const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 200 });
            scannerControlsRef.current = await reader.decodeFromConstraints(
                { video: { facingMode: { ideal: "environment" } }, audio: false },
                videoRef.current,
                result => {
                    if (!result || !acceptingScanRef.current) return;
                    acceptingScanRef.current = false;
                    void completeQrLogin(result.getText()).then(successful => {
                        if (!successful) acceptingScanRef.current = true;
                    });
                },
            );
        } catch {
            scannerControlsRef.current?.stop();
            scannerControlsRef.current = null;
            setScannerError(t("login.qrCameraError"));
        }
    };

    const changeLang = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
        setLangOpen(false);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans">
            <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" />
            <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50">
                <div className="relative">
                    <button
                        onClick={() => setLangOpen(!langOpen)}
                        className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm font-semibold">{i18n.language.toUpperCase()}</span>
                    </button>

                    {langOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                <button
                                    onClick={() => changeLang("tr")}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                                >
                                    🇹🇷 Türkçe
                                </button>
                                <button
                                    onClick={() => changeLang("en")}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                                >
                                    🇬🇧 English
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 dark:bg-slate-900/90 sm:p-10">
                <div className="flex flex-col items-center mb-8">
                    {/* Visual Brand Icon */}
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                        {t("login.title")}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center max-w-xs">
                        {t("login.subtitle")}
                    </p>
                </div>

                {deviceCode ? <div className="space-y-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50"><QrCode /></div>
                    <div><h3 className="font-semibold text-slate-900 dark:text-white">{t("login.qrTitle")}</h3><p className="mt-2 text-sm text-slate-500">{t("login.qrDescription")}</p></div>
                    <button type="button" onClick={() => void handleDeviceLogin()} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50"><LogIn size={18}/>{loading ? t("login.loggingIn") : t("login.qrButton")}</button>
                    <button type="button" onClick={() => navigate("/login", { replace: true })} className="text-sm font-medium text-slate-500 hover:text-indigo-600">{t("login.usePassword")}</button>
                </div> : <form onSubmit={handleLogin} className="space-y-6">
                    {/* Username Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {t("login.username")}
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <User className="h-5 h-5 text-gray-400 dark:text-gray-500" />
                            </span>
                            <input
                                type="text"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                disabled={loading}
                                placeholder="username"
                                className="w-full rounded-xl border border-gray-200 bg-slate-50 py-3 pl-10 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {t("login.password")}
                            </label>
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock className="h-5 h-5 text-gray-400 dark:text-gray-500" />
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                disabled={loading}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-gray-200 bg-slate-50 py-3 pl-10 pr-12 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="h-5 h-5" /> : <Eye className="h-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>{t("login.loggingIn")}</span>
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                <span>{t("login.button")}</span>
                            </>
                        )}
                    </button>
                    <div className="flex items-center gap-3"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/><span className="text-xs font-medium text-slate-400">{t("login.or")}</span><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/></div>
                    <button type="button" onClick={() => void startQrScanner()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"><QrCode size={20}/>{t("login.scanQr")}</button>
                </form>}
            </div>
            {scannerOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"><button type="button" onClick={stopScanner} className="absolute right-4 top-4 z-10 rounded-lg bg-black/40 p-2 text-white"><X size={18}/></button><h3 className="pr-10 text-lg font-bold text-slate-900 dark:text-white">{t("login.scanQr")}</h3><p className="mt-1 text-sm text-slate-500">{t("login.scanQrDescription")}</p><div className="relative mt-5 aspect-square overflow-hidden rounded-2xl bg-slate-950"><video ref={videoRef} playsInline muted className="h-full w-full object-cover"/><div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-cyan-400 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]"/></div>{scannerError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{scannerError}</p>}</div></div>}
        </div>
    );
};

export default LoginPage;
