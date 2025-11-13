import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAllPosts,
  createPost,
  toggleLike,
  addComment,
  deletePost,
  deleteComment,
} from '../api/blogApi';
import { useAuthStore } from '../store/authStore'; // Adjust path as needed
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [loading, setLoading] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [pagination, setPagination] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    isLoading: false,
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    content: ''
  });
  const location = useLocation();

  // Get auth state from store
  const { isAdmin, checkAuth } = useAuthStore();

  const POSTS_PER_PAGE = 20;

  const colors = [
    '#D81B60',
    '#1E88E5',
    '#FBC02D',
    '#4CAF50',
    '#8E24AA',
    '#E65100',
    '#039BE5',
    '#C2185B',
  ];

  // Validation functions
  const validateTitle = (title) => {
    if (!title.trim()) {
      return 'Title is required';
    }
    if (title.trim().length < 5) {
      return 'Title must be at least 5 characters long';
    }
    if (title.trim().length > 100) {
      return 'Title must be less than 100 characters';
    }
    return '';
  };

  const validateContent = (content) => {
    if (!content.trim()) {
      return 'Content is required';
    }
    if (content.trim().length < 10) {
      return 'Content must be at least 10 characters long';
    }
    if (content.trim().length > 5000) {
      return 'Content must be less than 5000 characters';
    }
    return '';
  };

  const validateForm = () => {
    const titleError = validateTitle(newBlogTitle);
    const contentError = validateContent(newBlogContent);
    
    setFormErrors({
      title: titleError,
      content: contentError
    });

    return !titleError && !contentError;
  };

  // Modal handlers
  const showModal = config => {
    setModalConfig({
      isOpen: true,
      type: config.type || 'info',
      title: config.title,
      message: config.message,
      onConfirm: config.onConfirm,
      confirmText: config.confirmText || 'Confirm',
      isLoading: false,
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleModalConfirm = async () => {
    if (modalConfig.onConfirm) {
      setModalConfig(prev => ({ ...prev, isLoading: true }));
      await modalConfig.onConfirm();
      closeModal();
    }
  };

  // Check authentication and admin status on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
    };

    initializeAuth();
  }, [checkAuth]);

  // Fetch posts from backend
  const fetchPosts = async (page = 1, role = '') => {
    setLoading(true);
    try {
      const result = await getAllPosts(page, POSTS_PER_PAGE, role);
      if (result.success) {
        setPosts(result.data.posts);
        setFilteredPosts(result.data.posts);
        setPagination(result.data.pagination);
      } else {
        console.error('Failed to fetch posts:', result.message);
        toast.error('Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  // Initialize posts and handle filter/page changes
  useEffect(() => {
    fetchPosts(currentPage, roleFilter);
  }, [currentPage, roleFilter]);

  const togglePost = postId => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    setActionLoading(prev => ({ ...prev, [`like-${postId}`]: true }));

    try {
      const result = await toggleLike(postId);
      if (result.success) {
        // Update both posts and filteredPosts
        const updatePost = post =>
          post.id === postId ? { ...post, likes: result.data.likes } : post;
        setPosts(prevPosts => prevPosts.map(updatePost));
        setFilteredPosts(prevPosts => prevPosts.map(updatePost));
        toast.success('Like updated successfully');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      fetchPosts(currentPage, roleFilter);
      toast.error('Error updating like');
    } finally {
      setActionLoading(prev => ({ ...prev, [`like-${postId}`]: false }));
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleCommentSubmit = async (postId, e) => {
    e.stopPropagation();
    const commentText = commentInputs[postId]?.trim();
    if (commentText) {
      setActionLoading(prev => ({ ...prev, [`comment-${postId}`]: true }));

      try {
        const result = await addComment(postId, commentText);
        if (result.success) {
          const newComment = result.data.comment;
          const updatePost = post =>
            post.id === postId ? { ...post, comments: [newComment, ...post.comments] } : post;

          setPosts(prevPosts => prevPosts.map(updatePost));
          setFilteredPosts(prevPosts => prevPosts.map(updatePost));

          setCommentInputs(prev => ({
            ...prev,
            [postId]: '',
          }));
          toast.success('Comment added successfully');
        }
      } catch (error) {
        console.error('Error adding comment:', error);
        fetchPosts(currentPage, roleFilter);
        toast.error('Error adding comment');
      } finally {
        setActionLoading(prev => ({ ...prev, [`comment-${postId}`]: false }));
      }
    }
  };

  const handleNewBlogSubmit = async e => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    if (newBlogTitle.trim() && newBlogContent.trim()) {
      setCreatingPost(true);
      try {
        const result = await createPost({
          title: newBlogTitle,
          content: newBlogContent,
        });

        if (result.success) {
          const newPost = result.data.post;
          setPosts(prev => [newPost, ...prev]);
          setFilteredPosts(prev => [newPost, ...prev]);
          setNewBlogTitle('');
          setNewBlogContent('');
          setFormErrors({ title: '', content: '' });
          toast.success('Blog post created successfully!');

          // If there's an active filter, refetch to maintain consistency
          if (roleFilter) {
            fetchPosts(1, roleFilter);
          }
        } else {
          toast.error(result.message || 'Failed to create post');
        }
      } catch (error) {
        console.error('Error creating post:', error);
        toast.error('Error creating post');
      } finally {
        setCreatingPost(false);
      }
    } else {
      toast.error('Please fill in both title and content');
    }
  };

  // Delete post function
  const handleDeletePost = async postId => {
    setActionLoading(prev => ({ ...prev, [`delete-post-${postId}`]: true }));

    try {
      const result = await deletePost(postId);
      if (result.success) {
        // Remove post from state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        setFilteredPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

        toast.success('Post deleted successfully');
      } else {
        toast.error(`Failed to delete post: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-post-${postId}`]: false }));
    }
  };

  // Delete comment function
  const handleDeleteComment = async (postId, commentId) => {
    setActionLoading(prev => ({ ...prev, [`delete-comment-${commentId}`]: true }));

    try {
      const result = await deleteComment(commentId);
      if (result.success) {
        // Remove comment from state
        const updatedPosts = posts.map(post => {
          if (post.id === postId) {
            const updatedComments = post.comments.filter(comment => comment.id !== commentId);
            return { ...post, comments: updatedComments };
          }
          return post;
        });

        setPosts(updatedPosts);
        setFilteredPosts(updatedPosts);

        toast.success('Comment deleted successfully');
      } else {
        toast.error(`Failed to delete comment: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Error deleting comment. Please try again.');
      // Refresh posts to restore original state
      fetchPosts(currentPage, roleFilter);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-comment-${commentId}`]: false }));
    }
  };

  // Post delete handler with modal
  const handleDeletePostClick = (postId, e) => {
    e.stopPropagation();
    showModal({
      type: 'danger',
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: () => handleDeletePost(postId),
    });
  };

  // Comment delete handler with modal
  const handleDeleteCommentClick = (postId, commentId, e) => {
    e.stopPropagation();
    showModal({
      type: 'danger',
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      onConfirm: () => handleDeleteComment(postId, commentId),
    });
  };

  const handleKeyPress = (postId, e) => {
    if (e.key === 'Enter') {
      handleCommentSubmit(postId, e);
    }
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // Real-time validation for title
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setNewBlogTitle(value);
    
    if (value.trim()) {
      const error = validateTitle(value);
      setFormErrors(prev => ({ ...prev, title: error }));
    } else {
      setFormErrors(prev => ({ ...prev, title: '' }));
    }
  };

  // Real-time validation for content
  const handleContentChange = (e) => {
    const value = e.target.value;
    setNewBlogContent(value);
    
    if (value.trim()) {
      const error = validateContent(value);
      setFormErrors(prev => ({ ...prev, content: error }));
    } else {
      setFormErrors(prev => ({ ...prev, content: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0f7] font-sans text-gray-800">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full">
        <section className="bg-white rounded-xl shadow-md p-4 sm:p-8 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#004D40] mb-4 sm:mb-0 text-center sm:text-left">
              Time Machine
            </h2>
            {isAdmin && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Admin Mode
              </div>
            )}
          </div>

          {/* Filter Section */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="w-full sm:w-auto">
              <label
                htmlFor="roleFilter"
                className="font-semibold text-gray-700 mr-2 block mb-1 sm:inline"
              >
                Filter by Role:
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={e => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                className="w-full sm:w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">All Roles</option>
                <option value="Alumni Student">Alumni Students</option>
                <option value="Alumni Teacher">Alumni Teachers</option>
                <option value="Present Student">Present Student</option>
                <option value="Present Teacher">Present Teacher</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 mt-2 sm:mt-0">
              {loading
                ? 'Loading...'
                : `Showing ${filteredPosts.length} posts${roleFilter ? ` (${roleFilter})` : ''}`}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004D40] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading posts...</p>
            </div>
          )}

          {/* Blog List */}
          {!loading && (
            <div className="space-y-4 sm:space-y-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => {
                  const randomColor = colors[Math.floor(Math.random() * colors.length)];
                  const roleTag =
                    post.role === 'Alumni Student' || post.role === 'Present Student'
                      ? `${post.author} (${post.batch})`
                      : `${post.author} - ${post.role}`;

                  return (
                    <div
                      key={post.id}
                      className="p-4 sm:p-6 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-300 hover:shadow-md bg-white relative group"
                      onClick={() => togglePost(post.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <h3
                          className="text-lg sm:text-xl font-bold mb-1 flex-1"
                          style={{ color: randomColor }}
                        >
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                            {post.role}
                          </div>
                          {/* Admin Delete Button for Post - Moved under role */}
                          {isAdmin && (
                            <button
                              onClick={e => handleDeletePostClick(post.id, e)}
                              disabled={actionLoading[`delete-post-${post.id}`]}
                              className="bg-white text-red-600 p-2 rounded-lg hover:bg-red-50 border border-red-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-10 shadow-sm hover:shadow-md hover:scale-105"
                              title="Delete Post"
                            >
                              {actionLoading[`delete-post-${post.id}`] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">Posted by {roleTag}</div>

                      {expandedPosts[post.id] && (
                        <div className="pt-4 border-t border-gray-100 animate-fadeIn">
                          <div className="text-gray-700 mb-6 whitespace-pre-wrap leading-relaxed text-base">
                            {post.content}
                          </div>

                          <div className="flex items-center gap-4 mb-6">
                            <button
                              onClick={e => handleLike(post.id, e)}
                              disabled={actionLoading[`like-${post.id}`]}
                              className="flex items-center gap-2 text-[#004D40] font-semibold hover:text-[#00332E] transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[`like-${post.id}`] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#004D40]"></div>
                              ) : (
                                <span className="text-lg">👍</span>
                              )}
                              Like
                            </button>
                            <span className="text-gray-600 font-medium">{post.likes} Likes</span>
                          </div>

                          {/* Comments Section */}
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="font-semibold text-gray-700 mb-3">
                              Comments ({post.comments.length})
                            </h4>
                            <div className="space-y-3 mb-4">
                              {post.comments.map(comment => (
                                <div
                                  key={comment.id}
                                  className="text-sm p-3 bg-gray-50 rounded-lg relative group/comment hover:bg-gray-100 transition-colors duration-200"
                                >
                                  <strong className="text-[#004D40]">
                                    {comment.name} ({comment.batch})
                                  </strong>
                                  <span className="text-gray-700 ml-2">{comment.text}</span>

                                  {/* Admin Delete Button for Comment - Improved Design */}
                                  {isAdmin && (
                                    <button
                                      onClick={e =>
                                        handleDeleteCommentClick(post.id, comment.id, e)
                                      }
                                      disabled={actionLoading[`delete-comment-${comment.id}`]}
                                      className="absolute top-2 right-2 bg-white text-red-500 p-1.5 rounded-md hover:bg-red-50 border border-red-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover/comment:opacity-100 focus:opacity-100 hover:scale-110"
                                      title="Delete Comment"
                                    >
                                      {actionLoading[`delete-comment-${comment.id}`] ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                                      ) : (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4">
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={e => handleCommentChange(post.id, e.target.value)}
                                onKeyPress={e => handleKeyPress(post.id, e)}
                                onClick={e => e.stopPropagation()}
                                disabled={actionLoading[`comment-${post.id}`]}
                                className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 disabled:opacity-50"
                              />
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCommentSubmit(post.id, e);
                                }}
                                disabled={
                                  actionLoading[`comment-${post.id}`] ||
                                  !commentInputs[post.id]?.trim()
                                }
                                className="w-full sm:w-auto bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00332E] transition-colors duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading[`comment-${post.id}`] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <>
                                    <span>Post</span>
                                    <span>➤</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">No Blogs Found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {roleFilter
                      ? `No blogs found for ${roleFilter}. Try changing the filter or be the first to post!`
                      : 'There are no blogs to display yet. Be the first one to share your thoughts and experiences!'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2.5 rounded-lg transition-all duration-200 font-medium min-w-[100px] ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#004D40] text-white hover:bg-[#00332E] shadow-sm hover:shadow-md'
                }`}
              >
                Previous
              </button>

              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let page;
                if (pagination.totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2.5 rounded-lg transition-all duration-200 font-medium min-w-[44px] ${
                      page === currentPage
                        ? 'bg-[#00332E] text-white shadow-md'
                        : 'bg-[#004D40] text-white hover:bg-[#00332E] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`px-4 py-2.5 rounded-lg transition-all duration-200 font-medium min-w-[100px] ${
                  currentPage === pagination.totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#004D40] text-white hover:bg-[#00332E] shadow-sm hover:shadow-md'
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* New Blog Form */}
          <div className="mt-12 pt-8 border-t border-gray-300">
            <h3 className="text-2xl font-bold text-[#004D40] mb-6 text-center sm:text-left">
              Post a New Blog
            </h3>
            <form onSubmit={handleNewBlogSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div>
                <input
                  type="text"
                  value={newBlogTitle}
                  onChange={handleTitleChange}
                  placeholder="Blog Title"
                  required
                  className={`w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-lg font-medium ${
                    formErrors.title 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-[#004D40]'
                  }`}
                />
                {formErrors.title && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.title}
                  </p>
                )}
                <div className="text-right text-xs text-gray-500 mt-1">
                  {newBlogTitle.length}/100 characters
                </div>
              </div>
              
              <div>
                <textarea
                  value={newBlogContent}
                  onChange={handleContentChange}
                  rows="6"
                  placeholder="Write your blog content..."
                  required
                  className={`w-full px-5 py-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-vertical leading-relaxed ${
                    formErrors.content 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-[#004D40]'
                  }`}
                />
                {formErrors.content && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.content}
                  </p>
                )}
                <div className="text-right text-xs text-gray-500 mt-1">
                  {newBlogContent.length}/5000 characters
                </div>
              </div>
              
              <button
                type="submit"
                disabled={creatingPost || formErrors.title || formErrors.content}
                className="w-full sm:w-auto bg-[#004D40] text-white px-8 py-3.5 rounded-lg font-bold hover:bg-[#00332E] transition-colors duration-200 shadow-md hover:shadow-lg text-lg flex items-center justify-center gap-2 mx-auto disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
              >
                {creatingPost ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Posting...
                  </>
                ) : (
                  <span>Submit Blog</span>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        isLoading={modalConfig.isLoading}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Blog;