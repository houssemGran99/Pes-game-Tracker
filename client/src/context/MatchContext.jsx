'use client';
import { createContext, useContext, useReducer, useEffect } from 'react';
import { fetchPlayers, createPlayer } from '../utils/api';

// Initial state
const initialState = {
    // Current screen
    screen: 'home', // home, newMatch, liveMatch, matchEnd, history, stats
    screenParams: null,

    // Match data
    currentMatch: null,

    // Players list
    players: [],

    // Tournaments
    currentTournament: null,
};

// Action types
const ACTIONS = {
    SET_SCREEN: 'SET_SCREEN',
    START_MATCH: 'START_MATCH',
    ADD_GOAL: 'ADD_GOAL',
    UNDO_GOAL: 'UNDO_GOAL',
    END_MATCH: 'END_MATCH',
    RESET_MATCH: 'RESET_MATCH',
    ADD_PLAYER: 'ADD_PLAYER',
    INIT_PLAYERS: 'INIT_PLAYERS',
    SET_TOURNAMENT: 'SET_TOURNAMENT',
};

// Reducer
function matchReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_SCREEN:
            if (typeof action.payload === 'object' && action.payload.name) {
                return { ...state, screen: action.payload.name, screenParams: action.payload.params };
            }
            return { ...state, screen: action.payload, screenParams: null };

        case ACTIONS.SET_TOURNAMENT:
            return { ...state, currentTournament: action.payload };

        case ACTIONS.INIT_PLAYERS:
            return { ...state, players: action.payload };

        case ACTIONS.ADD_PLAYER: {
            const newPlayer = action.payload;
            if (state.players.includes(newPlayer)) return state;
            return {
                ...state,
                players: [...state.players, newPlayer]
            };
        }

        case ACTIONS.START_MATCH:
            return {
                ...state,
                screen: 'liveMatch',
                currentMatch: {
                    playerA: action.payload.playerA,
                    playerB: action.payload.playerB,
                    tournamentId: action.payload.tournamentId || (state.currentTournament ? state.currentTournament._id : null),
                    scoreA: 0,
                    scoreB: 0,
                    goalEvents: [],
                },
            };

        case ACTIONS.ADD_GOAL: {
            const player = action.payload; // 'A' or 'B'
            const scoreKey = player === 'A' ? 'scoreA' : 'scoreB';
            return {
                ...state,
                currentMatch: {
                    ...state.currentMatch,
                    [scoreKey]: state.currentMatch[scoreKey] + 1,
                    goalEvents: [
                        ...state.currentMatch.goalEvents,
                        { player },
                    ],
                },
            };
        }

        case ACTIONS.UNDO_GOAL: {
            if (state.currentMatch.goalEvents.length === 0) return state;

            const lastEvent = state.currentMatch.goalEvents[state.currentMatch.goalEvents.length - 1];
            const scoreKey = lastEvent.player === 'A' ? 'scoreA' : 'scoreB';

            return {
                ...state,
                currentMatch: {
                    ...state.currentMatch,
                    [scoreKey]: Math.max(0, state.currentMatch[scoreKey] - 1),
                    goalEvents: state.currentMatch.goalEvents.slice(0, -1),
                },
            };
        }

        case ACTIONS.END_MATCH:
            return { ...state, screen: 'matchEnd' };

        case ACTIONS.RESET_MATCH:
            // return to tournament screen if we were in one, else home
            // Actually, keep it simple: go to 'matchEnd' -> save -> then decide where to go.
            // But resetMatch usually goes "Home". 
            // If we are in a tournament, we probably want to go back to tournament detail.
            // Let's modify this in the hook action wrapper or components instead if needed.
            // For now, simple reset to home is default behavior, but let's check current screen flow.
            // We usually call resetMatch ONE time after saving. 
            // If currentTournament is set, maybe we should set screen to 'tournamentDetail' instead of 'home'?

            const nextScreen = state.currentTournament ? 'tournamentDetail' : 'home';
            return {
                ...state,
                screen: nextScreen,
                currentMatch: null,
            };

        default:
            return state;
    }
}

// Context
const MatchContext = createContext(null);

// Provider component
export function MatchProvider({ children }) {
    const [state, dispatch] = useReducer(matchReducer, initialState);

    // Initial Fetch
    useEffect(() => {
        const loadPlayers = async () => {
            const players = await fetchPlayers();
            // Assuming API returns array of objects with name
            const names = players.map(p => p.name);
            dispatch({ type: ACTIONS.INIT_PLAYERS, payload: names });
        };
        loadPlayers();
    }, []);

    const actions = {
        setScreen: (screen, params = null) => {
            if (screen === 'home') {
                // Clear tournament when going home
                dispatch({ type: ACTIONS.SET_TOURNAMENT, payload: null });
            }
            if (params) {
                dispatch({ type: ACTIONS.SET_SCREEN, payload: { name: screen, params } });
            } else {
                dispatch({ type: ACTIONS.SET_SCREEN, payload: screen });
            }
        },
        setTournament: (tournament) => dispatch({ type: ACTIONS.SET_TOURNAMENT, payload: tournament }),
        startMatch: (matchData) => dispatch({ type: ACTIONS.START_MATCH, payload: matchData }),
        addGoal: (player) => dispatch({ type: ACTIONS.ADD_GOAL, payload: player }),
        undoGoal: () => dispatch({ type: ACTIONS.UNDO_GOAL }),
        endMatch: () => dispatch({ type: ACTIONS.END_MATCH }),
        resetMatch: () => dispatch({ type: ACTIONS.RESET_MATCH }),

        addPlayer: async (name) => {
            try {
                const newPlayer = await createPlayer(name);
                dispatch({ type: ACTIONS.ADD_PLAYER, payload: newPlayer.name });
            } catch (err) {
                console.error("Failed to add player", err);
                alert("Failed to add player: " + err.message);
            }
        },
    };

    return (
        <MatchContext.Provider value={{ state, actions }}>
            {children}
        </MatchContext.Provider>
    );
}

// Custom hook
export function useMatch() {
    const context = useContext(MatchContext);
    if (!context) {
        throw new Error('useMatch must be used within a MatchProvider');
    }
    return context;
}
