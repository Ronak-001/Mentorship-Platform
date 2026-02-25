const express = require('express');
const Session = require('../models/Session');
const Program = require('../models/Program');
const MentorAvailability = require('../models/MentorAvailability');
const auth = require('../middleware/auth');
const router = express.Router();

// ─── Book a 1:1 Session ───
router.post('/book', auth, async (req, res) => {
    try {
        const { programId, date, startTime, endTime } = req.body;

        // Validate program
        const program = await Program.findById(programId);
        if (!program) return res.status(404).json({ message: 'Program not found' });
        if (program.format !== '1:1') {
            return res.status(400).json({ message: 'This program is not 1:1 format' });
        }

        // Check one ACTIVE session per student per program (completed sessions don't block rebooking)
        const existing = await Session.findOne({ program: programId, student: req.user._id, status: 'booked' });
        if (existing) {
            return res.status(400).json({ message: 'You already have an active session booked for this program' });
        }

        // Check slot not already taken (same mentor, same date, same startTime)
        const dateObj = new Date(date + 'T00:00:00Z');
        const conflict = await Session.findOne({
            mentor: program.mentor,
            date: dateObj,
            startTime: startTime,
            status: 'booked'
        });
        if (conflict) {
            return res.status(400).json({ message: 'This slot is already booked' });
        }

        const session = new Session({
            program: programId,
            mentor: program.mentor,
            student: req.user._id,
            date: dateObj,
            startTime,
            endTime,
            status: 'booked'
        });

        await session.save();
        await session.populate('mentor', 'name profilePicture');
        await session.populate('student', 'name profilePicture');
        await session.populate('program', 'title format');

        res.status(201).json(session);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate session conflict — please try a different slot' });
        }
        res.status(500).json({ message: error.message });
    }
});

// ─── Get My Sessions ───
router.get('/', auth, async (req, res) => {
    try {
        const query = req.user.role === 'mentor'
            ? { mentor: req.user._id }
            : { student: req.user._id };

        const sessions = await Session.find(query)
            .populate('mentor', 'name profilePicture')
            .populate('student', 'name profilePicture')
            .populate('program', 'title format')
            .sort({ date: -1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Get Session Detail ───
router.get('/:id', auth, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate('mentor', 'name profilePicture')
            .populate('student', 'name profilePicture')
            .populate('program', 'title format');

        if (!session) return res.status(404).json({ message: 'Session not found' });

        const uid = req.user._id.toString();
        if (session.mentor._id.toString() !== uid && session.student._id.toString() !== uid) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Mark Session Completed ───
router.patch('/:id/complete', auth, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.mentor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the mentor can mark complete' });
        }

        session.status = 'completed';
        await session.save();

        await session.populate('mentor', 'name profilePicture');
        await session.populate('student', 'name profilePicture');
        await session.populate('program', 'title format');

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Update Meeting Link (mentor only) ───
router.patch('/:id/link', auth, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.mentor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the mentor can update the meeting link' });
        }

        session.meetingLink = req.body.meetingLink || '';
        await session.save();

        await session.populate('mentor', 'name profilePicture');
        await session.populate('student', 'name profilePicture');
        await session.populate('program', 'title format');

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
