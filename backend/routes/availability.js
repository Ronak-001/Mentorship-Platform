const express = require('express');
const MentorAvailability = require('../models/MentorAvailability');
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const router = express.Router();

// ─── Get Mentor Availability ───
router.get('/:mentorId', async (req, res) => {
    try {
        let avail = await MentorAvailability.findOne({ mentor: req.params.mentorId });
        if (!avail) {
            // Return empty defaults
            avail = { mentor: req.params.mentorId, slotDuration: 30, weeklySlots: [] };
        }
        res.json(avail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Set / Update Availability ───
router.put('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') {
            return res.status(403).json({ message: 'Only mentors can set availability' });
        }

        const { slotDuration, weeklySlots } = req.body;

        // Validate duration
        if (slotDuration < 10 || slotDuration > 60) {
            return res.status(400).json({ message: 'Slot duration must be 10–60 minutes' });
        }

        const avail = await MentorAvailability.findOneAndUpdate(
            { mentor: req.user._id },
            { slotDuration, weeklySlots },
            { upsert: true, new: true, runValidators: true }
        );

        res.json(avail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Generate Available Slots for a Date ───
router.get('/:mentorId/slots', async (req, res) => {
    try {
        const { date } = req.query;   // "YYYY-MM-DD"
        if (!date) return res.status(400).json({ message: 'date query param required' });

        const avail = await MentorAvailability.findOne({ mentor: req.params.mentorId });
        if (!avail || avail.weeklySlots.length === 0) {
            return res.json([]);
        }

        // Which day of week is this date?
        const dateObj = new Date(date + 'T00:00:00Z');
        const dow = dateObj.getUTCDay();  // 0=Sun

        // Find matching slots for this day
        const daySlots = avail.weeklySlots.filter(s => s.day === dow);
        if (daySlots.length === 0) return res.json([]);

        // Generate time slots
        const generated = [];
        for (const window of daySlots) {
            const [sh, sm] = window.startTime.split(':').map(Number);
            const [eh, em] = window.endTime.split(':').map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;

            for (let m = startMin; m + avail.slotDuration <= endMin; m += avail.slotDuration) {
                const slotStart = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
                const slotEndM = m + avail.slotDuration;
                const slotEnd = `${String(Math.floor(slotEndM / 60)).padStart(2, '0')}:${String(slotEndM % 60).padStart(2, '0')}`;
                generated.push({ startTime: slotStart, endTime: slotEnd });
            }
        }

        // Remove already-booked slots for that date
        const dayStart = new Date(date + 'T00:00:00Z');
        const dayEnd = new Date(date + 'T23:59:59Z');
        const booked = await Session.find({
            mentor: req.params.mentorId,
            date: { $gte: dayStart, $lte: dayEnd },
            status: 'booked'
        });

        const bookedTimes = new Set(booked.map(s => s.startTime));
        const available = generated.filter(s => !bookedTimes.has(s.startTime));

        res.json(available);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
