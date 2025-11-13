import Event from '../model/Event.model.js';
import { getUserWithRoles } from '../utils/userHelpers.js';

//* Create new event (Admin only)
export const createEvent = async (req, res) => {
  try {
    const { name, description, date, status = 'upcoming', icon = 'faUsers' } = req.body;
    const createdBy = req.user.userId;

    // Validate required fields
    if (!name || !description || !date) {
      return res.status(400).json({
        message: 'Name, description, and date are required fields',
        success: false,
      });
    }

    // Validate date is in the future
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({
        message: 'Event date must be in the future',
        success: false,
      });
    }

    // Create new event
    const newEvent = await Event.create({
      name,
      description,
      date: eventDate,
      status,
      icon,
      createdBy,
    });

    // Populate createdBy field with user details
    const populatedEvent = await Event.findById(newEvent._id)
      .populate('createdBy', 'name surname email')
      .exec();

    res.status(201).json({
      message: 'Event created successfully',
      success: true,
      data: {
        event: populatedEvent,
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when creating event',
      success: false,
    });
  }
};

//* Get all events
export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};
    if (status && ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    // Get total count
    const total = await Event.countDocuments(filter);

    // Get events with pagination and population
    const events = await Event.find(filter)
      .populate('createdBy', 'name surname email')
      .sort({ date: 1 }) // Sort by date ascending
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    res.status(200).json({
      message: 'Events fetched successfully',
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching events',
      success: false,
    });
  }
};

//* Get events grouped by month (for calendar view)
export const getEventsByMonth = async (req, res) => {
  try {
    const events = await Event.find({
      date: { $gte: new Date() }, // Only future events
    })
      .populate('createdBy', 'name surname email')
      .sort({ date: 1 })
      .exec();

    // Group events by month-year
    const eventsByMonth = events.reduce((acc, event) => {
      const eventDate = new Date(event.date);
      const monthYear = eventDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }

      acc[monthYear].push({
        _id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        formattedDate: eventDate.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        status: event.status,
        icon: event.icon,
        createdBy: event.createdBy,
      });

      return acc;
    }, {});

    // Convert to array format for frontend
    const formattedEvents = Object.entries(eventsByMonth).map(([month, events]) => ({
      month,
      events,
    }));

    res.status(200).json({
      message: 'Events grouped by month fetched successfully',
      success: true,
      data: {
        events: formattedEvents,
      },
    });
  } catch (error) {
    console.error('Error fetching events by month:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching events',
      success: false,
    });
  }
};

//* Update event (Admin only)
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, date, status, icon } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
        success: false,
      });
    }

    // Update event fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (date) updateData.date = new Date(date);
    if (status) updateData.status = status;
    if (icon) updateData.icon = icon;

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, { new: true }).populate(
      'createdBy',
      'name surname email'
    );

    res.status(200).json({
      message: 'Event updated successfully',
      success: true,
      data: {
        event: updatedEvent,
      },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when updating event',
      success: false,
    });
  }
};

//* Delete event (Admin only)
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
        success: false,
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      message: 'Event deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when deleting event',
      success: false,
    });
  }
};

//* Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('createdBy', 'name surname email profilepic')
      .exec();

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
        success: false,
      });
    }

    res.status(200).json({
      message: 'Event fetched successfully',
      success: true,
      data: {
        event,
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching event',
      success: false,
    });
  }
};
