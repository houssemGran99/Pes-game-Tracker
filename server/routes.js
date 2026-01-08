import express from 'express';
import jwt from 'jsonwebtoken';
import Player from './models/Player.js';
import Match from './models/Match.js';

import Tournament from './models/Tournament.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

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

// Auth Middleware
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access only' });
        }

        req.user = user;
        next();
    });
};

// --- Auth ---
router.post('/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === process.env.ADMIN_SECRET) {
        const user = { role: 'admin', username: 'Admin' };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

        return res.json({
            success: true,
            user,
            token
        });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
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

router.post('/tournaments', requireAdmin, async (req, res) => {
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

router.put('/tournaments/:id', requireAdmin, async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
        res.json(tournament);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Matches ---
router.get('/matches', async (req, res) => {
    try {
        const filter = {};
        if (req.query.tournamentId) {
            if (req.query.tournamentId === 'null') {
                filter.tournamentId = null;
            } else {
                filter.tournamentId = req.query.tournamentId;
            }
        }

        // Check if pagination is requested
        if (req.query.page) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const totalMatches = await Match.countDocuments(filter);
            const matches = await Match.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit);

            const totalPages = Math.ceil(totalMatches / limit);

            return res.json({
                matches,
                totalPages,
                currentPage: page,
                totalMatches
            });
        } else {
            // Return all matches
            const matches = await Match.find(filter).sort({ date: -1 });
            return res.json(matches);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/matches', requireAdmin, async (req, res) => {
    try {
        const newMatch = new Match(req.body);
        const savedMatch = await newMatch.save();
        res.status(201).json(savedMatch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/matches/:id', requireAdmin, async (req, res) => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);
        if (!match) return res.status(404).json({ message: 'Match not found' });
        res.json({ message: 'Match deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/matches/:id', requireAdmin, async (req, res) => {
    try {
        const { scoreA, scoreB } = req.body;
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: 'Match not found' });

        if (scoreA !== undefined) match.scoreA = scoreA;
        if (scoreB !== undefined) match.scoreB = scoreB;

        const updatedMatch = await match.save();
        res.json(updatedMatch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
