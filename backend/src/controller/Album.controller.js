import AlbumPhoto from '../model/AlbumPhoto.model.js';
import AlbumComment from '../model/AlbumComment.model.js';
import User from '../model/User.model.js';
import UserRole from '../model/UserRole.model.js';
import UserClass from '../model/UserClass.model.js';
import Role from '../model/Role.model.js';
import uploadOnCloudinary from '../config/cloudinary.config.js';
import { getUserWithRoles, getUserBatchInfo } from '../utils/userHelpers.js';

//* Get all photos with pagination and filtering
const getAllPhotos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const roleFilter = req.query.role || '';
    const batchFilter = req.query.batch || '';
    const skip = (page - 1) * limit;

    // Build base filter object
    const baseFilter = { isActive: true };

    let photosQuery = AlbumPhoto.find(baseFilter)
      .populate(
        'author',
        'name surname profilepic Matriculationbatch Intermediatebatch joiningyear'
      )
      .populate({
        path: 'comments',
        match: { isActive: true },
        options: { sort: { createdAt: -1 }, limit: 5 },
        populate: {
          path: 'author',
          select: 'name surname',
        },
      })
      .sort({ createdAt: -1 });

    // If role filter is provided, filter by author's role
    if (roleFilter) {
      const role = await Role.findOne({ name: roleFilter });
      if (!role) {
        return res.status(200).json({
          message: 'No photos found for the specified role',
          success: true,
          data: {
            photos: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalPhotos: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        });
      }

      const userRoles = await UserRole.find({ roleId: role._id });
      const userIdsWithRole = userRoles.map(ur => ur.userId);

      if (userIdsWithRole.length === 0) {
        return res.status(200).json({
          message: 'No photos found for the specified role',
          success: true,
          data: {
            photos: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalPhotos: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        });
      }

      photosQuery = photosQuery.where('author').in(userIdsWithRole);
    }

    // Execute the query with pagination
    const photos = await photosQuery.skip(skip).limit(limit).lean();

    // Format photos for frontend
    const formattedPhotos = await Promise.all(
      photos.map(async photo => {
        // Get author's role and batch info
        const authorBatchInfo = await getUserBatchInfo(photo.author._id);

        // Get recent comments with author info
        const recentComments = await AlbumComment.find({ photo: photo._id, isActive: true })
          .populate('author', 'name surname')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        const formattedComments = await Promise.all(
          recentComments.map(async comment => {
            const commentAuthorBatchInfo = await getUserBatchInfo(comment.author._id);
            return {
              id: comment._id.toString(), // Add comment ID
              name: `${comment.author.name} ${comment.author.surname}`,
              batch: commentAuthorBatchInfo.batch,
              text: comment.content,
            };
          })
        );

        return {
          id: photo._id.toString(),
          src: photo.image,
          name: `${photo.author.name} ${photo.author.surname}`,
          batch: authorBatchInfo.batch,
          role: authorBatchInfo.role,
          description: photo.description || '',
          likes: photo.likesCount || 0,
          comments: formattedComments,
          createdAt: photo.createdAt,
        };
      })
    );

    // Apply batch filter if provided (client-side filtering for complex batch ranges)
    let filteredPhotos = formattedPhotos;
    if (batchFilter && roleFilter) {
      filteredPhotos = formattedPhotos.filter(photo => {
        if (roleFilter === 'Present Student') {
          return photo.batch === batchFilter;
        } else if (roleFilter === 'Alumni Students') {
          const photoYear = parseInt(photo.batch);
          if (isNaN(photoYear)) return false;

          switch (batchFilter) {
            case '1970 and before':
              return photoYear <= 1970;
            case '1971-1980':
              return photoYear >= 1971 && photoYear <= 1980;
            case '1981-1990':
              return photoYear >= 1981 && photoYear <= 1990;
            case '1991-2000':
              return photoYear >= 1991 && photoYear <= 2000;
            case '2001-2010':
              return photoYear >= 2001 && photoYear <= 2010;
            case '2011-2025':
              return photoYear >= 2011 && photoYear <= 2025;
            default:
              return true;
          }
        }
        return true;
      });
    }

    // Get total count for pagination (without batch filter for accurate pagination)
    let totalCountQuery = AlbumPhoto.countDocuments(baseFilter);

    if (roleFilter) {
      const role = await Role.findOne({ name: roleFilter });
      if (role) {
        const userRoles = await UserRole.find({ roleId: role._id });
        const userIdsWithRole = userRoles.map(ur => ur.userId);
        totalCountQuery = totalCountQuery.where('author').in(userIdsWithRole);
      }
    }

    const totalPhotos = await totalCountQuery;
    const totalPages = Math.ceil(totalPhotos / limit);

    res.status(200).json({
      message: 'Photos fetched successfully',
      success: true,
      data: {
        photos: filteredPhotos,
        pagination: {
          currentPage: page,
          totalPages,
          totalPhotos: filteredPhotos.length, // Use filtered count for display
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while fetching photos',
      success: false,
    });
  }
};

//* Upload new photos
const uploadPhotos = async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.user.userId;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: 'No photos uploaded',
        success: false,
      });
    }

    if (files.length > 5) {
      return res.status(400).json({
        message: 'Maximum 5 photos allowed per upload',
        success: false,
      });
    }

    // Check file sizes
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        return res.status(400).json({
          message: 'Each image must be less than 2MB',
          success: false,
        });
      }
    }

    // Get user details
    const userWithRoles = await getUserWithRoles(userId);
    if (!userWithRoles) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    const { batch, role } = await getUserBatchInfo(userId);

    // Upload all photos to Cloudinary
    const uploadPromises = files.map(file => uploadOnCloudinary(file.buffer));
    const imageUrls = await Promise.all(uploadPromises);

    // Create photo documents
    const newPhotos = await Promise.all(
      imageUrls.map(imageUrl =>
        AlbumPhoto.create({
          image: imageUrl,
          description: description || '',
          author: userId,
        })
      )
    );

    // Get user for name
    const user = await User.findById(userId).select('name surname');

    // Format response
    const formattedPhotos = newPhotos.map(photo => ({
      id: photo._id.toString(),
      src: photo.image,
      name: `${user.name} ${user.surname}`,
      batch: batch,
      role: role,
      description: photo.description,
      likes: 0,
      comments: [],
      createdAt: photo.createdAt,
    }));

    res.status(201).json({
      message: 'Photos uploaded successfully',
      success: true,
      data: {
        photos: formattedPhotos,
      },
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while uploading photos',
      success: false,
    });
  }
};

