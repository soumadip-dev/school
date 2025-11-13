import mongoose from 'mongoose';

const albumPhotoSchema = new mongoose.Schema(
  {
    image: {
      type: String, // Cloudinary URL
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for better performance
albumPhotoSchema.index({ author: 1, createdAt: -1 });
albumPhotoSchema.index({ likesCount: -1, createdAt: -1 });

// Virtual for comments
albumPhotoSchema.virtual('comments', {
  ref: 'AlbumComment',
  localField: '_id',
  foreignField: 'photo',
});

// Ensure virtual fields are serialized
albumPhotoSchema.set('toJSON', { virtuals: true });
albumPhotoSchema.set('toObject', { virtuals: true });

const AlbumPhoto = mongoose.models.AlbumPhoto || mongoose.model('AlbumPhoto', albumPhotoSchema);

export default AlbumPhoto;
