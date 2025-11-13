import axiosInstance from '../utils/axiosInstance';

//* Get all lectures
export const getAllLectures = async () => {
  try {
    const response = await axiosInstance.get('/api/lecture/lectures');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Create lecture (Admin only)
export const createLecture = async lectureData => {
  try {
    const formData = new FormData();

    // Append all fields to FormData
    Object.keys(lectureData).forEach(key => {
      if (key === 'image' && lectureData[key] instanceof File) {
        formData.append('image', lectureData[key]);
      } else {
        formData.append(key, lectureData[key]);
      }
    });

    const response = await axiosInstance.post('/api/lecture/lectures', formData, {
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

//* Update lecture (Admin only)
export const updateLecture = async (lectureId, lectureData) => {
  try {
    const formData = new FormData();

    // Append all fields to FormData
    Object.keys(lectureData).forEach(key => {
      if (key === 'image' && lectureData[key] instanceof File) {
        formData.append('image', lectureData[key]);
      } else {
        formData.append(key, lectureData[key]);
      }
    });

    const response = await axiosInstance.put(`/api/lecture/lectures/${lectureId}`, formData, {
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

//* Delete lecture (Admin only)
export const deleteLecture = async lectureId => {
  try {
    const response = await axiosInstance.delete(`/api/lecture/lectures/${lectureId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Mark lecture as completed (Admin only)
export const markAsCompleted = async lectureId => {
  try {
    const response = await axiosInstance.patch(`/api/lecture/lectures/${lectureId}/complete`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};
