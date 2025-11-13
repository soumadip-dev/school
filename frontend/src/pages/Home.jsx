import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faBlog,
  faImage,
  faComments,
  faHandHoldingHeart,
  faCalendarAlt,
  faLightbulb,
  faChalkboardTeacher,
  faUser,
  faSignInAlt,
  faChevronLeft,
  faChevronRight,
  faEdit,
  faPlus,
  faTrash,
  faTimes,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import {
  getSliderImages,
  addSliderImage,
  updateSliderImage,
  deleteSliderImage,
} from '../api/sliderApi';
import { useAuthStore } from '../store/authStore';

const menuItemsBase = [
  { path: '/', label: 'Home', icon: faHome },
  { path: '/alumni', label: 'Alumni', icon: faUsers },
  { path: '/blog', label: 'Blog', icon: faBlog },
  { path: '/album', label: 'Album', icon: faImage },
  { path: '/discuss', label: 'Discuss', icon: faComments },
  { path: '/donate', label: 'Donate', icon: faHandHoldingHeart },
  { path: '/events', label: 'Events', icon: faCalendarAlt },
  { path: '/ideas', label: 'Ideas', icon: faLightbulb },
  { path: '/guidance', label: 'Guidance', icon: faChalkboardTeacher },
  { path: '/profile', label: 'My Profile', icon: faUser },
];

