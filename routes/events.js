const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    console.log('Events found:', events.length);
    res.json(events);
  } catch (err) {
    console.log('Error fetching events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'username').populate('participants', 'username email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, date, location, description, image, category, maxAttendees, tags, prerequisites, contactEmail, allowParticipation } = req.body;
    const event = new Event({
      title,
      date,
      location,
      description,
      image: image || 'https://via.placeholder.com/150',
      category,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      tags: tags || [],
      prerequisites: prerequisites || '',
      contactEmail: contactEmail || '',
      allowParticipation: allowParticipation || false,
      createdBy: req.user,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { title, date, location, description, image, category, maxAttendees, tags, prerequisites, contactEmail, allowParticipation, customQuestions } = req.body;
    event.title = title || event.title;
    event.date = date || event.date;
    event.location = location || event.location;
    event.description = description || event.description;
    event.image = image || event.image;
    event.category = category || event.category;
    event.maxAttendees = maxAttendees ? parseInt(maxAttendees) : event.maxAttendees;
    event.tags = tags || event.tags;
    event.prerequisites = prerequisites || event.prerequisites;
    event.contactEmail = contactEmail || event.contactEmail;
    event.allowParticipation = allowParticipation !== undefined ? allowParticipation : event.allowParticipation;
    event.customQuestions = customQuestions || event.customQuestions;

    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for event
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if participation is allowed
    if (!event.allowParticipation) {
      return res.status(400).json({ message: 'Participation is not allowed for this event' });
    }

    // Check if user is already a participant
    const existingParticipantIndex = event.participants.findIndex(participant =>
      participant.user.toString() === req.user
    );

    if (existingParticipantIndex !== -1) {
      // Unregister - remove from participants array
      event.participants.splice(existingParticipantIndex, 1);
      await event.save();
      return res.json({ message: 'Successfully unregistered from event' });
    } else {
      // Register - add to participants array with registration data
      const registrationData = {
        studentName: req.body.studentName,
        rollNo: req.body.rollNo,
        class: req.body.class,
        phone: req.body.phone,
        department: req.body.department,
        year: req.body.year,
        dietary: req.body.dietary,
        specialNeeds: req.body.specialNeeds,
        termsAccepted: req.body.termsAccepted || false,
        receiveUpdates: req.body.receiveUpdates || false,
      };

      // Validate required fields
      if (!registrationData.studentName || !registrationData.rollNo || !registrationData.class || !registrationData.phone || !registrationData.department || !registrationData.year) {
        return res.status(400).json({ message: 'Student name, roll number, class, phone, department, and year are required' });
      }

      if (!registrationData.termsAccepted) {
        return res.status(400).json({ message: 'You must accept the terms and conditions' });
      }

      // Process custom question answers
      const customAnswers = [];
      if (event.customQuestions && event.customQuestions.length > 0) {
        for (const question of event.customQuestions) {
          const answer = req.body[`custom_${question._id}`];
          if (answer !== undefined && answer !== null && answer !== '') {
            customAnswers.push({
              questionId: question._id.toString(),
              question: question.question,
              answer: question.type === 'checkbox' ? (Array.isArray(answer) ? answer : [answer]) : answer,
            });
          }
        }
      }

      event.participants.push({
        user: req.user,
        registrationData: registrationData,
        customAnswers: customAnswers,
        registeredAt: new Date(),
      });

      await event.save();
      return res.json({ message: 'Successfully registered for event' });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit feedback for event (protected)
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is a participant
    const participantIndex = event.participants.findIndex(participant =>
      participant.user.toString() === req.user
    );

    if (participantIndex === -1) {
      return res.status(400).json({ message: 'You must be registered for this event to submit feedback' });
    }

    const { rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Update feedback
    event.participants[participantIndex].feedback = {
      rating: parseInt(rating),
      comment: comment || '',
      submittedAt: new Date(),
    };

    await event.save();
    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await event.remove();
    res.json({ message: 'Event removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
