import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    image: {
      type: String, // Cloudinary URL
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    speaker: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    batch: {
      type: String,
      trim: true,
    },
    videoLink: {
      type: String,
      trim: true,
    },
    youtubeId: {
      type: String,
      trim: true,
    },
    isUpcoming: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for better performance
lectureSchema.index({ isUpcoming: -1, date: 1 });
lectureSchema.index({ isActive: 1 });
lectureSchema.index({ createdAt: -1 });

// Virtual for formatted date
lectureSchema.virtual('formattedDate').get(function () {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Ensure virtual fields are serialized
lectureSchema.set('toJSON', { virtuals: true });
lectureSchema.set('toObject', { virtuals: true });

const Lecture = mongoose.models.Lecture || mongoose.model('Lecture', lectureSchema);

export default Lecture;
