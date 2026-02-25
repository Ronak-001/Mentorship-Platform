import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiPlus, FiX, FiSave } from 'react-icons/fi';
import '../Programs/Programs.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MentorAvailability = ({ user }) => {
    const navigate = useNavigate();
    const [slotDuration, setSlotDuration] = useState(30);
    const [weeklySlots, setWeeklySlots] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => { fetchAvailability(); }, []);

    const fetchAvailability = async () => {
        try {
            const res = await axios.get(`/availability/${user._id || user.id}`);
            if (res.data.slotDuration) setSlotDuration(res.data.slotDuration);
            if (res.data.weeklySlots) setWeeklySlots(res.data.weeklySlots);
        } catch { }
    };

    const addSlot = () => {
        setWeeklySlots([...weeklySlots, { day: 1, startTime: '09:00', endTime: '17:00' }]);
    };

    const removeSlot = (idx) => {
        setWeeklySlots(weeklySlots.filter((_, i) => i !== idx));
    };

    const updateSlot = (idx, field, value) => {
        const updated = [...weeklySlots];
        updated[idx] = { ...updated[idx], [field]: field === 'day' ? parseInt(value) : value };
        setWeeklySlots(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await axios.put('/availability', { slotDuration, weeklySlots });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving');
        } finally {
            setSaving(false);
        }
    };

    if (user.role !== 'mentor') {
        return <div className="programs-page"><div className="loading-box">Only mentors can set availability</div></div>;
    }

    return (
        <div className="programs-page" style={{ maxWidth: 750 }}>
            <button className="back-btn" onClick={() => navigate(-1)}>
                <FiArrowLeft /> Back
            </button>
            <h1>My Availability</h1>
            <p className="page-sub">Set your weekly schedule. Students will book slots based on this.</p>

            <div className="avail-section">
                <h2>Slot Duration</h2>
                <div className="duration-row">
                    <label>Each session lasts</label>
                    <input type="number" min={10} max={60}
                        value={slotDuration} onChange={e => setSlotDuration(Math.min(60, Math.max(10, parseInt(e.target.value) || 10)))} />
                    <span>minutes (10–60)</span>
                </div>
            </div>

            <div className="avail-section">
                <h2>Weekly Time Windows</h2>
                <div className="slot-rows">
                    {weeklySlots.map((slot, i) => (
                        <div key={i} className="slot-row">
                            <select value={slot.day} onChange={e => updateSlot(i, 'day', e.target.value)}>
                                {DAYS.map((d, j) => <option key={j} value={j}>{d}</option>)}
                            </select>
                            <input type="time" value={slot.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} />
                            <span className="arrow">→</span>
                            <input type="time" value={slot.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} />
                            <button className="btn-icon danger" onClick={() => removeSlot(i)}><FiX /></button>
                        </div>
                    ))}
                </div>
                <button className="add-slot-btn" onClick={addSlot}>
                    <FiPlus /> Add time window
                </button>
            </div>

            <button className="btn btn-primary save-btn" onClick={handleSave} disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Availability'}
            </button>
        </div>
    );
};

export default MentorAvailability;
