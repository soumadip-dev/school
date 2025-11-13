import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    icon: {
      type: String,
      default: 'faUsers', // Default FontAwesome icon
    },
  },
  { timestamps: true }
);

// Index for efficient querying by date and status
eventSchema.index({ date: 1, status: 1 });

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
