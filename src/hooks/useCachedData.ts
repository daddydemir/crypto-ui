import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
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
    const { t } = useTranslation()
    const { getCache, setCache, getLastFetchTime, isCacheValid } = useCacheContext()

    const [data, setData] = useState<T | null>(() => getCache<T>(cacheKey))
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [lastUpdateText, setLastUpdateText] = useState('')
    const isFetchingRef = useRef(false)
    const lastCacheKeyRef = useRef(cacheKey)

    const updateLastUpdateText = useCallback(() => {
        const lastFetch = getLastFetchTime(cacheKey)
        if (!lastFetch) {
            setLastUpdateText(t('common.neverUpdated', 'Never updated'))
            return
        }

        const now = Date.now()
        const diff = now - lastFetch
        const minutes = Math.floor(diff / 60000)

        if (minutes < 1) {
            setLastUpdateText(t('common.justNow', 'Just now'))
        } else if (minutes === 1) {
            setLastUpdateText(t('common.oneMinuteAgo', '1 minute ago'))
        } else {
            setLastUpdateText(t('common.minutesAgo', '{{minutes}} minutes ago', { minutes }))
        }
    }, [cacheKey, getLastFetchTime, t])

    useEffect(() => {
        updateLastUpdateText()
        const interval = setInterval(updateLastUpdateText, 10000)
        return () => clearInterval(interval)
    }, [updateLastUpdateText])

    useEffect(() => {
        if (isFetchingRef.current && lastCacheKeyRef.current === cacheKey) {
            return
        }

        const fetchData = async (forceRefresh = false) => {
            if (isFetchingRef.current) {
                return
            }

            try {
                if (!forceRefresh && isCacheValid(cacheKey, cacheDuration)) {
                    const cachedData = getCache<T>(cacheKey)
                    if (cachedData) {
                        setData(cachedData)
                        setLoading(false)
                        return
                    }
                }

                isFetchingRef.current = true
                lastCacheKeyRef.current = cacheKey

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
                isFetchingRef.current = false
            }
        }

        fetchData(false)
    }, [cacheKey])

    const refresh = useCallback(async () => {
        if (isFetchingRef.current) {
            return
        }

        try {
            isFetchingRef.current = true
            setRefreshing(true)

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
            setRefreshing(false)
            isFetchingRef.current = false
        }
    }, [cacheKey, fetchFn, setCache, onSuccess, onError, updateLastUpdateText])

    return {
        data,
        loading,
        refreshing,
        error,
        refresh,
        lastUpdateText
    }
}