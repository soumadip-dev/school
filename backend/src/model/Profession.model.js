import mongoose from 'mongoose';

const professionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    enum: ['Academic', 'Corporate', 'Government', 'Healthcare', 'Creative', 'Other'],
    required: true,
  },
});

export default mongoose.models.Profession || mongoose.model('Profession', professionSchema);
