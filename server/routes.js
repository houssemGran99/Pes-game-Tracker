import express from 'express';
import jwt from 'jsonwebtoken';
import { put } from '@vercel/blob';
import Player from './models/Player.js';
import Match from './models/Match.js';

import Tournament from './models/Tournament.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

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

// --- Players ---
router.get('/players', async (req, res) => {
    try {
        const players = await Player.find().sort({ createdAt: 1 });
        res.json(players);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/players/:name', requireAdmin, async (req, res) => {
    const oldName = req.params.name;
    const { name: newName, avatarUrl } = req.body;

    try {
        const player = await Player.findOne({ name: oldName });
        if (!player) return res.status(404).json({ message: 'Player not found' });

        // Handle Name Change
        if (newName && newName !== oldName) {
            // Check if new name exists
            const existing = await Player.findOne({ name: newName });
            if (existing) return res.status(400).json({ message: 'Player name already taken' });

            player.name = newName;

            // Cascade update matches
            await Match.updateMany({ playerA: oldName }, { playerA: newName });
            await Match.updateMany({ playerB: oldName }, { playerB: newName });

            // Cascade update tournaments
            await Tournament.updateMany(
                { participants: oldName },
                { $set: { "participants.$": newName } }
            );
            await Tournament.updateMany(
                { winner: oldName },
                { winner: newName }
            );
        }

        // Handle Avatar Update
        if (avatarUrl !== undefined) {
            player.avatarUrl = avatarUrl;
        }

        await player.save();
        res.json(player);
    } catch (err) {
        console.error('Update player error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/upload', requireAdmin, async (req, res) => {
    try {
        if (!req.body.file || !req.body.filename) {
            return res.status(400).json({ message: 'No file provided' });
        }

        // Expected format: data:image/png;base64,....
        const base64Data = req.body.file.split(';base64,').pop();
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${Date.now()}-${req.body.filename}`;

        const blob = await put(filename, buffer, {
            access: 'public',
            token: process.env.pes_READ_WRITE_TOKEN,
        });

        res.json(blob);
    } catch (err) {
        console.error('Upload error:', err);
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

router.delete('/tournaments/:id', requireAdmin, async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        // Optional: Delete associated matches?
        // await Match.deleteMany({ tournamentId: req.params.id });

        res.json({ message: 'Tournament deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
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

        if (req.query.player) {
            const playerRegex = new RegExp(req.query.player, 'i'); // Case-insensitive
            filter.$or = [
                { playerA: playerRegex },
                { playerB: playerRegex }
            ];
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
