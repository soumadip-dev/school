import Post from '../model/BlogPost.model.js';
import Comment from '../model/BlogComment.model.js';
import User from '../model/User.model.js';
import UserRole from '../model/UserRole.model.js';
import UserClass from '../model/UserClass.model.js';
import UserProfession from '../model/UserProfession.model.js';
import UserPresentStatus from '../model/UserPresentStatus.model.js';
import Role from '../model/Role.model.js';
import Class from '../model/Class.model.js';
import { getUserWithRoles, getUserBatchInfo } from '../utils/userHelpers.js';

//* Get all posts with pagination and filtering
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const roleFilter = req.query.role || '';
    const skip = (page - 1) * limit;

    // Build base filter object
    const baseFilter = { isActive: true };

    // First, get all posts with the base filter
    let postsQuery = Post.find(baseFilter)
      .populate(
        'author',
        'name surname profilepic Matriculationbatch Intermediatebatch joiningyear'
      )
      .populate({
        path: 'comments',
        match: { isActive: true },
        options: { sort: { createdAt: -1 }, limit: 10 },
        populate: {
          path: 'author',
          select: 'name surname',
        },
      })
      .sort({ createdAt: -1 });

    // If role filter is provided, we need to filter posts by author's role
    if (roleFilter) {
      // First, find all users with the specified role
      const role = await Role.findOne({ name: roleFilter });
      if (!role) {
        return res.status(200).json({
          message: 'No posts found for the specified role',
          success: true,
          data: {
            posts: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalPosts: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        });
      }

      // Get all user IDs with this role
      const userRoles = await UserRole.find({ roleId: role._id });
      const userIdsWithRole = userRoles.map(ur => ur.userId);

      // If no users have this role, return empty result
      if (userIdsWithRole.length === 0) {
        return res.status(200).json({
          message: 'No posts found for the specified role',
          success: true,
          data: {
            posts: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalPosts: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        });
      }

      // Add author filter to the query
      postsQuery = postsQuery.where('author').in(userIdsWithRole);
    }

    // Execute the query with pagination
    const posts = await postsQuery.skip(skip).limit(limit).lean();

    // Format posts for frontend
    const formattedPosts = await Promise.all(
      posts.map(async post => {
        // Get author's role and batch info
        const authorBatchInfo = await getUserBatchInfo(post.author._id);

        // Get recent comments with author info
        const recentComments = await Comment.find({ post: post._id, isActive: true })
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
          id: post._id.toString(),
          title: post.title,
          author: `${post.author.name} ${post.author.surname}`,
          batch: authorBatchInfo.batch,
          role: authorBatchInfo.role,
          content: post.content,
          likes: post.likesCount || 0,
          comments: formattedComments.reverse(), // Reverse to show oldest first
          createdAt: post.createdAt,
        };
      })
    );

    // Get total count for pagination (with the same filters)
    let totalCountQuery = Post.countDocuments(baseFilter);

    if (roleFilter) {
      const role = await Role.findOne({ name: roleFilter });
      if (role) {
        const userRoles = await UserRole.find({ roleId: role._id });
        const userIdsWithRole = userRoles.map(ur => ur.userId);
        totalCountQuery = totalCountQuery.where('author').in(userIdsWithRole);
      }
    }

    const totalPosts = await totalCountQuery;
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      message: 'Posts fetched successfully',
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while fetching posts',
      success: false,
    });
  }
};

//* Create a new post
const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;

    // Get user details with roles
    const userWithRoles = await getUserWithRoles(userId);
    if (!userWithRoles) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    // Get batch info
    const { batch, role } = await getUserBatchInfo(userId);

    // Create new post
    const newPost = await Post.create({
      title,
      content,
      author: userId,
    });

    // Get user for name
    const user = await User.findById(userId).select('name surname');

    res.status(201).json({
      message: 'Post created successfully',
      success: true,
      data: {
        post: {
          id: newPost._id,
          title: newPost.title,
          author: `${user.name} ${user.surname}`,
          batch: batch,
          role: role,
          content: newPost.content,
          likes: 0,
          comments: [],
          createdAt: newPost.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while creating post',
      success: false,
    });
  }
};

//* Like/Unlike a post
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false,
      });
    }

    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      post.likes = post.likes.filter(like => like.toString() !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      post.likes.push(userId);
      post.likesCount += 1;
    }

    await post.save();

    res.status(200).json({
      message: hasLiked ? 'Post unliked' : 'Post liked',
      success: true,
      data: {
        likes: post.likesCount,
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

//* Add comment to post
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false,
      });
    }

    // Get user batch info
    const { batch } = await getUserBatchInfo(userId);

    // Create comment
    const newComment = await Comment.create({
      content,
      author: userId,
      post: postId,
    });

    // Update post comments count
    post.commentsCount += 1;
    await post.save();

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

//* Get comments for a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId, isActive: true })
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

    const totalComments = await Comment.countDocuments({ post: postId, isActive: true });

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

//* Delete a blog post (Admin only)
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find and soft delete the post
    const post = await Post.findByIdAndUpdate(postId, { isActive: false }, { new: true });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false,
      });
    }

    // Also soft delete all comments associated with this post
    await Comment.updateMany({ post: postId }, { isActive: false });

    res.status(200).json({
      message: 'Post and associated comments deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while deleting post',
      success: false,
    });
  }
};

//* Delete a comment (Admin only)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Find and soft delete the comment
    const comment = await Comment.findByIdAndUpdate(commentId, { isActive: false }, { new: true });

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
        success: false,
      });
    }

    // Decrement the comments count on the associated post
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

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
export { getAllPosts, createPost, toggleLike, addComment, getComments, deletePost, deleteComment };
