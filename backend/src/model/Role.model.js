import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Admin', 'Alumni Student', 'Alumni Teacher', 'Present Student', 'Present Teacher'],
  },
});

export default mongoose.models.Role || mongoose.model('Role', roleSchema);
