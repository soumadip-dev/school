import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faRunning,
  faPalette,
  faLaptopCode,
  faFlask,
  faChevronDown,
  faCalendar,
  faPlus,
  faTimes,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../api/eventsAPI';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const Event = () => {
  const [eventsData, setEventsData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    status: 'upcoming',
    icon: 'faMicrophone',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    isLoading: false,
  });

  // Get auth state from store
  const { isAdmin, checkAuth } = useAuthStore();

  // Map icon names to actual icons
  const iconMap = {
    faMicrophone: faMicrophone,
    faRunning: faRunning,
    faPalette: faPalette,
    faLaptopCode: faLaptopCode,
    faFlask: faFlask,
    faCalendar: faCalendar,
  };

  const iconOptions = [
    { value: 'faMicrophone', label: 'Microphone', icon: faMicrophone },
    { value: 'faFlask', label: 'Flask', icon: faFlask },
    { value: 'faRunning', label: 'Running', icon: faRunning },
    { value: 'faPalette', label: 'Palette', icon: faPalette },
    { value: 'faLaptopCode', label: 'Laptop Code', icon: faLaptopCode },
  ];

  const eventColors = [
    '#D81B60',
    '#1E88E5',
    '#FBC02D',
    '#4CAF50',
    '#8E24AA',
    '#E65100',
    '#039BE5',
    '#C2185B',
  ];

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

  // Validation functions
  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Event name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Event name must be at least 3 characters long';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Event name must be less than 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Event description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    // Date validation
    if (!formData.date) {
      errors.date = 'Event date and time is required';
    } else {
      const selectedDate = new Date(formData.date);
      const now = new Date();
      
      if (selectedDate <= now) {
        errors.date = 'Event date must be in the future';
      }
      
      // Check if date is too far in the future (optional)
      const maxDate = new Date();
      maxDate.setFullYear(now.getFullYear() + 2); // 2 years from now
      if (selectedDate > maxDate) {
        errors.date = 'Event date cannot be more than 2 years in the future';
      }
    }

    // Status validation
    if (!formData.status) {
      errors.status = 'Event status is required';
    }

    // Icon validation
    if (!formData.icon) {
      errors.icon = 'Event icon is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time validation for specific fields
  const validateField = (name, value) => {
    const errors = { ...formErrors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Event name is required';
        } else if (value.trim().length < 3) {
          errors.name = 'Event name must be at least 3 characters long';
        } else if (value.trim().length > 100) {
          errors.name = 'Event name must be less than 100 characters';
        } else {
          delete errors.name;
        }
        break;

      case 'description':
        if (!value.trim()) {
          errors.description = 'Event description is required';
        } else if (value.trim().length < 10) {
          errors.description = 'Description must be at least 10 characters long';
        } else if (value.trim().length > 500) {
          errors.description = 'Description must be less than 500 characters';
        } else {
          delete errors.description;
        }
        break;

      case 'date':
        if (!value) {
          errors.date = 'Event date and time is required';
        } else {
          const selectedDate = new Date(value);
          const now = new Date();
          
          if (selectedDate <= now) {
            errors.date = 'Event date must be in the future';
          } else {
            const maxDate = new Date();
            maxDate.setFullYear(now.getFullYear() + 2);
            if (selectedDate > maxDate) {
              errors.date = 'Event date cannot be more than 2 years in the future';
            } else {
              delete errors.date;
            }
          }
        }
        break;

      case 'status':
        if (!value) {
          errors.status = 'Event status is required';
        } else {
          delete errors.status;
        }
        break;

      case 'icon':
        if (!value) {
          errors.icon = 'Event icon is required';
        } else {
          delete errors.icon;
        }
        break;

      default:
        break;
    }

    setFormErrors(errors);
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check authentication and admin status via store
        await checkAuth();

        // Fetch events
        await fetchEvents();
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Error loading events');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [checkAuth]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsResponse = await getAllEvents();
      if (eventsResponse.success) {
        const groupedEvents = groupEventsByMonth(eventsResponse.data.events);
        setEventsData(groupedEvents);
      } else {
        console.error('Failed to fetch events:', eventsResponse.message);
        toast.error('Failed to load events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const groupEventsByMonth = events => {
    const grouped = {};

    events.forEach(event => {
      const date = new Date(event.date);
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }

      grouped[monthYear].push({
        id: event._id,
        icon: iconMap[event.icon] || faCalendar,
        title: event.name,
        description: event.description,
        date: formatDate(event.date),
        status: event.status,
        rawDate: event.date,
        originalData: event, // Store original event data for editing
      });
    });

    // Convert to array format and sort by date
    return Object.keys(grouped)
      .map(month => ({
        month,
        events: grouped[month].sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate)),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.events[0].rawDate);
        const dateB = new Date(b.events[0].rawDate);
        return dateA - dateB;
      });
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = getDaySuffix(day);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();

    return `${day}${suffix} ${month} ${year}`;
  };

  const formatDateForInput = dateString => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const getDaySuffix = day => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const getRandomColor = () => {
    return eventColors[Math.floor(Math.random() * eventColors.length)];
  };

  const handleEventClick = event => {
    setSelectedEvent(event);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  const handleAddEventClick = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      date: '',
      status: 'upcoming',
      icon: 'faMicrophone',
    });
    setFormErrors({});
    setShowEventForm(true);
  };

  const handleEditEvent = event => {
    setIsEditing(true);
    setFormData({
      name: event.title,
      description: event.description,
      date: formatDateForInput(event.rawDate),
      status: event.status,
      icon: Object.keys(iconMap).find(key => iconMap[key] === event.icon) || 'faMicrophone',
    });
    setFormErrors({});
    setSelectedEvent(event);
    setShowEventForm(true);
  };

  const handleFormClose = () => {
    setShowEventForm(false);
    setFormData({
      name: '',
      description: '',
      date: '',
      status: 'upcoming',
      icon: 'faMicrophone',
    });
    setFormErrors({});
    setIsEditing(false);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Validate field in real-time
    validateField(name, value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validate entire form before submission
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setFormLoading(true);

    try {
      let response;

      if (isEditing) {
        response = await updateEvent(selectedEvent.id, formData);
      } else {
        response = await createEvent(formData);
      }

      if (response.success) {
        toast.success(`Event ${isEditing ? 'updated' : 'created'} successfully!`);
        await fetchEvents();
        handleFormClose();
        if (isEditing) {
          closeEventModal();
        }
      } else {
        toast.error(response.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Network error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async eventId => {
    try {
      const response = await deleteEvent(eventId);
      if (response.success) {
        toast.success('Event deleted successfully!');
        await fetchEvents();
        closeEventModal();
      } else {
        toast.error(response.message || 'Failed to delete event');
      }
    } catch (error) {
      toast.error('Error deleting event');
    }
  };

  const handleDeleteClick = (event, e) => {
    e.stopPropagation();
    showModal({
      type: 'danger',
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: () => handleDeleteEvent(event.id),
    });
  };

  // Helper function to check if form can be submitted
  const canSubmit = () => {
    return (
      formData.name.trim() &&
      formData.description.trim() &&
      formData.date &&
      formData.status &&
      formData.icon &&
      Object.keys(formErrors).length === 0
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004D40] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 w-full">
        <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#004D40] text-center sm:text-left">
              150 Years Event Calendar
            </h2>

            {isAdmin && (
              <button
                onClick={handleAddEventClick}
                className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00796B] transition-colors duration-200 font-semibold flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add New Event
              </button>
            )}
          </div>

          <div className="bg-[#e0f2f1] border-l-4 border-[#004D40] p-4 sm:p-5 rounded-lg mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <p className="font-bold text-base sm:text-lg text-gray-800 text-center sm:text-left">
              🎉 Explore our upcoming events! Click on any event to see details.
              {isAdmin && ' You have admin privileges to manage events.'}
            </p>
          </div>

          {eventsData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Events Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                There are no events scheduled yet. {isAdmin && 'Be the first to add an event!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {eventsData.map((monthData, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-gray-200"
                >
                  <div className="bg-gradient-to-r from-[#004D40] to-[#00796B] hover:from-[#00796B] hover:to-[#004D40] transition-all duration-300">
                    <div className="flex justify-between items-center px-4 py-3 sm:py-4 text-white cursor-default">
                      <span className="font-bold text-base sm:text-lg tracking-wide">
                        {monthData.month}
                      </span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="text-xs sm:text-sm transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-gray-50/50">
                    {monthData.events.map((event, eventIndex) => {
                      const eventColor = getRandomColor();
                      return (
                        <div
                          key={eventIndex}
                          className="flex items-start mb-3 last:mb-0 p-3 sm:p-4 bg-white rounded-lg border-l-4 hover:bg-[#e0f2f1] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer relative group"
                          style={{ borderLeftColor: eventColor }}
                          onClick={() => handleEventClick(event)}
                        >
                          {/* Admin Actions */}
                          {isAdmin && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEditEvent(event);
                                }}
                                className="bg-blue-500 text-white p-1.5 rounded-md hover:bg-blue-600 transition-colors duration-200"
                                title="Edit Event"
                              >
                                <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => handleDeleteClick(event, e)}
                                className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors duration-200"
                                title="Delete Event"
                              >
                                <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-opacity-10 mr-3 flex-shrink-0"
                            style={{ backgroundColor: `${eventColor}20` }}
                          >
                            <FontAwesomeIcon
                              icon={event.icon}
                              className="text-base"
                              style={{ color: eventColor }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className="font-bold block mb-1 text-sm sm:text-base leading-tight truncate"
                              style={{ color: eventColor }}
                              title={event.title}
                            >
                              {event.title}
                            </span>
                            <span className="text-gray-600 text-xs sm:text-sm font-medium block">
                              {event.date}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                                event.status === 'upcoming'
                                  ? 'bg-blue-100 text-blue-800'
                                  : event.status === 'ongoing'
                                  ? 'bg-green-100 text-green-800'
                                  : event.status === 'completed'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && !showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-[#004D40]">{selectedEvent.title}</h3>
                <button
                  onClick={closeEventModal}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="flex items-center mb-4">
                <FontAwesomeIcon
                  icon={selectedEvent.icon}
                  className="text-[#00796B] mr-3 text-lg"
                />
                <span className="text-gray-600 font-medium">{selectedEvent.date}</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Description:</h4>
                <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
              </div>

              <div className="flex items-center mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEvent.status === 'upcoming'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedEvent.status === 'ongoing'
                      ? 'bg-green-100 text-green-800'
                      : selectedEvent.status === 'completed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Status: {selectedEvent.status}
                </span>
              </div>

              {isAdmin && (
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleEditEvent(selectedEvent)}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit Event
                  </button>
                  <button
                    onClick={e => handleDeleteClick(selectedEvent, e)}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete
                  </button>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeEventModal}
                  className="bg-[#004D40] text-white px-6 py-2 rounded-lg hover:bg-[#00796B] transition-colors duration-200 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#004D40]">
                  {isEditing ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button
                  onClick={handleFormClose}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Event Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter event name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {formErrors.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.name.length}/100 characters
                  </p>
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter event description"
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {formErrors.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Date Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date and Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                      formErrors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {formErrors.date}
                    </p>
                  )}
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                      formErrors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {formErrors.status && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {formErrors.status}
                    </p>
                  )}
                </div>

                {/* Icon Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon *</label>
                  <select
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                      formErrors.icon ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {iconOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.icon && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {formErrors.icon}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleFormClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || !canSubmit()}
                    className="flex-1 bg-[#004D40] text-white px-4 py-2 rounded-lg hover:bg-[#00796B] transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading
                      ? isEditing
                        ? 'Updating...'
                        : 'Creating...'
                      : isEditing
                      ? 'Update Event'
                      : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Event;