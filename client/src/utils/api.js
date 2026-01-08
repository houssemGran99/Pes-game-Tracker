const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiRequest = async (url, options = {}) => {
    // Dispatch loading start
    const headers = { ...options.headers };

    // Check for auth token
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-loading', { detail: true }));

        try {
            const userStr = localStorage.getItem('pes6_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.token) {
                    headers['Authorization'] = `Bearer ${user.token}`;
                }
            }
        } catch (e) {
            // ignore
        }
    }

    try {
        const res = await fetch(url, { ...options, headers });
        return res;
    } finally {
        // Dispatch loading end
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('api-loading', { detail: false }));
        }
    }
};

export const login = async (username, password) => {
    try {
        const res = await apiRequest(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        return { ...data.user, token: data.token };
    } catch (error) {
        console.error('Login Error:', error);
        return null;
    }
};

export const fetchPlayers = async () => {
    try {
        const res = await apiRequest(`${API_URL}/players`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch players');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

export const createPlayer = async (name) => {
    const res = await apiRequest(`${API_URL}/players`, {
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
        const res = await apiRequest(`${API_URL}/tournaments`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch tournaments');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

export const createTournament = async (tournamentData) => {
    const res = await apiRequest(`${API_URL}/tournaments`, {
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
        const res = await apiRequest(`${API_URL}/tournaments/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch tournament');
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
};

export const updateTournament = async (id, data) => {
    const res = await apiRequest(`${API_URL}/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update tournament');
    }
    return await res.json();
};

export const deleteTournament = async (id) => {
    const res = await apiRequest(`${API_URL}/tournaments/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete tournament');
    return await res.json();
};

export const fetchMatches = async (tournamentId = null, page = null, limit = null, player = null) => {
    try {
        let url = `${API_URL}/matches`;
        const params = new URLSearchParams();

        if (tournamentId) params.append('tournamentId', tournamentId);
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (player) params.append('player', player);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const res = await apiRequest(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch matches');

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

export const submitMatch = async (matchData) => {
    const res = await apiRequest(`${API_URL}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
    });
    if (!res.ok) throw new Error('Failed to submit match');
    return await res.json();
};

export const updateMatch = async (id, updateData) => {
    const res = await apiRequest(`${API_URL}/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update match');
    return await res.json();
};

export const deleteMatch = async (id) => {
    const res = await apiRequest(`${API_URL}/matches/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete match');
    return await res.json();
};
