import React, { useState, useEffect } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaSpinner,
  FaCalendar,
  FaClock,
  FaUser,
  FaBriefcase,
  FaBuilding,
  FaGraduationCap,
  FaVideo,
  FaImage,
  FaYoutube,
} from 'react-icons/fa';
import {
  getAllLectures,
  createLecture,
  updateLecture,
  deleteLecture,
  markAsCompleted,
} from '../api/lectureApi';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const Guidance = () => {
  const [upcomingLecture, setUpcomingLecture] = useState(null);
  const [previousLectures, setPreviousLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Get auth state from store
  const { isAdmin, checkAuth } = useAuthStore();

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    isLoading: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    speaker: '',
    designation: '',
    organization: '',
    videoLink: '',
    isUpcoming: true,
    image: null,
  });

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
    const initializeData = async () => {
      try {
        // Check authentication and admin status
        await checkAuth();

        // Load lectures
        await loadLectures();
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Error loading lectures');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [checkAuth]);

  const loadLectures = async () => {
    try {
      const result = await getAllLectures();
      if (result.success) {
        setUpcomingLecture(result.data.upcomingLecture);
        setPreviousLectures(result.data.previousLectures);
      } else {
        toast.error('Failed to load lectures');
      }
    } catch (error) {
      console.error('Error loading lectures:', error);
      toast.error('Error loading lectures');
    }
  };

  const handleInputChange = e => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.title ||
      !formData.speaker ||
      !formData.designation ||
      !formData.organization ||
      !formData.date ||
      !formData.time
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingLecture && !formData.image) {
      // If editing and no new image, remove image from formData
      delete formData.image;
    } else if (!formData.image) {
      toast.error('Please select a speaker image');
      return;
    }

    setActionLoading(prev => ({ ...prev, submit: true }));

    try {
      let result;
      if (editingLecture) {
        result = await updateLecture(editingLecture.id, formData);
      } else {
        result = await createLecture(formData);
      }

      if (result.success) {
        toast.success(
          editingLecture ? 'Lecture updated successfully' : 'Lecture created successfully'
        );
        resetForm();
        await loadLectures();
      } else {
        toast.error(result.message || 'Failed to save lecture');
      }
    } catch (error) {
      console.error('Error saving lecture:', error);
      toast.error('Error saving lecture. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, submit: false }));
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (lectureId, isUpcoming) => {
    showModal({
      type: 'danger',
      title: 'Delete Lecture',
      message: `Are you sure you want to delete this ${
        isUpcoming ? 'upcoming' : 'previous'
      } lecture? This action cannot be undone.`,
      confirmText: 'Delete Lecture',
      onConfirm: () => handleDeleteConfirm(lectureId),
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async lectureId => {
    setActionLoading(prev => ({ ...prev, [`delete-${lectureId}`]: true }));

    try {
      const result = await deleteLecture(lectureId);
      if (result.success) {
        toast.success('Lecture deleted successfully');
        await loadLectures();
      } else {
        toast.error(result.message || 'Failed to delete lecture');
      }
    } catch (error) {
      console.error('Error deleting lecture:', error);
      toast.error('Error deleting lecture. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${lectureId}`]: false }));
    }
  };

  const handleMarkAsCompleted = async lectureId => {
    setActionLoading(prev => ({ ...prev, [`complete-${lectureId}`]: true }));

    try {
      const result = await markAsCompleted(lectureId);
      if (result.success) {
        toast.success('Lecture marked as completed');
        await loadLectures();
      } else {
        toast.error(result.message || 'Failed to update lecture');
      }
    } catch (error) {
      console.error('Error marking lecture as completed:', error);
      toast.error('Error updating lecture. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`complete-${lectureId}`]: false }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      speaker: '',
      designation: '',
      organization: '',
      videoLink: '',
      isUpcoming: true,
      image: null,
    });
    setEditingLecture(null);
    setShowAddForm(false);
  };

  const editLecture = (lecture, isUpcoming = false) => {
    setFormData({
      title: lecture.title,
      date: isUpcoming ? new Date(lecture.date).toISOString().split('T')[0] : '',
      time: lecture.time || '',
      speaker: lecture.speaker,
      designation: lecture.designation,
      organization: lecture.organization,
      videoLink: lecture.videoLink || '',
      isUpcoming: isUpcoming,
      image: null,
    });
    setEditingLecture(lecture);
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0f7] font-sans text-gray-800 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004D40] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading expert sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0f7] font-sans text-gray-800">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full">
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

        {/* Header with Admin Controls */}
        <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-4xl font-bold text-[#004D40] mb-3 text-center sm:text-left leading-tight">
                Guiding Light - Expert Sessions & Career Guidance
              </h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl text-center sm:text-left leading-relaxed">
                Learn from the experiences and insights of industry experts, distinguished
                professionals, and community leaders
              </p>
            </div>

            {isAdmin && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mt-4 sm:mt-0 shadow-sm">
                Admin Mode
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex justify-center sm:justify-start">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-[#004D40] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00332E] transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <FaPlus className="text-sm" />
                Add New Session
              </button>
            </div>
          )}
        </section>

        {/* Add/Edit Lecture Form */}
        {showAddForm && (
          <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100/80">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#004D40] text-center sm:text-left">
                {editingLecture ? 'Edit Session' : 'Add New Session'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaUser className="text-[#004D40] text-sm" />
                    Session Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-gray-50/50"
                    placeholder="Enter session title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaUser className="text-[#004D40] text-sm" />
                    Speaker Name *
                  </label>
                  <input
                    type="text"
                    name="speaker"
                    value={formData.speaker}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-gray-50/50"
                    placeholder="Enter speaker name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaBriefcase className="text-[#004D40] text-sm" />
                    Designation *
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-gray-50/50"
                    placeholder="Enter designation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaBuilding className="text-[#004D40] text-sm" />
                    Organization *
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-gray-50/50"
                    placeholder="Enter organization"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaYoutube className="text-[#004D40] text-sm" />
                    YouTube Video Link
                  </label>
                  <input
                    type="url"
                    name="videoLink"
                    value={formData.videoLink}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaCalendar className="text-[#004D40] text-sm" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-gray-50/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaClock className="text-[#004D40] text-sm" />
                    Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 bg-gray-50/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaImage className="text-[#004D40] text-sm" />
                    Speaker Image {!editingLecture && '*'}
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#004D40] file:text-white hover:file:bg-[#00332E] file:transition-colors bg-gray-50/50"
                    required={!editingLecture}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={actionLoading.submit}
                  className="flex-1 bg-[#004D40] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00332E] transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-3 justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {actionLoading.submit ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingLecture ? 'Updating Session...' : 'Creating Session...'}
                    </>
                  ) : editingLecture ? (
                    'Update Session'
                  ) : (
                    'Create Session'
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Upcoming Session Section */}
        <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-[#004D40] mb-2 text-center sm:text-left">
                Upcoming Session
              </h3>
              <p className="text-gray-600 text-sm text-center sm:text-left">
                Next scheduled expert session
              </p>
            </div>
            {isAdmin && upcomingLecture && (
              <div className="flex gap-2 mt-3 sm:mt-0">
                <button
                  onClick={() => handleMarkAsCompleted(upcomingLecture.id)}
                  disabled={actionLoading[`complete-${upcomingLecture.id}`]}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  <FaCheck className="text-xs" />
                  {actionLoading[`complete-${upcomingLecture.id}`]
                    ? 'Marking...'
                    : 'Mark Completed'}
                </button>

                <button
                  onClick={() => openDeleteModal(upcomingLecture.id, true)}
                  disabled={actionLoading[`delete-${upcomingLecture.id}`]}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  <FaTrash className="text-xs" />
                  {actionLoading[`delete-${upcomingLecture.id}`] ? '...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {upcomingLecture ? (
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 p-6 bg-gradient-to-r from-[#004d40]/5 to-[#00796b]/5 rounded-xl border border-[#004d40]/10">
              <div className="flex-shrink-0">
                <img
                  src={upcomingLecture.image}
                  alt={upcomingLecture.speaker}
                  className="w-24 h-24 lg:w-28 lg:h-28 object-cover rounded-2xl border-4 border-white shadow-lg"
                />
              </div>

              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-lg lg:text-xl font-bold text-[#004D40] mb-4 leading-tight">
                  {upcomingLecture.title}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-[#004D40] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FaCalendar className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Date</div>
                        <div className="font-semibold">{upcomingLecture.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-[#004D40] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FaClock className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Time</div>
                        <div className="font-semibold">{upcomingLecture.time}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-[#004D40] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FaUser className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Speaker</div>
                        <div className="font-semibold">{upcomingLecture.speaker}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-[#004D40] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FaBriefcase className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Designation</div>
                        <div className="font-semibold">{upcomingLecture.designation}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FaCalendar className="text-5xl mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No upcoming sessions scheduled</p>
              <p className="text-sm mb-4">Check back later for scheduled sessions</p>
              {isAdmin && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#004D40] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#00332E] transition-all duration-200 flex items-center gap-2 mx-auto shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaPlus className="text-sm" />
                  Schedule a Session
                </button>
              )}
            </div>
          )}
        </section>

        {/* Previous Sessions Section */}
        <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-[#004D40] mb-2 text-center sm:text-left">
                Previous Sessions
              </h3>
              <p className="text-gray-600 text-sm text-center sm:text-left">
                Archive of past expert sessions ({previousLectures.length})
              </p>
            </div>
          </div>

          {previousLectures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {previousLectures.map(lecture => (
                <div
                  key={lecture.id}
                  className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-lg transition-all duration-300 flex flex-col relative group hover:border-[#004D40]/20"
                >
                  {/* Action buttons - always visible for admin */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => editLecture(lecture)}
                        className="bg-blue-600 text-white p-2 rounded-lg text-xs hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 transform hover:-translate-y-0.5"
                        title="Edit Session"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(lecture.id, false)}
                        disabled={actionLoading[`delete-${lecture.id}`]}
                        className="bg-red-600 text-white p-2 rounded-lg text-xs hover:bg-red-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-1 transform hover:-translate-y-0.5 disabled:transform-none"
                        title="Delete Session"
                      >
                        {actionLoading[`delete-${lecture.id}`] ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <FaTrash className="text-xs" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Video thumbnail or placeholder */}
                  {lecture.youtubeId ? (
                    <a
                      href={
                        lecture.videoLink || `https://www.youtube.com/watch?v=${lecture.youtubeId}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-4 group/image relative overflow-hidden rounded-lg"
                    >
                      <div className="relative overflow-hidden rounded-lg aspect-video">
                        <img
                          src={`https://img.youtube.com/vi/${lecture.youtubeId}/hqdefault.jpg`}
                          alt={lecture.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                          <FaYoutube className="text-white text-3xl" />
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4 relative border border-gray-200">
                      <FaVideo className="text-gray-400 text-2xl" />
                    </div>
                  )}

                  {/* Session content */}
                  <h4 className="text-base font-bold text-[#004D40] mb-3 line-clamp-2 leading-tight group-hover:text-[#00796b] transition-colors duration-200 pr-12">
                    {lecture.title}
                  </h4>

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaUser className="text-[#004D40] text-xs flex-shrink-0" />
                      <span className="text-sm truncate font-medium">{lecture.speaker}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaBriefcase className="text-[#004D40] text-xs flex-shrink-0" />
                      <span className="text-sm truncate">{lecture.designation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaBuilding className="text-[#004D40] text-xs flex-shrink-0" />
                      <span className="text-sm truncate">{lecture.organization}</span>
                    </div>
                  </div>

                  {/* Watch button */}
                  {lecture.videoLink && (
                    <a
                      href={lecture.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#004D40] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00332E] transition-all duration-300 w-full group/watch shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaYoutube className="text-base" />
                      Watch Session
                      <span className="opacity-0 group-hover/watch:opacity-100 transition-opacity duration-200">
                        →
                      </span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FaVideo className="text-5xl mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No previous sessions available</p>
              <p className="text-sm">Recorded sessions will appear here after completion</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Guidance;
