import mongoose from 'mongoose';

const userClassSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userClassSchema.index({ userId: 1, classId: 1 }, { unique: true });

export default mongoose.models.UserClass || mongoose.model('UserClass', userClassSchema);
