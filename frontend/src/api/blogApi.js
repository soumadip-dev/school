import axiosInstance from '../utils/axiosInstance';

//* Get all posts with pagination and filtering
export const getAllPosts = async (page = 1, limit = 20, role = '') => {
  try {
    const response = await axiosInstance.get('/api/blog/posts', {
      params: { page, limit, role },
    });
    console.log(response.data);

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Create a new post
export const createPost = async postData => {
  try {
    const response = await axiosInstance.post('/api/blog/posts', postData);
    console.log(response.data);

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    console.log(error);

    return { success: false, message: 'Network error occurred' };
  }
};

//* Like/Unlike a post
export const toggleLike = async postId => {
  try {
    const response = await axiosInstance.post(`/api/blog/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Add comment to post
export const addComment = async (postId, content) => {
  try {
    const response = await axiosInstance.post(`/api/blog/posts/${postId}/comments`, {
      content,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Get comments for a post
export const getComments = async (postId, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/api/blog/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Delete a blog post (Admin only)
export const deletePost = async postId => {
  try {
    const response = await axiosInstance.delete(`/api/blog/posts/${postId}`);
    console.log(response.data);

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    console.log(error);

    return { success: false, message: 'Network error occurred' };
  }
};

//* Delete a comment (Admin only)
export const deleteComment = async commentId => {
  try {
    const response = await axiosInstance.delete(`/api/blog/comments/${commentId}`);
    console.log(response.data);

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    console.log(error);

    return { success: false, message: 'Network error occurred' };
  }
};
