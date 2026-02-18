import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type ListParams } from '../api/client'
import type { Stats, Status, PaginatedResponse } from '../types'

export function useEntries(filters?: ListParams) {
  const [data, setData] = useState<PaginatedResponse>({ data: [], total: 0, page: 1, page_size: 10 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.entries.list(filtersRef.current)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [
    filters?.status, filters?.severity, filters?.search,
    filters?.group, filters?.page, filters?.page_size,
    refresh,
  ])

  return { entries: data.data, total: data.total, page: data.page, pageSize: data.page_size, loading, error, refresh }
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.entries.stats()
      setStats(data)
    } catch {
      // stats are non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { stats, loading, refresh }
}

export function useStatuses() {
  const [statuses, setStatuses] = useState<Status[]>([])

  useEffect(() => {
    api.statuses.list().then(setStatuses).catch(() => {})
  }, [])

  return statuses
}

export function useSSE(onEvent: () => void) {
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  useEffect(() => {
    const es = new EventSource('/api/v1/events')

    es.onmessage = (e) => {
      if (e.data === 'connected') return
      callbackRef.current()
    }

    es.onerror = () => {
      // Auto-reconnects by default
    }

    return () => es.close()
  }, [])
}
