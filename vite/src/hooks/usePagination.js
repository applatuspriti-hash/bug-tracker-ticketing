import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * usePagination Hook
 * 
 * Manages pagination state and optionally syncs with URL search params.
 * 
 * @param {Object} options
 * @param {number} options.defaultPage - Default page number (0-indexed)
 * @param {number} options.defaultLimit - Default items per page
 * @param {boolean} options.syncWithUrl - Whether to sync state with URL query params
 * @returns {Object} { page, limit, setPage, setLimit, handleChangePage, handleChangeRowsPerPage }
 */
const usePagination = ({ defaultPage = 0, defaultLimit = 10, syncWithUrl = true } = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state from URL if enabled, otherwise use defaults
    const getInitialPage = () => {
        if (syncWithUrl) {
            const pageParam = searchParams.get('page');
            // URL page is usually 1-indexed for users, but MUI is 0-indexed
            return pageParam ? parseInt(pageParam, 10) - 1 : defaultPage;
        }
        return defaultPage;
    };

    const getInitialLimit = () => {
        if (syncWithUrl) {
            const limitParam = searchParams.get('limit');
            return limitParam ? parseInt(limitParam, 10) : defaultLimit;
        }
        return defaultLimit;
    };

    const [page, setPage] = useState(getInitialPage);
    const [limit, setLimit] = useState(getInitialLimit);

    // Sync state with URL when page/limit changes
    useEffect(() => {
        if (syncWithUrl) {
            const params = new URLSearchParams(searchParams);
            params.set('page', (page + 1).toString()); // Store as 1-indexed
            params.set('limit', limit.toString());
            setSearchParams(params, { replace: true });
        }
    }, [page, limit, syncWithUrl]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setLimit(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page on limit change
    };

    return {
        page,
        limit,
        setPage,
        setLimit,
        handleChangePage,
        handleChangeRowsPerPage
    };
};

export default usePagination;
