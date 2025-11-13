import Lecture from '../model/Lecture.model.js';
import uploadOnCloudinary from '../config/cloudinary.config.js';

//* Extract YouTube ID from URL
const extractYouTubeId = url => {
  if (!url) return '';

  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
};

//* Format date function
const formatDate = date => {
  if (!date) return '';

  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

//* Get all lectures (upcoming and previous)
const getAllLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find({ isActive: true })
      .sort({ isUpcoming: -1, date: -1 })
      .lean();

    console.log('Raw lectures from DB:', lectures); // Debug log

    // Separate upcoming and previous lectures
    const upcomingLecture = lectures.find(lecture => lecture.isUpcoming) || null;
    const previousLectures = lectures.filter(lecture => !lecture.isUpcoming);

    // Format upcoming lecture
    const formattedUpcoming = upcomingLecture
      ? {
          id: upcomingLecture._id.toString(),
          image: upcomingLecture.image,
          title: upcomingLecture.title,
          date: formatDate(upcomingLecture.date), // Use manual formatting
          time: upcomingLecture.time,
          speaker: upcomingLecture.speaker,
          designation: upcomingLecture.designation,
          organization: upcomingLecture.organization,
          batch: upcomingLecture.batch,
          videoLink: upcomingLecture.videoLink,
          youtubeId: upcomingLecture.youtubeId,
        }
      : null;

    // Format previous lectures
    const formattedPrevious = previousLectures.map(lecture => ({
      id: lecture._id.toString(),
      youtubeId: lecture.youtubeId,
      title: lecture.title,
      speaker: lecture.speaker,
      designation: lecture.designation,
      organization: lecture.organization,
      batch: lecture.batch,
      videoLink: lecture.videoLink,
      date: formatDate(lecture.date), // Use manual formatting
      image: lecture.image, // Add image for previous lectures if needed
    }));

    console.log('Formatted upcoming:', formattedUpcoming); // Debug log
    console.log('Formatted previous count:', formattedPrevious.length); // Debug log

    res.status(200).json({
      message: 'Lectures fetched successfully',
      success: true,
      data: {
        upcomingLecture: formattedUpcoming,
        previousLectures: formattedPrevious,
      },
    });
  } catch (error) {
    console.error('Error fetching lectures:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while fetching lectures',
      success: false,
    });
  }
};

//* Create a new lecture (Admin only)
const createLecture = async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      speaker,
      designation,
      organization,
      videoLink,
      isUpcoming = true,
    } = req.body;

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        message: 'Speaker image is required',
        success: false,
      });
    }

    // Upload image to Cloudinary
    const imageUrl = await uploadOnCloudinary(req.file.path);

    // Extract YouTube ID from video link
    const youtubeId = extractYouTubeId(videoLink);

    // Create new lecture
    const newLecture = await Lecture.create({
      title,
      image: imageUrl,
      date: new Date(date),
      time,
      speaker,
      designation,
      organization,
      videoLink: videoLink || '',
      youtubeId,
      isUpcoming: isUpcoming === 'true',
    });

    res.status(201).json({
      message: 'Lecture created successfully',
      success: true,
      data: {
        lecture: {
          id: newLecture._id.toString(),
          title: newLecture.title,
          image: newLecture.image,
          date: formatDate(newLecture.date), // Use manual formatting
          time: newLecture.time,
          speaker: newLecture.speaker,
          designation: newLecture.designation,
          organization: newLecture.organization,
          videoLink: newLecture.videoLink,
          youtubeId: newLecture.youtubeId,
          isUpcoming: newLecture.isUpcoming,
        },
      },
    });
  } catch (error) {
    console.error('Error creating lecture:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while creating lecture',
      success: false,
    });
  }
};

//* Update a lecture (Admin only)
const updateLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { title, date, time, speaker, designation, organization, batch, videoLink, isUpcoming } =
      req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: 'Lecture not found',
        success: false,
      });
    }

    // Update fields
    if (title) lecture.title = title;
    if (date) lecture.date = new Date(date);
    if (time) lecture.time = time;
    if (speaker) lecture.speaker = speaker;
    if (designation) lecture.designation = designation;
    if (organization) lecture.organization = organization;
    if (batch) lecture.batch = batch;
    if (videoLink !== undefined) {
      lecture.videoLink = videoLink;
      lecture.youtubeId = extractYouTubeId(videoLink);
    }
    if (isUpcoming !== undefined) lecture.isUpcoming = isUpcoming === 'true';

    // Update image if new file is uploaded
    if (req.file) {
      const imageUrl = await uploadOnCloudinary(req.file.path);
      lecture.image = imageUrl;
    }

    await lecture.save();

    res.status(200).json({
      message: 'Lecture updated successfully',
      success: true,
      data: {
        lecture: {
          id: lecture._id.toString(),
          title: lecture.title,
          image: lecture.image,
          date: formatDate(lecture.date), // Use manual formatting
          time: lecture.time,
          speaker: lecture.speaker,
          designation: lecture.designation,
          organization: lecture.organization,
          batch: lecture.batch,
          videoLink: lecture.videoLink,
          youtubeId: lecture.youtubeId,
          isUpcoming: lecture.isUpcoming,
        },
      },
    });
  } catch (error) {
    console.error('Error updating lecture:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while updating lecture',
      success: false,
    });
  }
};

//* Delete a lecture (Admin only)
const deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // Soft delete the lecture
    const lecture = await Lecture.findByIdAndUpdate(lectureId, { isActive: false }, { new: true });

    if (!lecture) {
      return res.status(404).json({
        message: 'Lecture not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Lecture deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting lecture:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while deleting lecture',
      success: false,
    });
  }
};

//* Mark lecture as completed (Admin only)
const markAsCompleted = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findByIdAndUpdate(
      lectureId,
      { isUpcoming: false },
      { new: true }
    );

    if (!lecture) {
      return res.status(404).json({
        message: 'Lecture not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Lecture marked as completed',
      success: true,
      data: {
        lecture: {
          id: lecture._id.toString(),
          title: lecture.title,
          isUpcoming: lecture.isUpcoming,
          date: formatDate(lecture.date), // Include formatted date
        },
      },
    });
  } catch (error) {
    console.error('Error marking lecture as completed:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while updating lecture',
      success: false,
    });
  }
};

export { getAllLectures, createLecture, updateLecture, deleteLecture, markAsCompleted };
