import React, { createContext, useContext, useState, useEffect } from "react";
import { http } from "@/services/api/httpClient";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        // Load credentials from localStorage on mount
        const storedToken = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        if (storedToken && storedUsername) {
            setToken(storedToken);
            setUsername(storedUsername);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
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
                return data;
            } else {
                throw new Error("Invalid response format from login API");
            }
        } catch (error) {
            console.error("Login request failed:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setToken(null);
        setUsername(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, username, isAuthenticated, loading, login, logout }}>
            {children}
            <ConfirmDialog
                isOpen={showConfirm}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={t("login.unauthorizedTitle", "Giriş Gerekli")}
                message={t("login.unauthorizedMessage", "Bu işlemi yapabilmek için giriş yapmanız gerekmektedir. Giriş sayfasına gitmek istiyor musunuz?")}
                confirmText={t("login.title", "Giriş Yap")}
                cancelText={t("common.cancel", "İptal")}
                variant="info"
            />
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
