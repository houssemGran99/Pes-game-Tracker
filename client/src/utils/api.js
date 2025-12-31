const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const fetchPlayers = async () => {
    try {
        const res = await fetch(`${API_URL}/players`);
        if (!res.ok) throw new Error('Failed to fetch players');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

export const createPlayer = async (name) => {
    const res = await fetch(`${API_URL}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create player');
    }
    return await res.json();
};

export const fetchMatches = async () => {
    try {
        const res = await fetch(`${API_URL}/matches`);
        if (!res.ok) throw new Error('Failed to fetch matches');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

export const submitMatch = async (matchData) => {
    const res = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
    });
    if (!res.ok) throw new Error('Failed to submit match');
    return await res.json();
};
