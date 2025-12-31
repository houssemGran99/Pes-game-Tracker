import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
    playerA: { type: String, required: true },
    playerB: { type: String, required: true },
    scoreA: { type: Number, required: true },
    scoreB: { type: Number, required: true },
    goalEvents: { type: Array, default: [] }, // [{ player: 'A' or 'B', time: ... }]
    date: { type: Date, default: Date.now }
});

export default mongoose.model('Match', MatchSchema);
