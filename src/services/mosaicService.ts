import { mosaicHttp } from './api/httpClient';

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
        return await mosaicHttp.get<Definition[]>('/definitions');
    } catch (error) {
        console.error('Error fetching definitions:', error);
        return [];
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
        return await mosaicHttp.get<Mosaic[]>('/mosaic');
    } catch (error) {
        console.error('Error fetching user mosaics:', error);
        return [];
    }
}

export async function createMosaic(mosaic: any): Promise<any> {
    return await mosaicHttp.post('/mosaic', mosaic);
}

export async function updateMosaic(id: string, mosaic: any): Promise<any> {
    return await mosaicHttp.put(`/mosaic/${id}`, mosaic);
}

export async function deleteMosaic(id: string): Promise<void> {
    return await mosaicHttp.delete(`/mosaic/${id}`);
}