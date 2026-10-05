declare module "qrcode" {
    export function toDataURL(text: string, options?: { width?: number; margin?: number; errorCorrectionLevel?: string; color?: { dark?: string; light?: string } }): Promise<string>
}

declare class BarcodeDetector {
    constructor(options?: { formats?: string[] })
    detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>
}
