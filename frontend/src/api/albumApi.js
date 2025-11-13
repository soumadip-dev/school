import axiosInstance from '../utils/axiosInstance';

//* Get all photos with pagination and filtering
export const getAllPhotos = async (page = 1, limit = 6, role = '', batch = '') => {
  try {
    const response = await axiosInstance.get('/api/album/photos', {
      params: { page, limit, role, batch },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Upload new photos
export const uploadPhotos = async formData => {
  try {
    const response = await axiosInstance.post('/api/album/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Like/Unlike a photo
export const toggleLike = async photoId => {
  try {
    const response = await axiosInstance.post(`/api/album/photos/${photoId}/like`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Add comment to photo
export const addComment = async (photoId, content) => {
  try {
    const response = await axiosInstance.post(`/api/album/photos/${photoId}/comments`, {
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

//* Get comments for a photo
export const getComments = async (photoId, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/api/album/photos/${photoId}/comments`, {
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


//* Delete a photo (Admin only)
export const deletePhoto = async photoId => {
  try {
    const response = await axiosInstance.delete(`/api/album/photos/${photoId}`);
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
    const response = await axiosInstance.delete(`/api/album/comments/${commentId}`);
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