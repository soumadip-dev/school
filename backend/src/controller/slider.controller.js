import Slider from '../model/Slider.model.js';
import uploadOnCloudinary from '../config/cloudinary.config.js';

//* Get all active slider images
export const getSliderImages = async (req, res) => {
  try {
    const sliderImages = await Slider.find({ isActive: true })
      .populate('createdBy', 'name surname')
      .sort({ order: 1, createdAt: -1 })
      .exec();

    res.status(200).json({
      message: 'Slider images fetched successfully',
      success: true,
      data: {
        sliderImages,
      },
    });
  } catch (error) {
    console.error('Error fetching slider images:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching slider images',
      success: false,
    });
  }
};

//* Add new slider image (Admin only)
export const addSliderImage = async (req, res) => {
  try {
    const { title, subtitle, order = 0 } = req.body;
    const createdBy = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        message: 'Image file is required',
        success: false,
      });
    }

    // Upload image to Cloudinary
    const imageUrl = await uploadOnCloudinary(req.file.buffer);

    // Create new slider image
    const newSlider = await Slider.create({
      image: imageUrl,
      title: title || 'Jalpaiguri Zilla School',
      subtitle: subtitle || 'Celebrating 150 Years of Excellence',
      order: parseInt(order),
      createdBy,
    });

    // Populate createdBy field
    const populatedSlider = await Slider.findById(newSlider._id)
      .populate('createdBy', 'name surname')
      .exec();

    res.status(201).json({
      message: 'Slider image added successfully',
      success: true,
      data: {
        sliderImage: populatedSlider,
      },
    });
  } catch (error) {
    console.error('Error adding slider image:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when adding slider image',
      success: false,
    });
  }
};

//* Add multiple slider images (Admin only)
export const addMultipleSliderImages = async (req, res) => {
  try {
    const { titles = [], subtitles = [] } = req.body;
    const createdBy = req.user.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'At least one image file is required',
        success: false,
      });
    }

    const sliderImages = [];

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Upload image to Cloudinary
      const imageUrl = await uploadOnCloudinary(file.path);

      const sliderData = {
        image: imageUrl,
        title: titles[i] || 'Jalpaiguri Zilla School',
        subtitle: subtitles[i] || 'Celebrating 150 Years of Excellence',
        order: i,
        createdBy,
      };

      const newSlider = await Slider.create(sliderData);
      const populatedSlider = await Slider.findById(newSlider._id)
        .populate('createdBy', 'name surname')
        .exec();

      sliderImages.push(populatedSlider);
    }

    res.status(201).json({
      message: `${sliderImages.length} slider images added successfully`,
      success: true,
      data: {
        sliderImages,
      },
    });
  } catch (error) {
    console.error('Error adding multiple slider images:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when adding slider images',
      success: false,
    });
  }
};

//* Update slider image (Admin only)
export const updateSliderImage = async (req, res) => {
  try {
    const { sliderId } = req.params;
    const { title, subtitle, order, isActive } = req.body;

    const slider = await Slider.findById(sliderId);
    if (!slider) {
      return res.status(404).json({
        message: 'Slider image not found',
        success: false,
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle image update if new file is provided
    if (req.file) {
      updateData.image = await uploadOnCloudinary(req.file.buffer);
    }

    const updatedSlider = await Slider.findByIdAndUpdate(sliderId, updateData, {
      new: true,
    }).populate('createdBy', 'name surname');

    res.status(200).json({
      message: 'Slider image updated successfully',
      success: true,
      data: {
        sliderImage: updatedSlider,
      },
    });
  } catch (error) {
    console.error('Error updating slider image:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when updating slider image',
      success: false,
    });
  }
};

//* Delete slider image (Admin only)
export const deleteSliderImage = async (req, res) => {
  try {
    const { sliderId } = req.params;

    const slider = await Slider.findById(sliderId);
    if (!slider) {
      return res.status(404).json({
        message: 'Slider image not found',
        success: false,
      });
    }

    await Slider.findByIdAndDelete(sliderId);

    res.status(200).json({
      message: 'Slider image deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting slider image:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when deleting slider image',
      success: false,
    });
  }
};

//* Get all slider images for admin management
export const getAllSliderImages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await Slider.countDocuments();

    // Get slider images with pagination
    const sliderImages = await Slider.find()
      .populate('createdBy', 'name surname email')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    res.status(200).json({
      message: 'Slider images fetched successfully',
      success: true,
      data: {
        sliderImages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching all slider images:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching slider images',
      success: false,
    });
  }
};

//* Reorder slider images (Admin only)
export const reorderSliderImages = async (req, res) => {
  try {
    const { orderUpdates } = req.body; // Array of { sliderId, order }

    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({
        message: 'orderUpdates must be an array',
        success: false,
      });
    }

    // Update orders in bulk
    const bulkOperations = orderUpdates.map(update => ({
      updateOne: {
        filter: { _id: update.sliderId },
        update: { order: update.order },
      },
    }));

    await Slider.bulkWrite(bulkOperations);

    // Fetch updated slider images
    const updatedSliderImages = await Slider.find()
      .populate('createdBy', 'name surname')
      .sort({ order: 1, createdAt: -1 })
      .exec();

    res.status(200).json({
      message: 'Slider images reordered successfully',
      success: true,
      data: {
        sliderImages: updatedSliderImages,
      },
    });
  } catch (error) {
    console.error('Error reordering slider images:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when reordering slider images',
      success: false,
    });
  }
};
