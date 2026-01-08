import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    avatarUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Player', PlayerSchema);
