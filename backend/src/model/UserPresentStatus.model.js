import mongoose from 'mongoose';

const userPresentStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    presentStatusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PresentStatus',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userPresentStatusSchema.index({ userId: 1, presentStatusId: 1 }, { unique: true });

export default mongoose.models.UserPresentStatus ||
  mongoose.model('UserPresentStatus', userPresentStatusSchema);
