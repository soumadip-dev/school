import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Jalpaiguri Zilla School',
    },
    subtitle: {
      type: String,
      default: 'Celebrating 150 Years of Excellence',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
sliderSchema.index({ order: 1, isActive: 1 });

export default mongoose.models.Slider || mongoose.model('Slider', sliderSchema);
