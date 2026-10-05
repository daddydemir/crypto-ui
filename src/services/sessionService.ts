import { authHttp } from "@/services/api/httpClient"

export interface Session {
    id: string
    ipAddress: string
    userAgent: string
    createdAt: string
    lastSeenAt: string
    expiresAt: string
    current: boolean
}

export const sessionService = {
    list: () => authHttp.get<Session[]>("/sessions"),
    revoke: (id: string) => authHttp.delete<void>(`/sessions/${id}`),
}
