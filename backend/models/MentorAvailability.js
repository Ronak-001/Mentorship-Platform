const mongoose = require('mongoose');

const weeklySlotSchema = new mongoose.Schema({
    day: { type: Number, required: true, min: 0, max: 6 },  // 0=Sun … 6=Sat
    startTime: { type: String, required: true },                   // "HH:mm"
    endTime: { type: String, required: true }                    // "HH:mm"
}, { _id: false });

const mentorAvailabilitySchema = new mongoose.Schema({
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slotDuration: { type: Number, required: true, min: 10, max: 60, default: 30 },   // minutes
    weeklySlots: [weeklySlotSchema]
}, { timestamps: true });

module.exports = mongoose.model('MentorAvailability', mentorAvailabilitySchema);
