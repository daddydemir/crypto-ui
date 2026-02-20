import { MOSAIC_BASE_URL } from './api/config';

export interface Definition {
    name: string
    fields: Field[]
}

export interface Field {
    name: string
    type: string
    required: boolean
    values: string[]
}

export async function getMosaics(): Promise<Definition[]> {
    try {
        return await fetch(`${MOSAIC_BASE_URL}/definitions`).then(res => res.json())
    } catch (error) {
        console.error('Error fetching definitions:', error)
        return []
    }
}