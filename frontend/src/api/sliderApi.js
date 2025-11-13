import axiosInstance from '../utils/axiosInstance';

//* Get all slider images
export const getSliderImages = async () => {
  try {
    const response = await axiosInstance.get('/api/slider');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Get all slider images for admin
export const getAllSliderImages = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/slider/admin/all', { params });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Add single slider image (Admin only)
export const addSliderImage = async formData => {
  try {
    const response = await axiosInstance.post('/api/slider', formData, {
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

//* Add multiple slider images (Admin only)
export const addMultipleSliderImages = async formData => {
  try {
    const response = await axiosInstance.post('/api/slider/multiple', formData, {
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

//* Update slider image (Admin only)
export const updateSliderImage = async (sliderId, formData) => {
  try {
    const response = await axiosInstance.put(`/api/slider/${sliderId}`, formData, {
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

//* Delete slider image (Admin only)
export const deleteSliderImage = async sliderId => {
  try {
    const response = await axiosInstance.delete(`/api/slider/${sliderId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Reorder slider images (Admin only)
export const reorderSliderImages = async orderUpdates => {
  try {
    const response = await axiosInstance.put('/api/slider/reorder/all', { orderUpdates });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};
