const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const fetchPlayers = async () => {
    try {
        const res = await fetch(`${API_URL}/players`, { cache: 'no-store' });
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


export const fetchTournaments = async () => {
    try {
        const res = await fetch(`${API_URL}/tournaments`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch tournaments');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

export const createTournament = async (tournamentData) => {
    const res = await fetch(`${API_URL}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournamentData),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create tournament');
    }
    return await res.json();
};

export const fetchTournament = async (id) => {
    try {
        const res = await fetch(`${API_URL}/tournaments/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch tournament');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
};

export const fetchMatches = async (tournamentId = null, page = 1, limit = 10) => {
    try {
        let url = `${API_URL}/matches?page=${page}&limit=${limit}`;
        if (tournamentId) {
            url += `&tournamentId=${tournamentId}`;
        }
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch matches');

        const data = await res.json();
        // Return full pagination object if available, else assume array (legacy fallback if needed)
        if (Array.isArray(data)) {
            return { matches: data, totalPages: 1, currentPage: 1 };
        }
        return data; // { matches, totalPages, currentPage, totalMatches }
    } catch (error) {
        console.error('API Error:', error);
        return { matches: [], totalPages: 0, currentPage: 1 };
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

export const updateMatch = async (id, updateData) => {
    const res = await fetch(`${API_URL}/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update match');
    return await res.json();
};

export const deleteMatch = async (id) => {
    const res = await fetch(`${API_URL}/matches/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete match');
    return await res.json();
};
