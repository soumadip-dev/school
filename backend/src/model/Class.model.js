import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
  },
  level: {
    type: String,
    enum: ['Primary', 'Secondary', 'Higher Secondary'],
    required: true,
  },
});

export default mongoose.models.Class || mongoose.model('Class', classSchema);
