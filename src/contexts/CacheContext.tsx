
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react'

interface CacheEntry<T> {
    data: T
    timestamp: number
}

interface CacheContextType {
    getCache: <T>(key: string) => T | null
    setCache: <T>(key: string, data: T) => void
    getLastFetchTime: (key: string) => number | null
    isCacheValid: (key: string, cacheDuration: number) => boolean
    clearCache: (key?: string) => void
}

const CacheContext = createContext<CacheContextType | undefined>(undefined)

export const CacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cache, setCache] = useState<Record<string, CacheEntry<any>>>({})

    const getCache = useCallback(<T,>(key: string): T | null => {
        return cache[key]?.data || null
    }, [cache])

    const setCacheData = useCallback(<T,>(key: string, data: T) => {
        setCache(prev => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now()
            }
        }))
    }, [])

    const getLastFetchTime = useCallback((key: string): number | null => {
        return cache[key]?.timestamp || null
    }, [cache])

    const isCacheValid = useCallback((key: string, cacheDuration: number): boolean => {
        const lastFetch = cache[key]?.timestamp
        if (!lastFetch) return false

        const now = Date.now()
        return (now - lastFetch) < cacheDuration
    }, [cache])

    const clearCache = useCallback((key?: string) => {
        if (key) {
            setCache(prev => {
                const newCache = { ...prev }
                delete newCache[key]
                return newCache
            })
        } else {
            setCache({})
        }
    }, [])

    return (
        <CacheContext.Provider value={{
            getCache,
            setCache: setCacheData,
            getLastFetchTime,
            isCacheValid,
            clearCache
        }}>
            {children}
        </CacheContext.Provider>
    )
}

export const useCacheContext = () => {
    const context = useContext(CacheContext)
    if (!context) {
        throw new Error('useCacheContext must be used within CacheProvider')
    }
    return context
}
