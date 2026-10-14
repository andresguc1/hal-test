import { useCallback, useRef, useState } from 'react';
import { api } from '@/utils/api';

export function useVectorSearch() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const search = useCallback(async (query, flowId, k = 10) => {
        if (!query.trim() || !flowId) {
            setResults([]);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/vector-cache/search-nodes', {
                query,
                flowId,
                k,
            }, {
                signal: controller.signal,
            });

            if (response.data.success) {
                setResults(response.data.data || []);
            } else {
                setError(response.data.error || 'Search failed');
                setResults([]);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
                setResults([]);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setLoading(false);
            }
        }
    }, []);

    const clear = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return { results, loading, error, search, clear };
}