import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import { Lock, User, Eye, EyeOff, LogIn, Globe, QrCode } from "lucide-react";

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

    // Redirect to home page if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/coins");
        }
    }, [isAuthenticated, navigate]);

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
                </form>}
            </div>
        </div>
    );
};

export default LoginPage;
