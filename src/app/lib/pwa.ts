
'use client';

import { useEffect } from 'react';

export const usePwa = () => {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            window.workbox !== undefined
        ) {
            const wb = window.workbox;

            // A common UX pattern for PWAs is to show a banner when a new version of the app is available.
            // wb.addEventListener('installed', (event) => {
            //   if (event.isUpdate) {
            //     // Show a "New version available" banner or toast
            //   }
            // });

            wb.register();
        }
    }, []);
};
