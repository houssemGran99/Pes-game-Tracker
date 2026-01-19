import mongoose from 'mongoose';

const TournamentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    participants: [{ type: String }], // Array of player names
    startDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    maxPoints: { type: Number, default: null }, // Points needed to win automatically
    winner: { type: String, default: null },
    theme: { type: String, default: 'classic' }, // classic, champions, world_cup, retro, neon
    type: { type: String, enum: ['league', 'knockout'], default: 'league' },
    rounds: { type: mongoose.Schema.Types.Mixed, default: [] } // For knockout structure
});

export default mongoose.model('Tournament', TournamentSchema);
