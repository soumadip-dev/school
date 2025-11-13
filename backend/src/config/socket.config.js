import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from './env.config.js';
import User from '../model/User.model.js';
import DiscussionPost from '../model/DiscussionPost.model.js';
import { getUserWithRoles } from '../utils/userHelpers.js';

const configureSocket = server => {
  const io = new Server(server, {
    cors: {
      origin: ENV.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', socket => {
    console.log(`User connected: ${socket.userId}`);

    // Join discussion room
    socket.join('discussion-room');

    // Handle new post
    socket.on('new-post', async postData => {
      try {
        const newPost = new DiscussionPost({
          userId: socket.userId,
          content: postData.content,
        });

        await newPost.save();

        const populatedPost = await DiscussionPost.findById(newPost._id)
          .populate('userId', 'name surname profilepic')
          .lean();

        const userWithRoles = await getUserWithRoles(socket.userId);

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

        io.to('discussion-room').emit('post-created', transformedPost);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create post' });
      }
    });

    // Handle new reply
    socket.on('new-reply', async replyData => {
      try {
        const { postId, text } = replyData;

        const post = await DiscussionPost.findById(postId);
        if (!post) {
          return socket.emit('error', { message: 'Post not found' });
        }

        const newReply = {
          userId: socket.userId,
          text: text.trim(),
        };

        post.replies.push(newReply);
        await post.save();

        const updatedPost = await DiscussionPost.findById(postId).populate(
          'replies.userId',
          'name surname profilepic'
        );

        const newReplyData = updatedPost.replies[updatedPost.replies.length - 1];
        const replyUserWithRoles = await getUserWithRoles(socket.userId);

        const transformedReply = {
          name: newReplyData.userId.name,
          surname: newReplyData.userId.surname,
          role: replyUserWithRoles.roles[0]?.name || 'User',
          batch: replyUserWithRoles.Matriculationbatch?.toString() || null,
          text: newReplyData.text,
          timestamp: newReplyData.timestamp.toISOString(),
        };

        io.to('discussion-room').emit('reply-added', {
          postId,
          reply: transformedReply,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to add reply' });
      }
    });

    // Handle reaction
    socket.on('reaction', async reactionData => {
      try {
        const { postId, emoji } = reactionData;

        const post = await DiscussionPost.findById(postId);
        if (!post) {
          return socket.emit('error', { message: 'Post not found' });
        }

        // Remove existing reaction from this user
        post.reactions = post.reactions.filter(
          reaction => reaction.userId.toString() !== socket.userId.toString()
        );

        // Add new reaction
        post.reactions.push({
          userId: socket.userId,
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

        io.to('discussion-room').emit('reaction-updated', {
          postId,
          reactions: reactionCounts,
          userId: socket.userId.toString(),
          emoji,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update reaction' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export default configureSocket;
