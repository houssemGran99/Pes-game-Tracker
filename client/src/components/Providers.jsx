'use client';

import { MatchProvider } from '../context/MatchContext';

export function Providers({ children }) {
    return (
        <MatchProvider>
            {children}
        </MatchProvider>
    );
}
