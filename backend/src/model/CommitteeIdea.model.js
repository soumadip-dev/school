import mongoose from 'mongoose';

const committeeIdeaSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200, // ~200 words
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    committee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
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
committeeIdeaSchema.index({ committee: 1, createdAt: -1 });
committeeIdeaSchema.index({ author: 1, createdAt: -1 });
committeeIdeaSchema.index({ isActive: 1 });

const CommitteeIdea =
  mongoose.models.CommitteeIdea || mongoose.model('CommitteeIdea', committeeIdeaSchema);

export default CommitteeIdea;
