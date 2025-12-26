import { useState, useEffect, useCallback } from 'react';
import { getPaginatedData, getCount } from 'services/firebase';

/**
 * useFirestoreQuery Hook
 * 
 * Fetches data from Firestore with pagination, sorting, and filtering.
 * 
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Object} options
 * @param {number} options.page - Current page (0-indexed)
 * @param {number} options.limit - Items per page
 * @param {Array} options.filters - Array of filter objects { field, operator, value }
 * @param {Object} options.orderBy - { field, direction }
 * @returns {Object} { data, totalCount, loading, error, refresh }
 */
const useFirestoreQuery = (collectionName, { page, limit, filters = [], orderByField = 'createdAt', orderDirection = 'desc' }) => {
    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch Count
            const count = await getCount(collectionName, filters);
            setTotalCount(count);

            // Fetch Data
            // Note: 'page' is 0-indexed. Offset = page * limit.
            // CAUTION: Firestore doesn't support efficient 'offset' for large datasets, 
            // but for typical admin panels (< 10k items), it's acceptable.
            // Ideally we use startAfter, but that requires keeping track of the last doc.
            // For this implementation, we will implement 'getPaginatedData' in firebase.js to handle this.

            // To support specific page jumping without cursor, we might use client-side pagination 
            // OR use 'limit(page * limit + limit)' then slice? No, that's bad.
            // We will use the 'getPaginatedData' which hopefully uses cursors or offset.
            // Since we need "Page numbers" -> "Jump to page 5", we MUST use offset-like behavior.
            // Firestore SDK has 'startAfter' (doc) not index.
            // workaround: We can't easily do "Jump to page 5" without reading 1-4.
            // Decision: We will fetch with simple queries for now. 
            // If the user accepts "Load More" style, cursors are best.
            // But they want "Pagination component" with "Page numbers".
            // We will implement an optimized backend method if possible, or just standard query.

            const results = await getPaginatedData(collectionName, {
                pageSize: limit,
                pageIndex: page, // 0-indexed
                filters,
                orderByField,
                orderDirection
            });

            setData(results);
        } catch (err) {
            console.error("useFirestoreQuery Error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [collectionName, page, limit, JSON.stringify(filters), orderByField, orderDirection, refreshTrigger]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => setRefreshTrigger(prev => prev + 1);

    return { data, totalCount, loading, error, refresh };
};

export default useFirestoreQuery;
