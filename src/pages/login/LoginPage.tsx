import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import { Lock, User, Eye, EyeOff, LogIn, Globe } from "lucide-react";

const LoginPage: React.FC = () => {
    const { login, isAuthenticated } = useAuth();
    const { success, error } = useToast();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

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

    const changeLang = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
        setLangOpen(false);
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 font-sans p-4">

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
            <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 shadow-2xl rounded-2xl p-8 sm:p-10 transition-all duration-300">
                <div className="flex flex-col items-center mb-8">
                    {/* Visual Brand Icon */}
                    <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center shadow-md mb-4">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                        {t("login.title")}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center max-w-xs">
                        {t("login.subtitle")}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
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
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                                className="w-full pl-10 pr-12 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                        className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
