const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  category: {
    type: String,
    required: true,
  },
  maxAttendees: {
    type: Number,
    default: null,
  },
  tags: [{
    type: String,
  }],
  prerequisites: {
    type: String,
    default: '',
  },
  contactEmail: {
    type: String,
    default: '',
  },
  allowParticipation: {
    type: Boolean,
    default: true,
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registrationData: {
      studentName: {
        type: String,
        required: true,
      },
      rollNo: {
        type: String,
        required: true,
      },
      class: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      department: {
        type: String,
        required: true,
      },
      year: {
        type: String,
        required: true,
      },
      dietary: {
        type: String,
        default: null,
      },
      specialNeeds: {
        type: String,
        default: null,
      },
      termsAccepted: {
        type: Boolean,
        default: false,
      },
      receiveUpdates: {
        type: Boolean,
        default: false,
      },
    },
    customAnswers: [{
      questionId: {
        type: String,
        required: true,
      },
      question: {
        type: String,
        required: true,
      },
      answer: {
        type: mongoose.Schema.Types.Mixed, // Can be string, array, etc.
        required: true,
      },
    }],
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: '',
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customQuestions: [{
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'select', 'checkbox', 'radio'],
      required: true,
    },
    options: [String], // For select, checkbox, radio types
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Event', eventSchema);
