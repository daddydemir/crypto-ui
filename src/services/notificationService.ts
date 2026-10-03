import { http } from './api/httpClient';

export interface CryptoNotification {
    Type: string;
    Coin: string;
    CreateTime: number;
    Image: string;
}

export async function getNotifications(): Promise<CryptoNotification[]> {
    try {
        const notifications = await http.get<CryptoNotification[] | null>('/notifications');
        return Array.isArray(notifications) ? notifications : [];
    } catch {
        // Notifications are polled in the background. A temporary failure should not
        // create a new console error every 30 seconds.
        return [];
    }
}
