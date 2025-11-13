import mongoose from 'mongoose';

const presentStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['retired', 'Working in current organization', 'Working in other organization'],
  },
});

export default mongoose.models.PresentStatus ||
  mongoose.model('PresentStatus', presentStatusSchema);
