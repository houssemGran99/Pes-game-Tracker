import mongoose from 'mongoose';

const TournamentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    participants: [{ type: String }], // Array of player names
    startDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
});

export default mongoose.model('Tournament', TournamentSchema);