//* Like/Unlike a photo
const toggleLike = async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.userId;

    const photo = await AlbumPhoto.findById(photoId);
    if (!photo) {
      return res.status(404).json({
        message: 'Photo not found',
        success: false,
      });
    }

    const hasLiked = photo.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      photo.likes = photo.likes.filter(like => like.toString() !== userId);
      photo.likesCount = Math.max(0, photo.likesCount - 1);
    } else {
      // Like
      photo.likes.push(userId);
      photo.likesCount += 1;
    }

    await photo.save();

    res.status(200).json({
      message: hasLiked ? 'Photo unliked' : 'Photo liked',
      success: true,
      data: {
        likes: photo.likesCount,
        hasLiked: !hasLiked,
      },
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while toggling like',
      success: false,
    });
  }
};

//* Add comment to photo
const addComment = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Check if photo exists
    const photo = await AlbumPhoto.findById(photoId);
    if (!photo) {
      return res.status(404).json({
        message: 'Photo not found',
        success: false,
      });
    }

    // Get user batch info
    const { batch } = await getUserBatchInfo(userId);

    // Create comment
    const newComment = await AlbumComment.create({
      content,
      author: userId,
      photo: photoId,
    });

    // Update photo comments count
    photo.commentsCount += 1;
    await photo.save();

    // Get user for name
    const user = await User.findById(userId).select('name surname');

    res.status(201).json({
      message: 'Comment added successfully',
      success: true,
      data: {
        comment: {
          id: newComment._id.toString(), // Add comment ID
          name: `${user.name} ${user.surname}`,
          batch: batch,
          text: newComment.content,
        },
      },
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while adding comment',
      success: false,
    });
  }
};

//* Get comments for a photo
const getComments = async (req, res) => {
  try {
    const { photoId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await AlbumComment.find({ photo: photoId, isActive: true })
      .populate('author', 'name surname')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedComments = await Promise.all(
      comments.map(async comment => {
        const authorBatchInfo = await getUserBatchInfo(comment.author._id);
        return {
          id: comment._id.toString(), // Add comment ID
          name: `${comment.author.name} ${comment.author.surname}`,
          batch: authorBatchInfo.batch,
          text: comment.content,
        };
      })
    );

    const totalComments = await AlbumComment.countDocuments({ photo: photoId, isActive: true });

    res.status(200).json({
      message: 'Comments fetched successfully',
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while fetching comments',
      success: false,
    });
  }
};

//* Delete a photo (Admin only)
const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    // Find and soft delete the photo
    const photo = await AlbumPhoto.findByIdAndUpdate(photoId, { isActive: false }, { new: true });

    if (!photo) {
      return res.status(404).json({
        message: 'Photo not found',
        success: false,
      });
    }

    // Also soft delete all comments associated with this photo
    await AlbumComment.updateMany({ photo: photoId }, { isActive: false });

    res.status(200).json({
      message: 'Photo and associated comments deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while deleting photo',
      success: false,
    });
  }
};

//* Delete a comment (Admin only)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Find and soft delete the comment
    const comment = await AlbumComment.findByIdAndUpdate(
      commentId,
      { isActive: false },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
        success: false,
      });
    }

    // Decrement the comments count on the associated photo
    await AlbumPhoto.findByIdAndUpdate(comment.photo, { $inc: { commentsCount: -1 } });

    res.status(200).json({
      message: 'Comment deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while deleting comment',
      success: false,
    });
  }
};

//* Export controller functions
export {
  getAllPhotos,
  uploadPhotos,
  toggleLike,
  addComment,
  getComments,
  deletePhoto,
  deleteComment,
};