const Home = () => {
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderImages, setSliderImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMultipleAddModal, setShowMultipleAddModal] = useState(false);

  // Data states
  const [editingSlider, setEditingSlider] = useState(null);
  const [deletingSlider, setDeletingSlider] = useState(null);
  const [newSlider, setNewSlider] = useState({
    image: null,
    title: 'Jalpaiguri Zilla School',
    subtitle: 'Celebrating 150 Years of Excellence',
  });
  const [multipleImages, setMultipleImages] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get auth state from store
  const { isAuthenticated, isAdmin, checkAuth, logout } = useAuthStore();

  // Fetch slider images and check auth status
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check authentication and admin status via store
        await checkAuth();

        // Fetch slider images
        await fetchSliderImages();
      } catch (error) {
        console.error('Error initializing data:', error);
        setMessage({ type: 'error', text: 'Failed to load content' });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [checkAuth]);

  // Auto slide functionality
  useEffect(() => {
    if (sliderImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % sliderImages.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sliderImages.length]);

  const fetchSliderImages = async () => {
    try {
      setLoading(true);
      const result = await getSliderImages();
      if (result.success) {
        setSliderImages(result.data.sliderImages);
      }
    } catch (error) {
      console.error('Error fetching slider images:', error);
      setMessage({ type: 'error', text: 'Failed to load slider images' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) {
      window.location.href = '/';
    }
  };

  // Filter menu items based on authentication and admin status
  const getMenuItems = () => {
    const baseItems = [...menuItemsBase];

    // Remove "My Profile" if user is admin
    const filteredItems = baseItems.filter(item => !(item.path === '/profile' && isAdmin));

    // Add login/logout button
    const finalItems = [
      ...filteredItems,
      isAuthenticated
        ? { path: '#', label: 'Logout', icon: faSignOutAlt, onClick: handleLogout }
        : { path: '/signin', label: 'Login', icon: faSignInAlt },
    ];

    return finalItems;
  };

  const menuItems = getMenuItems();

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const goToSlide = index => {
    setCurrentSlide(index);
  };

  const isActive = path => {
    return location.pathname === path;
  };

  // Add Single Slider Functions
  const handleAddSingleClick = () => {
    setShowAddModal(true);
    setNewSlider({
      image: null,
      title: 'Jalpaiguri Zilla School',
      subtitle: 'Celebrating 150 Years of Excellence',
    });
    setMessage({ type: '', text: '' });
  };

  const handleAddMultipleClick = () => {
    setShowMultipleAddModal(true);
    setMultipleImages([]);
    setMessage({ type: '', text: '' });
  };

  const handleAddSlider = async () => {
    try {
      setFormLoading(true);
      const formData = new FormData();
      formData.append('image', newSlider.image);
      formData.append('title', newSlider.title);
      formData.append('subtitle', newSlider.subtitle);

      const result = await addSliderImage(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Slider image added successfully!' });
        await fetchSliderImages();
        setTimeout(() => {
          setShowAddModal(false);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to add slider image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setFormLoading(false);
    }
  };

  // Add Multiple Sliders Functions
  const handleMultipleImageChange = e => {
    const files = Array.from(e.target.files);
    setMultipleImages(files);
  };

  const handleAddMultipleSliders = async () => {
    try {
      setFormLoading(true);
      const formData = new FormData();

      multipleImages.forEach((image, index) => {
        formData.append('images', image);
        formData.append('titles[]', 'Jalpaiguri Zilla School');
        formData.append('subtitles[]', 'Celebrating 150 Years of Excellence');
      });

      // Note: You'll need to implement addMultipleSliderImages API function
      const result = await addMultipleSliderImages(formData);
      if (result.success) {
        setMessage({
          type: 'success',
          text: `${result.data.sliderImages.length} slider images added successfully!`,
        });
        await fetchSliderImages();
        setTimeout(() => {
          setShowMultipleAddModal(false);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to add slider images' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Slider Functions
  const handleEditClick = slider => {
    setEditingSlider({
      ...slider,
      newImage: null,
    });
    setShowEditModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleSaveEdit = async () => {
    try {
      setFormLoading(true);
      const formData = new FormData();
      formData.append('title', editingSlider.title);
      formData.append('subtitle', editingSlider.subtitle);

      if (editingSlider.newImage) {
        formData.append('image', editingSlider.newImage);
      }

      const result = await updateSliderImage(editingSlider._id, formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Slider image updated successfully!' });
        await fetchSliderImages();
        setTimeout(() => {
          setShowEditModal(false);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update slider image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Slider Functions
  const handleDeleteClick = slider => {
    setDeletingSlider(slider);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setFormLoading(true);
      const result = await deleteSliderImage(deletingSlider._id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Slider image deleted successfully!' });
        await fetchSliderImages();
        setTimeout(() => {
          setShowDeleteModal(false);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete slider image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setFormLoading(false);
    }
  };

  // Common handler functions
  const handleImageChange = (e, isNew = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isNew) {
        setNewSlider(prev => ({ ...prev, image: file }));
      } else {
        setEditingSlider(prev => ({ ...prev, newImage: file }));
      }
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'add') {
      setNewSlider(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'edit') {
      setEditingSlider(prev => ({ ...prev, [name]: value }));
    }
  };

  const closeAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowMultipleAddModal(false);
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0f7] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004D40] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0f7] font-sans">
      {/* Image Slider Section */}
      <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[28rem] overflow-hidden">
        {/* Slider Images */}
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {sliderImages.map((slider, index) => (
            <div key={slider._id} className="w-full h-full flex-shrink-0 relative">
              <img src={slider.image} alt={slider.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20"></div>

              {/* Admin Controls Overlay */}
              {isAdmin && (
                <div className="absolute top-4 right-4 flex space-x-2 z-20">
                  <button
                    onClick={() => handleEditClick(slider)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200"
                    title="Edit Slider"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-sm" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(slider)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all duration-200"
                    title="Delete Slider"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {sliderImages.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-[#004D40] p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-lg" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-[#004D40] p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {sliderImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Slider Text Overlay */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-center text-white z-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">
            {sliderImages[currentSlide]?.title || 'Jalpaiguri Zilla School'}
          </h2>
          <p className="text-sm sm:text-base md:text-lg drop-shadow-lg">
            {sliderImages[currentSlide]?.subtitle || 'Celebrating 150 Years of Excellence'}
          </p>
        </div>

        {/* Admin Action Buttons */}
        {isAdmin && (
          <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
            <button
              onClick={handleAddSingleClick}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Add Single</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Single Slider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#004D40]">Add New Slider</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageChange(e, true)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={newSlider.title}
                  onChange={e => handleInputChange(e, 'add')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={newSlider.subtitle}
                  onChange={e => handleInputChange(e, 'add')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {message.text && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeAllModals}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlider}
                disabled={formLoading || !newSlider.image}
                className="flex-1 bg-[#004D40] text-white py-2 rounded-lg hover:bg-[#00796B] transition-colors disabled:opacity-50 font-semibold"
              >
                {formLoading ? 'Adding...' : 'Add Slider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Multiple Sliders Modal */}
      {showMultipleAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#004D40]">Add Multiple Sliders</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImageChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {multipleImages.length} images
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> All images will be added with default titles and subtitles.
                  You can edit them individually later.
                </p>
              </div>
            </div>

            {message.text && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeAllModals}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMultipleSliders}
                disabled={formLoading || multipleImages.length === 0}
                className="flex-1 bg-[#004D40] text-white py-2 rounded-lg hover:bg-[#00796B] transition-colors disabled:opacity-50 font-semibold"
              >
                {formLoading ? 'Adding...' : `Add ${multipleImages.length} Images`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slider Modal */}
      {showEditModal && editingSlider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#004D40]">Edit Slider</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Image
                </label>
                <img
                  src={editingSlider.image}
                  alt="Current"
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editingSlider.title}
                  onChange={e => handleInputChange(e, 'edit')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={editingSlider.subtitle}
                  onChange={e => handleInputChange(e, 'edit')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {message.text && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeAllModals}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={formLoading}
                className="flex-1 bg-[#004D40] text-white py-2 rounded-lg hover:bg-[#00796B] transition-colors disabled:opacity-50 font-semibold"
              >
                {formLoading ? 'Updating...' : 'Update Slider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingSlider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#004D40]">Confirm Delete</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">
                  Are you sure you want to delete this slider image?
                </p>
              </div>

              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <img
                  src={deletingSlider.image}
                  alt="To delete"
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-semibold text-gray-800">{deletingSlider.title}</p>
                  <p className="text-sm text-gray-600">{deletingSlider.subtitle}</p>
                </div>
              </div>
            </div>

            {message.text && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeAllModals}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={formLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {formLoading ? 'Deleting...' : 'Delete Slider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest of your component remains the same */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 w-full">
        {/* Event Description Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 sm:mb-10 lg:mb-12 w-full transform transition-all duration-200 hover:shadow-xl border border-[#004D40]/10">
          <div className="text-center mb-4">
            <span className="inline-block bg-[#004D40] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              150 Years Celebration
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#004D40] mb-4 sm:mb-5 text-center leading-tight">
            Celebrating 150 Years of <span className="text-[#01796B]">Jalpaiguri Zilla School</span>
          </h3>
          <p className="text-gray-700 text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-loose text-center max-w-4xl mx-auto">
            Join us as we celebrate a century and a half of educational excellence, brotherhood, and
            tradition. The JZS 150 Years event will feature alumni meets, cultural programs, and
            opportunities to contribute back to our beloved school.
          </p>
        </section>

        {/* Icon Navigation */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 w-full">
          {menuItems.map((item, index) =>
            item.onClick ? (
              // Logout button
              <button
                key={index}
                onClick={item.onClick}
                className="group flex flex-col items-center justify-center p-3 sm:p-4 lg:p-5 rounded-2xl text-white transition-all duration-300 w-full min-h-[100px] sm:min-h-[120px] md:min-h-[130px] shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-[#004D40] to-[#01796B] hover:from-[#01796B] hover:to-[#019587] cursor-pointer"
              >
                <div className="p-2 sm:p-3 rounded-full mb-2 sm:mb-3 transition-all duration-300 bg-white/10 group-hover:bg-white/20">
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="text-lg sm:text-xl lg:text-2xl xl:text-2xl"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-center leading-tight px-1 break-words">
                  {item.label}
                </span>
              </button>
            ) : (
              // Regular menu items
              <Link
                key={index}
                to={item.path}
                className={`group flex flex-col items-center justify-center p-3 sm:p-4 lg:p-5 rounded-2xl text-white transition-all duration-300 w-full min-h-[100px] sm:min-h-[120px] md:min-h-[130px] shadow-md hover:shadow-xl transform hover:-translate-y-1 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-br from-[#00332E] to-[#002822] shadow-lg scale-[1.02]'
                    : 'bg-gradient-to-br from-[#004D40] to-[#01796B] hover:from-[#01796B] hover:to-[#019587]'
                }`}
              >
                <div
                  className={`p-2 sm:p-3 rounded-full mb-2 sm:mb-3 transition-all duration-300 ${
                    isActive(item.path) ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="text-lg sm:text-xl lg:text-2xl xl:text-2xl"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-center leading-tight px-1 break-words">
                  {item.label}
                </span>
              </Link>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;