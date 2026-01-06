import express from 'express';
import Player from './models/Player.js';
import Match from './models/Match.js';

import Tournament from './models/Tournament.js';

const router = express.Router();

// --- Players ---
router.get('/players', async (req, res) => {
    try {
        const players = await Player.find().sort({ createdAt: 1 });
        res.json(players);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/players', async (req, res) => {
    const { name } = req.body;
    try {
        const newPlayer = new Player({ name });
        await newPlayer.save(); // Unique constraint handles duplicates
        res.status(201).json(newPlayer);
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate
            return res.status(400).json({ message: 'Player already exists' });
        }
        res.status(400).json({ message: err.message });
    }
});

// --- Tournaments ---
router.get('/tournaments', async (req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ startDate: -1 });
        res.json(tournaments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/tournaments', async (req, res) => {
    try {
        const newTournament = new Tournament(req.body);
        const savedTournament = await newTournament.save();
        res.status(201).json(savedTournament);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/tournaments/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
        res.json(tournament);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Matches ---
router.get('/matches', async (req, res) => {
    try {
        const filter = {};
        if (req.query.tournamentId) {
            filter.tournamentId = req.query.tournamentId;
        } else {
            // If expressly asking for global matches (no tournament), pass 'null' or nothing?
            // For now, let's say if NO tournamentId provided, we return ALL matches? 
            // Or should we only return non-tournament matches?
            // Usually "League Table" implies global, but maybe we want to separate?
            // Let's support an explicit "null" check if needed, but for now:
            // if tournamentId is present, filter by it.
            // if not, return all (backward compatibility) OR maybe we want only friendlies?
            // Let's assume if query param `tournamentId` is explicitly 'null', we search for null.
            if (req.query.tournamentId === 'null') {
                filter.tournamentId = null;
            }
        }

        const matches = await Match.find(filter).sort({ date: -1 });
        res.json(matches);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/matches', async (req, res) => {
    try {
        const newMatch = new Match(req.body);
        const savedMatch = await newMatch.save();
        res.status(201).json(savedMatch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
