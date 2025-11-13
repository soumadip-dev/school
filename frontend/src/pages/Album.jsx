import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  getAllPhotos,
  uploadPhotos,
  toggleLike,
  addComment,
  deletePhoto,
  deleteComment,
} from '../api/albumApi';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const Album = () => {
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [uploadFiles, setUploadFiles] = useState([]);
  const [frontendImages, setFrontendImages] = useState([]);
  const [backendImages, setBackendImages] = useState([]);
  const [photoDescription, setPhotoDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    isLoading: false,
  });
  const location = useLocation();

  const { isAdmin, checkAuth } = useAuthStore();

  const PHOTOS_PER_PAGE = 6;

  const classes = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const batchOptions = [
    '1970 and before',
    '1971-1980',
    '1981-1990',
    '1991-2000',
    '2001-2010',
    '2011-2025',
  ];

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

  useEffect(() => {
    const initializeData = async () => {
      try {
        await checkAuth();
        await fetchPhotos();
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load photos');
      }
    };

    initializeData();
  }, [checkAuth]);

  const fetchPhotos = async (page = 1, role = '', batch = '') => {
    setLoading(true);
    try {
      const result = await getAllPhotos(page, PHOTOS_PER_PAGE, role, batch);
      if (result.success) {
        setPhotos(result.data.photos);
        setFilteredPhotos(result.data.photos);
        setPagination(result.data.pagination);
      } else {
        console.error('Failed to fetch photos:', result.message);
        toast.error('Failed to load photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Error loading photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos(currentPage, roleFilter, batchFilter);
  }, [currentPage, roleFilter, batchFilter]);

  const showBatchFilter = roleFilter === 'Alumni Student' || roleFilter === 'Present Student';

  const handleLike = async (photoId, e) => {
    e.stopPropagation();
    setActionLoading(prev => ({ ...prev, [`like-${photoId}`]: true }));

    try {
      setPhotos(prevPhotos =>
        prevPhotos.map(photo =>
          photo.id === photoId
            ? {
                ...photo,
                likes: photo.likes + (photo.hasLiked ? -1 : 1),
                hasLiked: !photo.hasLiked,
              }
            : photo
        )
      );
      setFilteredPhotos(prevPhotos =>
        prevPhotos.map(photo =>
          photo.id === photoId
            ? {
                ...photo,
                likes: photo.likes + (photo.hasLiked ? -1 : 1),
                hasLiked: !photo.hasLiked,
              }
            : photo
        )
      );

      const result = await toggleLike(photoId);
      if (result.success) {
        setPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  likes: result.data.likes,
                  hasLiked: result.data.hasLiked,
                }
              : photo
          )
        );
        setFilteredPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  likes: result.data.likes,
                  hasLiked: result.data.hasLiked,
                }
              : photo
          )
        );

        if (selectedPhoto && selectedPhoto.id === photoId) {
          setSelectedPhoto(prev => ({
            ...prev,
            likes: result.data.likes,
            hasLiked: result.data.hasLiked,
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      fetchPhotos(currentPage, roleFilter, batchFilter);
      toast.error('Error updating like');
    } finally {
      setActionLoading(prev => ({ ...prev, [`like-${photoId}`]: false }));
    }
  };

  const handleCommentChange = (photoId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [photoId]: value,
    }));
  };

  const handleCommentSubmit = async (photoId, e) => {
    e.stopPropagation();
    const commentText = commentInputs[photoId]?.trim();
    if (commentText) {
      setActionLoading(prev => ({ ...prev, [`comment-${photoId}`]: true }));

      try {
        const currentComment = commentText;
        setCommentInputs(prev => ({
          ...prev,
          [photoId]: '',
        }));

        const optimisticComment = {
          id: `temp-${Date.now()}`,
          text: currentComment,
          name: 'You',
          batch: '',
          createdAt: new Date().toISOString(),
        };

        setPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  comments: [optimisticComment, ...(photo.comments || [])],
                }
              : photo
          )
        );
        setFilteredPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  comments: [optimisticComment, ...(photo.comments || [])],
                }
              : photo
          )
        );

        const result = await addComment(photoId, currentComment);
        if (result.success) {
          const newComment = result.data.comment;
          setPhotos(prevPhotos =>
            prevPhotos.map(photo =>
              photo.id === photoId
                ? {
                    ...photo,
                    comments: [
                      newComment,
                      ...(photo.comments || []).filter(
                        comment => comment.id !== optimisticComment.id
                      ),
                    ],
                  }
                : photo
            )
          );
          setFilteredPhotos(prevPhotos =>
            prevPhotos.map(photo =>
              photo.id === photoId
                ? {
                    ...photo,
                    comments: [
                      newComment,
                      ...(photo.comments || []).filter(
                        comment => comment.id !== optimisticComment.id
                      ),
                    ],
                  }
                : photo
            )
          );

          if (selectedPhoto && selectedPhoto.id === photoId) {
            setSelectedPhoto(prev => ({
              ...prev,
              comments: [
                newComment,
                ...(prev.comments || []).filter(comment => comment.id !== optimisticComment.id),
              ],
            }));
          }
          toast.success('Comment added successfully');
        }
      } catch (error) {
        console.error('Error adding comment:', error);
        fetchPhotos(currentPage, roleFilter, batchFilter);
        toast.error('Error adding comment');
      } finally {
        setActionLoading(prev => ({ ...prev, [`comment-${photoId}`]: false }));
      }
    }
  };

  const handleDeletePhoto = async photoId => {
    setActionLoading(prev => ({ ...prev, [`delete-photo-${photoId}`]: true }));

    try {
      const result = await deletePhoto(photoId);
      if (result.success) {
        setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
        setFilteredPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));

        if (selectedPhoto && selectedPhoto.id === photoId) {
          setSelectedPhoto(null);
        }

        toast.success('Photo deleted successfully');
      } else {
        toast.error(`Failed to delete photo: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Error deleting photo. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-photo-${photoId}`]: false }));
    }
  };

  const handleDeleteComment = async (photoId, commentId) => {
    setActionLoading(prev => ({ ...prev, [`delete-comment-${commentId}`]: true }));

    try {
      const result = await deleteComment(commentId);
      if (result.success) {
        const updatedPhotos = photos.map(photo => {
          if (photo.id === photoId) {
            const updatedComments = photo.comments.filter(comment => comment.id !== commentId);
            return { ...photo, comments: updatedComments };
          }
          return photo;
        });

        setPhotos(updatedPhotos);
        setFilteredPhotos(updatedPhotos);

        if (selectedPhoto && selectedPhoto.id === photoId) {
          setSelectedPhoto(prev => ({
            ...prev,
            comments: prev.comments.filter(comment => comment.id !== commentId),
          }));
        }

        toast.success('Comment deleted successfully');
      } else {
        toast.error(`Failed to delete comment: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Error deleting comment. Please try again.');
      fetchPhotos(currentPage, roleFilter, batchFilter);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-comment-${commentId}`]: false }));
    }
  };

  const handleDeletePhotoClick = (photoId, e) => {
    e.stopPropagation();
    showModal({
      type: 'danger',
      title: 'Delete Photo',
      message: 'Are you sure you want to delete this photo? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: () => handleDeletePhoto(photoId),
    });
  };

  const handleDeleteCommentClick = (photoId, commentId, e) => {
    e.stopPropagation();
    showModal({
      type: 'danger',
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      onConfirm: () => handleDeleteComment(photoId, commentId),
    });
  };

  const openModal = photo => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  const handleFileUpload = e => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('You can upload a maximum of 5 photos at a time.');
      return;
    }

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB.');
        return;
      }
    }

    setBackendImages(files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setFrontendImages(imageUrls);
    setUploadFiles(files);
  };

  const handleUpload = async () => {
    if (backendImages.length === 0) {
      toast.error('Please select at least one photo to upload.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      backendImages.forEach(file => {
        formData.append('images', file);
      });
      formData.append('description', photoDescription);

      const result = await uploadPhotos(formData);
      if (result.success) {
        setPhotos(prev => [...result.data.photos, ...prev]);
        setFilteredPhotos(prev => [...result.data.photos, ...prev]);

        setBackendImages([]);
        setFrontendImages([]);
        setUploadFiles([]);
        setPhotoDescription('');
        toast.success('Upload successful!');

        if (currentPage !== 1) {
          setCurrentPage(1);
        }
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDescriptionChange = e => {
    const value = e.target.value;
    const words = value
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0);
    if (words.length <= 10) {
      setPhotoDescription(value);
    } else {
      setPhotoDescription(words.slice(0, 10).join(' '));
    }
  };

  const handleKeyPress = (photoId, e) => {
    if (e.key === 'Enter') {
      handleCommentSubmit(photoId, e);
    }
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  useEffect(() => {
    return () => {
      frontendImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [frontendImages]);

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 w-full box-border">
        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h2 className="text-[#004d40] text-xl sm:text-2xl font-bold">School Memories</h2>
            {isAdmin && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded-lg text-sm font-medium mt-2 sm:mt-0">
                Admin Mode
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6 mb-6">
            <div className="w-full sm:w-auto">
              <label htmlFor="roleFilter" className="font-bold text-sm sm:text-base mb-1 block">
                Role:
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004d40] text-sm sm:text-base transition-colors duration-200"
              >
                <option value="">All Roles</option>
                <option value="Alumni Student">Alumni Students</option>
                <option value="Alumni Teacher">Alumni Teachers</option>
                <option value="Present Student">Present Student</option>
                <option value="Present Teacher">Present Teacher</option>
              </select>
            </div>

            {showBatchFilter && (
              <div className="w-full sm:w-auto">
                <label htmlFor="batchFilter" className="font-bold text-sm sm:text-base mb-1 block">
                  {roleFilter === 'Present Student' ? 'Class:' : 'Batch:'}
                </label>
                <select
                  id="batchFilter"
                  value={batchFilter}
                  onChange={e => setBatchFilter(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004d40] text-sm sm:text-base transition-colors duration-200"
                >
                  <option value="">
                    All {roleFilter === 'Present Student' ? 'Classes' : 'Batches'}
                  </option>
                  {roleFilter === 'Present Student'
                    ? classes.map(cls => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))
                    : batchOptions.map(batch => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                </select>
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d40] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading photos...</p>
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {filteredPhotos.length > 0 ? (
                filteredPhotos.map(photo => {
                  const roleTag =
                    photo.role === 'Alumni Student' || photo.role === 'Present Student'
                      ? `${photo.name} (${photo.batch})`
                      : `${photo.name} - ${photo.role}`;

                  return (
                    <div
                      key={photo.id}
                      className="bg-gray-50 border border-gray-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col transform hover:-translate-y-1 relative group"
                    >
                      {/* Enhanced Admin Delete Button for Photo */}
                      {isAdmin && (
                        <button
                          onClick={e => handleDeletePhotoClick(photo.id, e)}
                          disabled={actionLoading[`delete-photo-${photo.id}`]}
                          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-red-600 p-2.5 rounded-full hover:bg-red-50 hover:text-red-700 border border-red-200 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                          title="Delete Photo"
                        >
                          {actionLoading[`delete-photo-${photo.id}`] ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                          ) : (
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <img
                        src={photo.src}
                        alt="Album photo"
                        className="w-full h-48 sm:h-56 object-cover cursor-pointer"
                        onClick={() => openModal(photo)}
                      />
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="text-sm text-gray-700 mb-3 flex-grow">
                          <p className="font-medium">Posted by: {roleTag}</p>
                          {photo.description && (
                            <p className="mt-2 text-gray-600 leading-relaxed">
                              {photo.description}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                          <button
                            onClick={e => handleLike(photo.id, e)}
                            disabled={actionLoading[`like-${photo.id}`]}
                            className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                              photo.hasLiked
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-gray-600 hover:text-red-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {actionLoading[`like-${photo.id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <FontAwesomeIcon
                                icon={faHeart}
                                className={photo.hasLiked ? 'text-red-600' : ''}
                              />
                            )}
                            <span>{photo.likes || 0}</span>
                          </button>
                        </div>

                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={commentInputs[photo.id] || ''}
                              onChange={e => handleCommentChange(photo.id, e.target.value)}
                              onKeyPress={e => handleKeyPress(photo.id, e)}
                              onClick={e => e.stopPropagation()}
                              disabled={actionLoading[`comment-${photo.id}`]}
                              className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004d40] text-sm transition-colors duration-200 disabled:opacity-50"
                            />
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleCommentSubmit(photo.id, e);
                              }}
                              disabled={
                                actionLoading[`comment-${photo.id}`] ||
                                !commentInputs[photo.id]?.trim()
                              }
                              className="bg-[#004d40] text-white px-4 py-2 rounded-lg hover:bg-[#00332E] transition-colors duration-200 text-sm whitespace-nowrap font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {actionLoading[`comment-${photo.id}`] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                'Post'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">No Photos Found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    There are no photos to display yet. Be the first one to share your school
                    memories!
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 sm:mt-8 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  currentPage === 1
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-[#004d40] text-white hover:bg-[#00332E]'
                }`}
              >
                « Prev
              </button>

              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let page;
                if (pagination.totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                      page === currentPage
                        ? 'bg-[#00332E] text-white shadow-md'
                        : 'bg-[#004d40] text-white hover:bg-[#00332E] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  currentPage === pagination.totalPages
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-[#004d40] text-white hover:bg-[#00332E]'
                }`}
              >
                Next »
              </button>
            </div>
          )}

          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="bg-gradient-to-br from-[#004d40] to-[#00796b] rounded-xl p-6 sm:p-8 shadow-lg">
              <h3 className="text-white text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
                Upload New Photos
              </h3>

              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white rounded-lg p-1">
                  <input
                    type="file"
                    id="photoUpload"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-3 text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#004d40] file:text-white hover:file:bg-[#00332E] transition-colors duration-200"
                  />
                </div>

                {frontendImages.length > 0 && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-semibold text-[#004d40] mb-3 text-center">Preview:</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {frontendImages.map((url, index) => (
                        <div key={index} className="relative w-90 h-30">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-gray-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  value={photoDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Photo description (max 10 words)"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-sm sm:text-base resize-vertical bg-white/90 backdrop-blur-sm"
                />

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || backendImages.length === 0}
                    className="bg-white text-[#004d40] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base flex-1 w-full sm:w-auto disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#004d40]"></div>
                        Uploading...
                      </>
                    ) : (
                      'Upload Photos'
                    )}
                  </button>
                </div>

                <p className="text-white/80 text-xs text-center mt-2">Max file size: 2MB</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={closePhotoModal}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#004d40]">Photo Details</h3>
                <div className="flex items-center gap-2">
                  {/* Enhanced Admin Delete Button in Modal */}
                  {isAdmin && (
                    <button
                      onClick={e => handleDeletePhotoClick(selectedPhoto.id, e)}
                      disabled={actionLoading[`delete-photo-${selectedPhoto.id}`]}
                      className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105"
                    >
                      {actionLoading[`delete-photo-${selectedPhoto.id}`] ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                      )}
                      Delete Photo
                    </button>
                  )}
                  <button
                    onClick={closePhotoModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                  >
                    ×
                  </button>
                </div>
              </div>

              <img
                src={selectedPhoto.src}
                alt="Enlarged photo"
                className="w-full max-h-80 sm:max-h-96 object-contain rounded-lg mb-4 shadow-md"
              />

              <div className="text-gray-700 mb-4 space-y-2">
                <p>
                  <strong>Posted by:</strong> {selectedPhoto.name}{' '}
                  {selectedPhoto.batch &&
                    (selectedPhoto.role === 'Alumni Student' ||
                      selectedPhoto.role === 'Present Student') &&
                    `(${selectedPhoto.batch})`}
                </p>
                {selectedPhoto.description && (
                  <p>
                    <strong>Description:</strong> {selectedPhoto.description}
                  </p>
                )}
                <p>
                  <strong>Likes:</strong> {selectedPhoto.likes || 0}
                </p>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <h4 className="font-semibold mb-3 text-[#004d40]">
                  Comments ({(selectedPhoto.comments && selectedPhoto.comments.length) || 0}):
                </h4>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {selectedPhoto.comments && selectedPhoto.comments.length > 0 ? (
                    selectedPhoto.comments.map(comment => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <strong className="text-[#004d40] block">
                              {comment.name} {comment.batch && `(${comment.batch})`}
                            </strong>
                            <p className="text-gray-700 mt-1 break-words">{comment.text}</p>
                          </div>
                          
                          {/* Enhanced Admin Delete Button for Comment in Modal */}
                          {isAdmin && (
                            <button
                              onClick={e => handleDeleteCommentClick(selectedPhoto.id, comment.id, e)}
                              disabled={actionLoading[`delete-comment-${comment.id}`]}
                              className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 hover:scale-110 flex-shrink-0 flex items-center justify-center"
                              title="Delete Comment"
                            >
                              {actionLoading[`delete-comment-${comment.id}`] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Album;