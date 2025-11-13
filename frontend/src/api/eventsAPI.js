import axiosInstance from '../utils/axiosInstance';

//* Get all events
export const getAllEvents = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/events', { params });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Get single event by ID
export const getEventById = async eventId => {
  try {
    const response = await axiosInstance.get(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Check if user is admin
export const checkAdminStatus = async () => {
  try {
    const response = await axiosInstance.get('/api/admin');
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Create new event (Admin only)
export const createEvent = async eventData => {
  try {
    const response = await axiosInstance.post('/api/events', eventData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Update event (Admin only)
export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await axiosInstance.put(`/api/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};

//* Delete event (Admin only)
export const deleteEvent = async eventId => {
  try {
    const response = await axiosInstance.delete(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error occurred' };
  }
};
