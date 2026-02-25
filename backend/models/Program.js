const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skillsCovered: [{ type: String, trim: true }],
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    format: { type: String, enum: ['1:1', 'Group'], required: true },
    schedule: { type: String, default: '' },           // optional text like "Mon–Fri 8pm"
    outcomes: [{ type: String }],                      // what mentee achieves
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }  // auto-linked for Group programs
}, { timestamps: true });

programSchema.index({ mentor: 1 });
programSchema.index({ format: 1 });

module.exports = mongoose.model('Program', programSchema);
