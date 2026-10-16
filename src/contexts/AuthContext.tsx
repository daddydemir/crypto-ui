import React, { createContext, useContext, useState, useEffect } from "react";
import { http } from "@/services/api/httpClient";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deviceLinkService } from "@/services/deviceLinkService";
import { clearAuthDiagnostics, copyAuthDiagnostics, getAuthDiagnostics, recordAuthDiagnostic } from "@/services/authDiagnostics";

interface LoginResponse {
    username: string;
    token: string;
}

interface AuthContextType {
    token: string | null;
    username: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<LoginResponse>;
    loginWithDeviceCode: (code: string) => Promise<LoginResponse>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [diagnosticsCopied, setDiagnosticsCopied] = useState<boolean>(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        // Load credentials from localStorage on mount
        const storedToken = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        recordAuthDiagnostic({ kind: "app-start", details: storedToken ? "stored-token-found" : "no-stored-token" });
        if (storedToken && storedUsername) {
            setToken(storedToken);
            setUsername(storedUsername);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const handleUnauthorized = (event: Event) => {
            const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason || "unspecified";
            recordAuthDiagnostic({ kind: "auth-state-cleared", reason });
            // Reset local auth state
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            setToken(null);
            setUsername(null);
            setShowConfirm(true);
        };

        window.addEventListener("auth-401-unauthorized", handleUnauthorized);
        return () => {
            window.removeEventListener("auth-401-unauthorized", handleUnauthorized);
        };
    }, []);

    const handleConfirm = () => {
        setShowConfirm(false);
        navigate("/login");
    };

    const handleClose = () => {
        setShowConfirm(false);
    };

    const login = async (usernameInput: string, passwordInput: string): Promise<LoginResponse> => {
        try {
            const data = await http.post<LoginResponse>("/login", {
                username: usernameInput,
                password: passwordInput,
            });

            if (data && data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username);
                setToken(data.token);
                setUsername(data.username);
                recordAuthDiagnostic({ kind: "login-success", details: "password" });
                return data;
            } else {
                throw new Error("Invalid response format from login API");
            }
        } catch (error) {
            console.error("Login request failed:", error);
            throw error;
        }
    };

    const loginWithDeviceCode = async (code: string): Promise<LoginResponse> => {
        const data = await deviceLinkService.claim(code);
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        setToken(data.token);
        setUsername(data.username);
        recordAuthDiagnostic({ kind: "login-success", details: "device-code" });
        return data;
    };

    const logout = () => {
        recordAuthDiagnostic({ kind: "manual-logout" });
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setToken(null);
        setUsername(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, username, isAuthenticated, loading, login, loginWithDeviceCode, logout }}>
            {children}
            <ConfirmDialog
                isOpen={showConfirm}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={t("login.unauthorizedTitle")}
                message={t("login.unauthorizedMessage")}
                confirmText={t("login.title")}
                cancelText={t("common.cancel")}
                variant="info"
            >
                <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={async () => { await copyAuthDiagnostics(); setDiagnosticsCopied(true); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                        {diagnosticsCopied ? t("login.diagnosticsCopied") : t("login.copyDiagnostics")}
                    </button>
                    <button type="button" onClick={() => { clearAuthDiagnostics(); setDiagnosticsCopied(false); recordAuthDiagnostic({ kind: "diagnostics-cleared" }); }} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        {t("login.clearDiagnostics")}
                    </button>
                    <span className="self-center text-xs text-slate-500">{t("login.diagnosticCount", { count: getAuthDiagnostics().length })}</span>
                </div>
            </ConfirmDialog>
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
