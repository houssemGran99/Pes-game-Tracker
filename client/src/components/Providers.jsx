'use client';

import { MatchProvider } from '../context/MatchContext';
import { AuthProvider } from '../context/AuthContext';

export function Providers({ children }) {
    return (
        <AuthProvider>
            <MatchProvider>
                {children}
            </MatchProvider>
        </AuthProvider>
    );
}
