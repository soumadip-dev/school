import DiscussionPost from '../model/DiscussionPost.model.js';
import User from '../model/User.model.js';
import { getUserWithRoles } from '../utils/userHelpers.js';

//* Get all discussion posts with pagination
export const getDiscussionPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await DiscussionPost.find({ isActive: true })
      .populate('userId', 'name surname profilepic')
      .populate('replies.userId', 'name surname profilepic')
      .populate('reactions.userId', 'name surname')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform data for frontend
    const transformedPosts = await Promise.all(
      posts.map(async post => {
        const userWithRoles = await getUserWithRoles(post.userId._id);

        return {
          id: post._id.toString(),
          name: post.userId.name,
          surname: post.userId.surname,
          role: userWithRoles.roles[0]?.name || 'User',
          batch: userWithRoles.Matriculationbatch?.toString() || null,
          content: post.content,
          timestamp: post.timestamp.toISOString(),
          reactions: {
            '👍': post.reactions.filter(r => r.emoji === '👍').length,
            '❤️': post.reactions.filter(r => r.emoji === '❤️').length,
            '🙏': post.reactions.filter(r => r.emoji === '🙏').length,
            '🏃': post.reactions.filter(r => r.emoji === '🏃').length,
            '😊': post.reactions.filter(r => r.emoji === '😊').length,
          },
          userReaction:
            post.reactions.find(r => r.userId._id.toString() === req.user?.userId)?.emoji || null,
          replies: post.replies.map(async reply => {
            const replyUserWithRoles = await getUserWithRoles(reply.userId._id);
            return {
              name: reply.userId.name,
              surname: reply.userId.surname,
              role: replyUserWithRoles.roles[0]?.name || 'User',
              batch: replyUserWithRoles.Matriculationbatch?.toString() || null,
              text: reply.text,
              timestamp: reply.timestamp.toISOString(),
            };
          }),
          showReplies: false,
        };
      })
    );

    // Wait for all replies to be processed
    const finalPosts = await Promise.all(
      transformedPosts.map(async post => ({
        ...post,
        replies: await Promise.all(post.replies),
      }))
    );

    const totalPosts = await DiscussionPost.countDocuments({ isActive: true });

    res.status(200).json({
      message: 'Discussion posts fetched successfully',
      success: true,
      data: {
        posts: finalPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          totalItems: totalPosts,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching discussion posts',
      success: false,
    });
  }
};

//* Create a new discussion post
export const createDiscussionPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        message: 'Post content is required',
        success: false,
      });
    }

    const newPost = new DiscussionPost({
      userId,
      content: content.trim(),
    });

    await newPost.save();

    // Populate the new post for response
    const populatedPost = await DiscussionPost.findById(newPost._id)
      .populate('userId', 'name surname profilepic')
      .lean();

    const userWithRoles = await getUserWithRoles(userId);

    const transformedPost = {
      id: populatedPost._id.toString(),
      name: populatedPost.userId.name,
      surname: populatedPost.userId.surname,
      role: userWithRoles.roles[0]?.name || 'User',
      batch: userWithRoles.Matriculationbatch?.toString() || null,
      content: populatedPost.content,
      timestamp: populatedPost.timestamp.toISOString(),
      reactions: { '👍': 0, '❤️': 0, '🙏': 0, '🏃': 0, '😊': 0 },
      replies: [],
      showReplies: false,
    };

    res.status(201).json({
      message: 'Post created successfully',
      success: true,
      data: {
        post: transformedPost,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when creating post',
      success: false,
    });
  }
};

//* Add a reply to a post
export const addReplyToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        message: 'Reply text is required',
        success: false,
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false,
      });
    }

    const newReply = {
      userId,
      text: text.trim(),
    };

    post.replies.push(newReply);
    await post.save();

    // Populate the reply for response
    const updatedPost = await DiscussionPost.findById(postId).populate(
      'replies.userId',
      'name surname profilepic'
    );

    const newReplyData = updatedPost.replies[updatedPost.replies.length - 1];
    const replyUserWithRoles = await getUserWithRoles(userId);

    const transformedReply = {
      name: newReplyData.userId.name,
      surname: newReplyData.userId.surname,
      role: replyUserWithRoles.roles[0]?.name || 'User',
      batch: replyUserWithRoles.Matriculationbatch?.toString() || null,
      text: newReplyData.text,
      timestamp: newReplyData.timestamp.toISOString(),
    };

    res.status(201).json({
      message: 'Reply added successfully',
      success: true,
      data: {
        reply: transformedReply,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when adding reply',
      success: false,
    });
  }
};

//* Add or update reaction to a post
export const addReactionToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const validEmojis = ['👍', '❤️', '🙏', '🏃', '😊'];
    if (!validEmojis.includes(emoji)) {
      return res.status(400).json({
        message: 'Invalid emoji',
        success: false,
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false,
      });
    }

    // Remove existing reaction from this user
    post.reactions = post.reactions.filter(reaction => reaction.userId.toString() !== userId);

    // Add new reaction
    post.reactions.push({
      userId,
      emoji,
    });

    await post.save();

    // Get updated reaction counts
    const reactionCounts = {
      '👍': post.reactions.filter(r => r.emoji === '👍').length,
      '❤️': post.reactions.filter(r => r.emoji === '❤️').length,
      '🙏': post.reactions.filter(r => r.emoji === '🙏').length,
      '🏃': post.reactions.filter(r => r.emoji === '🏃').length,
      '😊': post.reactions.filter(r => r.emoji === '😊').length,
    };

    res.status(200).json({
      message: 'Reaction added successfully',
      success: true,
      data: {
        reactions: reactionCounts,
        userReaction: emoji,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when adding reaction',
      success: false,
    });
  }
};

//* Remove reaction from a post
export const removeReactionFromPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false,
      });
    }

    // Remove user's reaction
    const initialLength = post.reactions.length;
    post.reactions = post.reactions.filter(reaction => reaction.userId.toString() !== userId);

    if (post.reactions.length === initialLength) {
      return res.status(404).json({
        message: 'No reaction found to remove',
        success: false,
      });
    }

    await post.save();

    // Get updated reaction counts
    const reactionCounts = {
      '👍': post.reactions.filter(r => r.emoji === '👍').length,
      '❤️': post.reactions.filter(r => r.emoji === '❤️').length,
      '🙏': post.reactions.filter(r => r.emoji === '🙏').length,
      '🏃': post.reactions.filter(r => r.emoji === '🏃').length,
      '😊': post.reactions.filter(r => r.emoji === '😊').length,
    };

    res.status(200).json({
      message: 'Reaction removed successfully',
      success: true,
      data: {
        reactions: reactionCounts,
        userReaction: null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when removing reaction',
      success: false,
    });
  }
};
