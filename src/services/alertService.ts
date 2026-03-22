import { http } from './api/httpClient'

export interface Alert {
    ID: number
    Coin: string
    Price: number
    IsAbove: boolean
    CreateDate: string
    IsActive: boolean
    livePrice?: number
}

export interface CreateAlertDto {
    Coin: string
    Price: number
    IsAbove: boolean
}

export interface UpdateAlertDto {
    price: number
    isAbove: boolean
}

export async function getAlerts(): Promise<Alert[]> {
    try {
        return await http.get<Alert[]>('/alerts')
    } catch (error) {
        console.error('Error fetching alerts:', error)
        return []
    }
}

export async function createAlert(alert: CreateAlertDto): Promise<Alert | null> {
    try {
        return await http.post<Alert>('/alerts', alert)
    } catch (error) {
        console.error('Error creating alert:', error)
        return null
    }
}

export async function updateAlert(id: number, alert: UpdateAlertDto): Promise<Alert | null> {
    try {
        return await http.put<Alert>(`/alerts/${id}`, alert)
    } catch (error) {
        console.error('Error updating alert:', error)
        return null
    }
}

export async function updateAlertStatus(id: number, isActive: boolean): Promise<Alert | null> {
    try {
        return await http.put<Alert>(`/alerts/${id}/status`, { isActive })
    } catch (error) {
        console.error('Error updating alert status:', error)
        return null
    }
}

export async function deleteAlert(id: number): Promise<boolean> {
    try {
        await http.delete<void>(`/alerts/${id}`)
        return true
    } catch (error) {
        console.error('Error deleting alert:', error)
        return false
    }
}

export async function toggleAlertStatus(id: number, isActive: boolean): Promise<boolean> {
    try {
        const result = await updateAlertStatus(id, isActive)
        return result !== null
    } catch (error) {
        console.error('Error toggling alert status:', error)
        return false
    }
}