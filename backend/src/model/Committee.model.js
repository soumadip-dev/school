import mongoose from 'mongoose';

const committeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for better performance
committeeSchema.index({ name: 1 });
committeeSchema.index({ isActive: 1 });
committeeSchema.index({ 'members.user': 1 });
committeeSchema.index({ createdBy: 1 });

const Committee = mongoose.models.Committee || mongoose.model('Committee', committeeSchema);

export default Committee;
