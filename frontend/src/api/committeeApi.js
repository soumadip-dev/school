import axiosInstance from '../utils/axiosInstance';

//* Get all committees
export const getAllCommittees = async () => {
  try {
    const response = await axiosInstance.get('/api/committee/committees');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Submit idea to committee
export const submitIdea = async (committeeId, content) => {
  try {
    const response = await axiosInstance.post(`/api/committee/committees/${committeeId}/ideas`, {
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

//* Get committee ideas
export const getCommitteeIdeas = async (committeeId, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`/api/committee/committees/${committeeId}/ideas`, {
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

//* Create committee (Admin only)
export const createCommittee = async committeeData => {
  try {
    const response = await axiosInstance.post('/api/committee/committees', committeeData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Update committee (Admin only)
export const updateCommittee = async (committeeId, committeeData) => {
  try {
    const response = await axiosInstance.put(
      `/api/committee/committees/${committeeId}`,
      committeeData
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Delete committee (Admin only)
export const deleteCommittee = async committeeId => {
  try {
    const response = await axiosInstance.delete(`/api/committee/committees/${committeeId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Delete idea (Admin only)
export const deleteIdea = async ideaId => {
  try {
    const response = await axiosInstance.delete(`/api/committee/ideas/${ideaId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Get all users for committee management (Admin only)
export const getAllUsersForCommittee = async () => {
  try {
    const response = await axiosInstance.get('/api/committee/committees/users/all');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Add users to committee (Admin only)
export const addUsersToCommittee = async (committeeId, userIds) => {
  try {
    const response = await axiosInstance.post(`/api/committee/committees/${committeeId}/members`, {
      userIds,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Remove user from committee (Admin only)
export const removeUserFromCommittee = async (committeeId, userId) => {
  try {
    const response = await axiosInstance.delete(
      `/api/committee/committees/${committeeId}/members/${userId}`
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};
