import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  createDiscussionPost,
  getDiscussionPosts,
  addReplyToPost,
  addReactionToPost,
  removeReactionFromPost,
} from '../api/discussionApi';
import socketService from '../utils/socket';

const Discuss = () => {
  const { user, isAdmin } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyInputs, setReplyInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const chatContainerRef = useRef(null);

  // Load initial posts
  useEffect(() => {
    loadPosts();
    setupSocket();

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  const setupSocket = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      socketService.connect(token);

      // Listen for new posts from other users
      socketService.onPostCreated(newPost => {
        setPosts(prev => [newPost, ...prev]);
      });

      // Listen for new replies from other users
      socketService.onReplyAdded(({ postId, reply }) => {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? {
                  ...post,
                  replies: [...post.replies, reply],
                  showReplies: true,
                }
              : post
          )
        );
      });

      // Listen for reaction updates from other users
      socketService.onReactionUpdated(({ postId, reactions, userId }) => {
        if (userId === user?._id) return; // Don't update if it's our own reaction

        setPosts(prev => prev.map(post => (post.id === postId ? { ...post, reactions } : post)));
      });

      socketService.onError(error => {
        console.error('Socket error:', error);
      });
    }
  };

  const loadPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await getDiscussionPosts(pageNum, 20);

      if (result.success) {
        const newPosts = result.data.posts.map(post => ({
          ...post,
          showReplies: false,
        }));

        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        setHasMore(pageNum < result.data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1);
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMorePosts();
      }
    }
  };

  const formatDateTime = isoString => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatName = post => {
    return `${post.name} ${post.surname || ''} ${
      post.role === 'Alumni Student'
        ? '(' + (post.batch || '') + ')'
        : post.role === 'Alumni Teacher'
        ? '(Ex Teacher)'
        : post.role === 'Present Student'
        ? post.batch || ''
        : post.role === 'Present Teacher'
        ? '(Present Teacher)'
        : ''
    }`;
  };

  const handleReaction = async (postId, emoji) => {
    try {
      const post = posts.find(p => p.id === postId);
      const currentReaction = post.userReaction;

      // Optimistic update
      setPosts(prev =>
        prev.map(post => {
          if (post.id === postId) {
            const newReactions = { ...post.reactions };

            if (currentReaction === emoji) {
              // Remove reaction
              newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1);
              return {
                ...post,
                reactions: newReactions,
                userReaction: null,
              };
            } else {
              // Add new reaction - remove previous if exists
              if (currentReaction) {
                newReactions[currentReaction] = Math.max(
                  0,
                  (newReactions[currentReaction] || 0) - 1
                );
              }
              newReactions[emoji] = (newReactions[emoji] || 0) + 1;
              return {
                ...post,
                reactions: newReactions,
                userReaction: emoji,
              };
            }
          }
          return post;
        })
      );

      // API call
      if (currentReaction === emoji) {
        await removeReactionFromPost(postId);
      } else {
        await addReactionToPost(postId, emoji);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      // Revert optimistic update on error
      loadPosts(1); // Reload to get correct state
    }
  };

  const toggleReplies = postId => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, showReplies: !post.showReplies } : post
      )
    );
  };

  const handleReplyChange = (postId, text) => {
    setReplyInputs(prev => ({ ...prev, [postId]: text }));
  };

  const submitReply = async postId => {
    const replyText = replyInputs[postId]?.trim();
    if (!replyText) return;

    try {
      const post = posts.find(p => p.id === postId);

      // Optimistic update
      const optimisticReply = {
        name: user?.name || 'Current',
        surname: user?.surname || 'User',
        role: user?.roles?.[0]?.name || 'Present Student',
        batch: user?.Matriculationbatch?.toString() || 'Class X',
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                replies: [...post.replies, optimisticReply],
                showReplies: true,
              }
            : post
        )
      );

      setReplyInputs(prev => ({ ...prev, [postId]: '' }));

      // API call
      const result = await addReplyToPost(postId, replyText);
      if (!result.success) {
        console.error('Failed to add reply:', result.message);
        // Revert optimistic update on error
        loadPosts(1); // Reload to get correct state
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      loadPosts(1); // Reload to get correct state
    }
  };

  const submitNewPost = async () => {
    const text = newMessage.trim();
    if (!text) return;

    try {
      // Optimistic update
      const optimisticPost = {
        id: `temp-${Date.now()}`,
        name: user?.name || 'Current',
        surname: user?.surname || 'User',
        role: user?.roles?.[0]?.name || 'Present Student',
        batch: user?.Matriculationbatch?.toString() || 'Class X',
        content: text,
        timestamp: new Date().toISOString(),
        reactions: { '👍': 0, '❤️': 0, '🙏': 0, '🏃': 0, '😊': 0 },
        replies: [],
        showReplies: false,
        userReaction: null,
        isOptimistic: true,
      };

      setPosts(prev => [optimisticPost, ...prev]);
      setNewMessage('');

      // API call
      const result = await createDiscussionPost(text);
      if (!result.success) {
        console.error('Failed to create post:', result.message);
        // Remove optimistic post on error
        setPosts(prev => prev.filter(post => post.id !== optimisticPost.id));
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      // Remove optimistic post on error
      setPosts(prev => prev.filter(post => !post.isOptimistic));
    }
  };

  const handleKeyPress = (e, postId = null) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (postId) {
        submitReply(postId);
      } else {
        submitNewPost();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans text-gray-800 leading-relaxed">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#004D40] mb-4 sm:mb-6">
            Alumni Group Discussion
          </h2>

          {/* Chat Container */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="max-w-4xl mx-auto max-h-[70vh] overflow-y-auto scroll-smooth border border-gray-200 rounded-lg bg-white"
          >
            {posts.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-500">
                No discussion posts yet. Be the first to start a conversation!
              </div>
            ) : (
              <>
                {posts.map(post => (
                  <div
                    key={post.id}
                    className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      post.isOptimistic ? 'opacity-70' : ''
                    }`}
                  >
                    {/* Post Meta */}
                    <div className="text-sm text-gray-600 mb-2">
                      {formatName(post)} • {formatDateTime(post.timestamp)}
                      {post.isOptimistic && ' (Posting...)'}
                    </div>

                    {/* Post Content */}
                    <div className="text-gray-800 mb-3">{post.content}</div>

                    {/* Reactions */}
                    <div className="flex gap-3 mb-3">
                      {Object.entries(post.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(post.id, emoji)}
                          disabled={post.isOptimistic}
                          className={`flex items-center gap-1 text-lg hover:scale-110 transition-transform ${
                            post.userReaction === emoji ? 'ring-2 ring-[#004D40] rounded-full' : ''
                          } ${post.isOptimistic ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {emoji}
                          <span className="text-sm text-gray-600">{count}</span>
                        </button>
                      ))}
                    </div>

                    {/* Reply Toggle */}
                    <button
                      onClick={() => toggleReplies(post.id)}
                      disabled={post.isOptimistic}
                      className="text-[#004D40] text-sm underline hover:text-[#00796B] transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {post.showReplies ? 'Hide Replies' : `Reply (${post.replies.length})`}
                    </button>

                    {/* Replies Section */}
                    {post.showReplies && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-300">
                        {post.replies.map((reply, index) => (
                          <div key={index} className="mb-3 text-sm">
                            <strong>{formatName(reply)}</strong> • {formatDateTime(reply.timestamp)}
                            : {reply.text}
                          </div>
                        ))}

                        {/* Reply Input */}
                        <div className="flex gap-2 mt-3">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyInputs[post.id] || ''}
                            onChange={e => handleReplyChange(post.id, e.target.value)}
                            onKeyPress={e => handleKeyPress(e, post.id)}
                            disabled={post.isOptimistic}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent disabled:opacity-50"
                          />
                          <button
                            onClick={() => submitReply(post.id)}
                            disabled={post.isOptimistic || !replyInputs[post.id]?.trim()}
                            className="px-4 py-2 bg-[#004D40] text-white text-sm font-medium rounded-lg hover:bg-[#00796B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="p-4 text-center text-gray-500">Loading more posts...</div>
                )}

                {!hasMore && posts.length > 0 && (
                  <div className="p-4 text-center text-gray-500">No more posts to load</div>
                )}
              </>
            )}
          </div>

          {/* New Message Section */}
          <div className="mt-6 pt-6 border-t border-gray-300">
            <h3 className="text-lg sm:text-xl font-bold text-[#004D40] mb-4">Post a New Message</h3>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write your message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent resize-vertical min-h-[100px] text-sm sm:text-base"
            />
            <button
              onClick={submitNewPost}
              disabled={!newMessage.trim()}
              className="mt-3 px-6 py-3 bg-[#004D40] text-white font-bold rounded-lg hover:bg-[#00796B] transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Message
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Discuss;
