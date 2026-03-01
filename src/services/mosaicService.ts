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

export interface BlockConfig {
    [key: string]: any;
}

export interface MosaicBlock {
    id: string;
    type: string;
    config: BlockConfig;
    order: number;
    connections: number;
}

export interface Mosaic {
    Id: string;
    name: string;
    blocks: MosaicBlock[];
}

export async function getUserMosaics(): Promise<Mosaic[]> {
    try {
        const response = await fetch(`${MOSAIC_BASE_URL}/mosaic`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user mosaics:', error);
        return [];
    }
}