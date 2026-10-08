import { authHttp } from '@/services/api/httpClient';

export interface NotificationTarget {
    id: string;
    channel: 'telegram';
    label: string;
    address: string;
}

export interface TelegramLink {
    sessionId: string;
    code: string;
    deepLink: string;
    expiresAt: string;
}

export const notificationTargetService = {
    list: () => authHttp.get<NotificationTarget[]>('/users/me/notification-targets'),
    createTelegramLink: () => authHttp.post<TelegramLink>('/telegram-links', {}),
    telegramLinkStatus: (sessionId: string) => authHttp.get<{ status: 'pending' | 'verified' | 'expired' }>(`/telegram-links/${encodeURIComponent(sessionId)}`),
};
