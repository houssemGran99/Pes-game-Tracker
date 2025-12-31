import express from 'express';
import Player from './models/Player.js';
import Match from './models/Match.js';

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

// --- Matches ---
router.get('/matches', async (req, res) => {
    try {
        const matches = await Match.find().sort({ date: -1 });
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
