export interface Alert {
    ID: number
    Coin: string
    Price: number
    IsAbove: boolean
    CreateDate: string
    IsActive: boolean
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
        const response = await fetch('https://cryptoapi.daddydemir.dev/api/v1/alerts')

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Error fetching alerts:', error)
        return []
    }
}

export async function createAlert(alert: CreateAlertDto): Promise<Alert | null> {
    try {
        const response = await fetch('https://cryptoapi.daddydemir.dev/api/v1/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alert),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Error creating alert:', error)
        return null
    }
}

export async function updateAlert(id: number, alert: UpdateAlertDto): Promise<Alert | null> {
    try {
        const response = await fetch(`https://cryptoapi.daddydemir.dev/api/v1/alerts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alert),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Error updating alert:', error)
        return null
    }
}

export async function updateAlertStatus(id: number, isActive: boolean): Promise<Alert | null> {
    try {
        const response = await fetch(`https://cryptoapi.daddydemir.dev/api/v1/alerts/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive }),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Error updating alert status:', error)
        return null
    }
}

export async function deleteAlert(id: number): Promise<boolean> {
    try {
        const response = await fetch(`https://cryptoapi.daddydemir.dev/api/v1/alerts/${id}`, {
            method: 'DELETE',
        })

        return response.ok
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