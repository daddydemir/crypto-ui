import { useState, useEffect, useCallback } from 'react'
import {useCacheContext} from '@/contexts/CacheContext'

interface UseCachedDataOptions<T> {
    cacheKey: string
    fetchFn: () => Promise<T>
    cacheDuration?: number
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
}

interface UseCachedDataReturn<T> {
    data: T | null
    loading: boolean
    refreshing: boolean
    error: Error | null
    refresh: () => Promise<void>
    lastUpdateText: string
}

const CACHE_DURATION = 5 * 60 * 1000

export function useCachedData<T>({
                                     cacheKey,
                                     fetchFn,
                                     cacheDuration = CACHE_DURATION,
                                     onSuccess,
                                     onError
                                 }: UseCachedDataOptions<T>): UseCachedDataReturn<T> {
    const { getCache, setCache, getLastFetchTime, isCacheValid } = useCacheContext()

    const [data, setData] = useState<T | null>(() => getCache<T>(cacheKey))
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [lastUpdateText, setLastUpdateText] = useState('')

    const updateLastUpdateText = useCallback(() => {
        const lastFetch = getLastFetchTime(cacheKey)
        if (!lastFetch) {
            setLastUpdateText('Never updated')
            return
        }

        const now = Date.now()
        const diff = now - lastFetch
        const minutes = Math.floor(diff / 60000)

        if (minutes < 1) {
            setLastUpdateText('Just now')
        } else if (minutes === 1) {
            setLastUpdateText('1 minute ago')
        } else {
            setLastUpdateText(`${minutes} minutes ago`)
        }
    }, [cacheKey, getLastFetchTime])

    useEffect(() => {
        updateLastUpdateText()
        const interval = setInterval(updateLastUpdateText, 10000)
        return () => clearInterval(interval)
    }, [updateLastUpdateText])

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            if (!forceRefresh && isCacheValid(cacheKey, cacheDuration)) {
                const cachedData = getCache<T>(cacheKey)
                if (cachedData) {
                    setData(cachedData)
                    setLoading(false)
                    return
                }
            }

            const isRefreshing = data !== null
            if (isRefreshing) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            const result = await fetchFn()
            setData(result)
            setCache(cacheKey, result)
            setError(null)

            if (onSuccess) {
                onSuccess(result)
            }

            updateLastUpdateText()
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            if (onError) {
                onError(error)
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [cacheKey, cacheDuration, isCacheValid, getCache, setCache, fetchFn, onSuccess, onError, data, updateLastUpdateText])

    useEffect(() => {
        fetchData(false)
    }, [])

    const refresh = useCallback(async () => {
        await fetchData(true)
    }, [fetchData])

    return {
        data,
        loading,
        refreshing,
        error,
        refresh,
        lastUpdateText
    }
}