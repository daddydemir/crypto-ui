import { useMemo } from 'react'

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

interface UseTimeRangeFilterOptions<T> {
    data: T[] | undefined | null
    timeRange: TimeRange
    dateExtractor: (item: T) => string | Date
    maxSampleSize?: number
}

export function useTimeRangeFilter<T>({
    data,
    timeRange,
    dateExtractor,
    maxSampleSize = 1000
}: UseTimeRangeFilterOptions<T>) {
    return useMemo(() => {
        if (!data || data.length === 0) return []

        const now = new Date()
        let cutoffDate = new Date()
        let sampleRate = 1

        switch (timeRange) {
            case '7d':
                cutoffDate.setDate(now.getDate() - 7)
                sampleRate = 1
                break
            case '30d':
                cutoffDate.setDate(now.getDate() - 30)
                sampleRate = 1
                break
            case '90d':
                cutoffDate.setDate(now.getDate() - 90)
                sampleRate = 1
                break
            case '1y':
                cutoffDate.setFullYear(now.getFullYear() - 1)
                sampleRate = 1
                break
            case 'all':
                cutoffDate = new Date(0)
                sampleRate = Math.ceil(data.length / maxSampleSize)
                break
        }

        const filtered = data.filter(item => {
            const itemDate = dateExtractor(item)
            return new Date(itemDate) >= cutoffDate
        })

        if (sampleRate > 1) {
            return filtered.filter((_, index) => index % sampleRate === 0)
        }

        return filtered
    }, [data, timeRange, dateExtractor, maxSampleSize])
}
