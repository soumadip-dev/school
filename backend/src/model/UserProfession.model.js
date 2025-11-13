import mongoose from 'mongoose';

const userProfessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    professionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profession',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userProfessionSchema.index({ userId: 1, professionId: 1 }, { unique: true });

export default mongoose.models.UserProfession ||
  mongoose.model('UserProfession', userProfessionSchema);
