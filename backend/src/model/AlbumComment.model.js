import mongoose from 'mongoose';

const albumCommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    photo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AlbumPhoto',
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
albumCommentSchema.index({ photo: 1, createdAt: -1 });
albumCommentSchema.index({ author: 1, createdAt: -1 });

const AlbumComment =
  mongoose.models.AlbumComment || mongoose.model('AlbumComment', albumCommentSchema);

export default AlbumComment;
