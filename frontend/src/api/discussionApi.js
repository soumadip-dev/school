import axiosInstance from '../utils/axiosInstance';

//* Get discussion posts with pagination
export const getDiscussionPosts = async (page = 1, limit = 20) => {
  try {
    const response = await axiosInstance.get(`/api/discussion/posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Create a new discussion post
export const createDiscussionPost = async content => {
  try {
    const response = await axiosInstance.post('/api/discussion/posts', { content });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Add reply to a post
export const addReplyToPost = async (postId, text) => {
  try {
    const response = await axiosInstance.post(`/api/discussion/posts/${postId}/replies`, { text });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Add reaction to a post
export const addReactionToPost = async (postId, emoji) => {
  try {
    const response = await axiosInstance.post(`/api/discussion/posts/${postId}/reactions`, {
      emoji,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Remove reaction from a post
export const removeReactionFromPost = async postId => {
  try {
    const response = await axiosInstance.delete(`/api/discussion/posts/${postId}/reactions`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};
