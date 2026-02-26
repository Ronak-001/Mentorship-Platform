const express = require('express');
const Program = require('../models/Program');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const router = express.Router();

// ─── Create Program ───
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') {
            return res.status(403).json({ message: 'Only mentors can create programs' });
        }

        const { title, description, skillsCovered, level, format, schedule, outcomes } = req.body;

        const program = new Program({
            title, description, skillsCovered, level, format, schedule, outcomes,
            mentor: req.user._id
        });

        // Auto-create group for Group programs
        if (format === 'Group') {
            const group = new Group({
                name: title,
                description: `Program group for: ${title}`,
                admin: req.user._id,
                admins: [req.user._id],
                members: [req.user._id],
                isProgramGroup: true,
                channels: [
                    { name: 'Community Chat', type: 'community', messages: [] },
                    { name: 'Announcements', type: 'announcements', messages: [] }
                ]
            });
            await group.save();
            program.group = group._id;
            group.program = program._id;
            await group.save();
        }

        await program.save();
        await program.populate('mentor', 'name profilePicture');

        res.status(201).json(program);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Edit Program ───
router.put('/:id', auth, async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        if (!program) return res.status(404).json({ message: 'Program not found' });
        if (program.mentor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, description, skillsCovered, level, schedule, outcomes } = req.body;
        if (title) program.title = title;
        if (description) program.description = description;
        if (skillsCovered) program.skillsCovered = skillsCovered;
        if (level) program.level = level;
        if (typeof schedule !== 'undefined') program.schedule = schedule;
        if (outcomes) program.outcomes = outcomes;

        await program.save();
        await program.populate('mentor', 'name profilePicture');

        // Update group name if it's a group program
        if (program.group && title) {
            await Group.findByIdAndUpdate(program.group, { name: title });
        }

        res.json(program);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Browse All Programs ───
router.get('/', async (req, res) => {
    try {
        const programs = await Program.find()
            .populate('mentor', 'name profilePicture bio skills')
            .sort({ createdAt: -1 });
        res.json(programs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── My Programs (mentor) ───
router.get('/my', auth, async (req, res) => {
    try {
        const programs = await Program.find({ mentor: req.user._id })
            .populate('mentor', 'name profilePicture')
            .sort({ createdAt: -1 });
        res.json(programs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Program Detail ───
router.get('/:id', async (req, res) => {
    try {
        const program = await Program.findById(req.params.id)
            .populate('mentor', 'name profilePicture bio skills')
            .populate('group');
        if (!program) return res.status(404).json({ message: 'Program not found' });
        res.json(program);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Join Group Program ───
router.post('/:id/join', auth, async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        if (!program) return res.status(404).json({ message: 'Program not found' });
        if (program.format !== 'Group') {
            return res.status(400).json({ message: 'This is a 1:1 program. Use booking instead.' });
        }
        if (!program.group) {
            return res.status(500).json({ message: 'Program group not found' });
        }

        const group = await Group.findById(program.group);
        if (!group) return res.status(500).json({ message: 'Group not found' });

        const uid = req.user._id.toString();
        if (group.members.some(m => m.toString() === uid)) {
            return res.status(400).json({ message: 'You have already joined this program' });
        }

        group.members.push(req.user._id);
        await group.save();

        res.json({ message: 'Joined successfully', groupId: group._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Delete Program ───
router.delete('/:id', auth, async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        if (!program) return res.status(404).json({ message: 'Program not found' });
        if (program.mentor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Remove linked group if exists
        if (program.group) {
            await Group.findByIdAndDelete(program.group);
        }

        await Program.findByIdAndDelete(req.params.id);
        res.json({ message: 'Program deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
