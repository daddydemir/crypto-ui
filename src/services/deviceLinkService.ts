import { http } from "@/services/api/httpClient"

export interface DeviceLink { code: string; expiresAt: string }
export interface DeviceLogin { username: string; token: string }

export const deviceLinkService = {
    create: () => http.post<DeviceLink>("/device-links", {}),
    claim: (code: string) => http.post<DeviceLogin>("/device-links/claim", { code }),
}
