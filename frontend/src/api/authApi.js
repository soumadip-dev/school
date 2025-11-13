import axiosInstance from '../utils/axiosInstance';

//* Login user
export const loginUser = async userData => {
  try {
    const response = await axiosInstance.post('/api/user/login', userData);
    return response.data; // { success: true/false, message: "..." }
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Register user
export const registerUser = async userData => {
  try {
    const response = await axiosInstance.post('/api/user/register', userData, {
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

//* checking if user is logged in
export const isAuthenticated = async () => {
  try {
    const response = await axiosInstance.get('/api/user/is-auth');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Logout user
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post('/api/user/logout');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Get user profile
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get('/api/user/profile');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Update user profile
export const updateUserProfile = async userData => {
  try {
    const response = await axiosInstance.put('/api/user/profile', userData, {
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

export const getAlumniData = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    // Add all filters to params
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        params.append(key, filters[key]);
      }
    });

    const response = await axiosInstance.get(`/api/user/alumni-data?${params.toString()}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

export const getFilterOptions = async () => {
  try {
    const response = await axiosInstance.get('/api/user/filter-options');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Send password reset email
export const sendPasswordResetEmail = async email => {
  try {
    const response = await axiosInstance.post('/api/user/forgot-password', { email });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Reset password with OTP
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await axiosInstance.post('/api/user/reset-password', {
      email,
      otp,
      newPassword,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};
