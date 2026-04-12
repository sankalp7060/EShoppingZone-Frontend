import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * A hook to manage tab state synced with URL search parameters.
 * @param {string} paramName - The name of the URL search parameter (e.g., 'tab').
 * @param {string} defaultTab - The default tab if the parameter is missing.
 * @returns {[string, function]} - The current tab and a function to set it.
 */
export const useTabState = (paramName = 'tab', defaultTab = 'overview') => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get current tab from URL or fallback
    const currentTab = searchParams.get(paramName) || defaultTab;

    const setTab = useCallback((newTab) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (newTab === defaultTab) {
                next.delete(paramName);
            } else {
                next.set(paramName, newTab);
            }
            return next;
        }, { replace: true });
    }, [paramName, defaultTab, setSearchParams]);

    return [currentTab, setTab];
};
