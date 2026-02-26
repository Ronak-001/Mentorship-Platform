const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },          // the calendar date
    startTime: { type: String, required: true },        // "HH:mm"
    endTime: { type: String, required: true },        // "HH:mm"
    meetingLink: { type: String, default: '' },
    status: { type: String, enum: ['booked', 'completed'], default: 'booked' }
}, { timestamps: true });

// Fast lookup for student's sessions per program (not unique — allows rebooking after completion)
sessionSchema.index({ program: 1, student: 1 });
// Fast lookup for mentor schedule / conflict detection
sessionSchema.index({ mentor: 1, date: 1 });

module.exports = mongoose.model('Session', sessionSchema);
