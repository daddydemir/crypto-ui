const storageKey = "authDiagnostics";
const maxEntries = 100;

export interface AuthDiagnosticEntry {
    at: string;
    kind: string;
    method?: string;
    path?: string;
    status?: number;
    reason?: string;
    tokenExp?: string;
    tokenIat?: string;
    tokenAgeHours?: number;
    details?: string;
}

function tokenTimes(): Pick<AuthDiagnosticEntry, "tokenExp" | "tokenIat" | "tokenAgeHours"> {
    try {
        const token = localStorage.getItem("token");
        const payload = token?.split(".")[1];
        if (!payload) return {};
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const claims = JSON.parse(atob(normalized)) as { exp?: number; iat?: number };
        const now = Date.now() / 1000;
        const times: ReturnType<typeof tokenTimes> = {};
        if (typeof claims.exp === "number") times.tokenExp = new Date(claims.exp * 1000).toISOString();
        if (typeof claims.iat === "number") {
            times.tokenIat = new Date(claims.iat * 1000).toISOString();
            times.tokenAgeHours = Math.round(((now - claims.iat) / 3600) * 100) / 100;
        }
        return times;
    } catch {
        return {};
    }
}

export function recordAuthDiagnostic(entry: Omit<AuthDiagnosticEntry, "at">): void {
    try {
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]") as AuthDiagnosticEntry[];
        const next = [...existing, { at: new Date().toISOString(), ...entry, ...tokenTimes() }].slice(-maxEntries);
        localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
        // Diagnostics must never interrupt normal authentication or API requests.
    }
}

export function getAuthDiagnostics(): AuthDiagnosticEntry[] {
    try {
        return JSON.parse(localStorage.getItem(storageKey) || "[]") as AuthDiagnosticEntry[];
    } catch {
        return [];
    }
}

export function clearAuthDiagnostics(): void {
    localStorage.removeItem(storageKey);
}

export async function copyAuthDiagnostics(): Promise<boolean> {
    const text = JSON.stringify(getAuthDiagnostics(), null, 2);
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        window.prompt("Teşhis kayıtlarını kopyalayın:", text);
        return false;
    }
}
