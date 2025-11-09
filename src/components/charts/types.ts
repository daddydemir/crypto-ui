import type {BollingerBandsPoint} from "@/services/bollingerBandsService.ts";
import type {MovingAveragePoint} from "@/services/movingAverageService.ts";
import type {MovingAveragePoint as EMA} from "@/services/exponentialMAService.ts";
import type {RSIHistoryPoint} from "@/services/rsiService.ts";

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

export interface FullScreenChartProps {
    data: ChartPoint[]
    timeRange: TimeRange
    coinSymbol: string
    onClose: () => void
}

export interface ChartPoint {
    date: string
    y?: number | null
    series?: Record<string, number | null>
    seriesKeys?: string[]
}

export function mapBollingerToChartPoints(
    data: BollingerBandsPoint[],
    options?: { includeY?: 'MA20' | 'UpperBand' | 'LowerBand' | ((p: BollingerBandsPoint) => number | null) }
): ChartPoint[] {
    return data.map((p) => {
        const series = {
            MA20: p.MA20,
            UpperBand: p.UpperBand,
            LowerBand: p.LowerBand
        } as Record<string, number | null>

        let y: number | null | undefined
        if (options?.includeY) {
            if (typeof options.includeY === 'function') {
                y = options.includeY(p)
            } else {
                y = series[options.includeY] ?? null
            }
        }

        const point: ChartPoint = {
            date: p.Date,
            series
        }

        if (y !== undefined) point.y = y
        return point
    })
}

type IncludeYOption = 'ma7' | 'ma25' | 'ma99' | ((p: MovingAveragePoint) => number | null)

export function mapMovingAverageToChartPoints(
    data: MovingAveragePoint[],
    options?: { includeY?: IncludeYOption }
): ChartPoint[] {
    if (!data || data.length === 0) return []

    return data.map((p) => {
        const series: Record<string, number | null> = {
            ma7: p.ma7 ?? null,
            ma25: p.ma25 ?? null,
            ma99: p.ma99 ?? null
        }

        let y: number | null | undefined
        if (options?.includeY) {
            if (typeof options.includeY === 'function') {
                y = options.includeY(p)
            } else {
                y = series[options.includeY] ?? null
            }
        }

        const point: ChartPoint = {
            date: p.date,
            series
        }

        if (y !== undefined) point.y = y
        return point
    })
}


export function mapExponentialMAToChartPoints(
    data: EMA[],
    options?: { includeY?: IncludeYOption }
): ChartPoint[] {
    if (!data || data.length === 0) return []

    return data.map((p) => {
        const series: Record<string, number | null> = {
            ma7: p.ma7 ?? null,
            ma25: p.ma25 ?? null,
            ma99: p.ma99 ?? null
        }

        let y: number | null | undefined
        if (options?.includeY) {
            if (typeof options.includeY === 'function') {
                y = options.includeY(p)
            } else {
                y = series[options.includeY] ?? null
            }
        }

        const point: ChartPoint = {
            date: p.date,
            series
        }

        if (y !== undefined) point.y = y
        return point
    })
}

export function mapRsiToChartPoints(
    data: RSIHistoryPoint[],
    options?: { includeY?: boolean | ((p: RSIHistoryPoint) => number | null) }
): ChartPoint[] {
    if (!data || data.length === 0) return []

    return data.map((p) => {
        const series: Record<string, number | null> = {
            rsi: p.rsi ?? null
        }

        let y: number | null | undefined
        if (options?.includeY !== undefined) {
            if (typeof options.includeY === 'function') {
                y = options.includeY(p)
            } else if (options.includeY === true) {
                y = p.rsi ?? null
            }
        }

        const point: ChartPoint = {
            date: p.date,
            series
        }

        if (y !== undefined) point.y = y
        return point
    })
}
