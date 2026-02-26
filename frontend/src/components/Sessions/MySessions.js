import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCalendar, FiCheck, FiLink, FiExternalLink, FiSave, FiX, FiPlus, FiClock } from 'react-icons/fi';
import '../Programs/Programs.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MySessions = ({ user }) => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tab state
    const [tab, setTab] = useState('sessions'); // 'sessions' | 'availability'
    const isMentor = user.role === 'mentor';

    // Expanded session (for mentor to add/edit meeting link)
    const [expandedId, setExpandedId] = useState(null);
    const [linkInput, setLinkInput] = useState('');
    const [savingLink, setSavingLink] = useState(false);

    // Availability state (mentor only)
    const [slotDuration, setSlotDuration] = useState(30);
    const [weeklySlots, setWeeklySlots] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [availLoaded, setAvailLoaded] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchSessions(); }, []);

    useEffect(() => {
        if (tab === 'availability' && isMentor && !availLoaded) fetchAvailability();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const fetchSessions = async () => {
        try {
            const res = await axios.get('/sessions');
            setSessions(res.data);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async () => {
        try {
            const res = await axios.get(`/availability/${user._id || user.id}`);
            if (res.data.slotDuration) setSlotDuration(res.data.slotDuration);
            if (res.data.weeklySlots) setWeeklySlots(res.data.weeklySlots);
            setAvailLoaded(true);
        } catch { }
    };

    const handleComplete = async (id) => {
        try {
            const res = await axios.patch(`/sessions/${id}/complete`);
            setSessions(sessions.map(s => s._id === id ? res.data : s));
        } catch (err) {
            alert(err.response?.data?.message || 'Error');
        }
    };

    const toggleExpand = (session) => {
        if (expandedId === session._id) {
            setExpandedId(null);
            setLinkInput('');
        } else {
            setExpandedId(session._id);
            setLinkInput(session.meetingLink || '');
        }
    };

    const handleSaveLink = async (id) => {
        setSavingLink(true);
        try {
            const res = await axios.patch(`/sessions/${id}/link`, { meetingLink: linkInput });
            setSessions(sessions.map(s => s._id === id ? res.data : s));
            setExpandedId(null);
            setLinkInput('');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving link');
        } finally {
            setSavingLink(false);
        }
    };

    // Availability handlers
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
    const handleSaveAvail = async () => {
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

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (loading) return <div className="sessions-page"><div className="loading-box">Loading sessions...</div></div>;

    const booked = sessions.filter(s => s.status === 'booked');
    const completed = sessions.filter(s => s.status === 'completed');

    const renderSessionCard = (s) => {
        const d = new Date(s.date);
        const isExpanded = expandedId === s._id;

        return (
            <div key={s._id} className="session-card-wrap">
                <div
                    className={`session-card ${isMentor && s.status === 'booked' ? 'clickable' : ''}`}
                    onClick={() => isMentor && s.status === 'booked' ? toggleExpand(s) : null}
                >
                    <div className="session-date-block">
                        <span className="s-day">{d.getUTCDate()}</span>
                        <span className="s-month">{months[d.getUTCMonth()]}</span>
                    </div>
                    <div className="session-center">
                        <h3>{s.program?.title || 'Session'}</h3>
                        <div className="session-meta">
                            <span>🕐 {s.startTime} — {s.endTime}</span>
                            <span>👤 {isMentor ? s.student?.name : s.mentor?.name}</span>
                        </div>
                        {!isMentor && s.meetingLink && (
                            <a href={s.meetingLink} target="_blank" rel="noopener noreferrer"
                                className="meeting-link-badge" onClick={e => e.stopPropagation()}>
                                <FiExternalLink /> Join Meeting
                            </a>
                        )}
                        {isMentor && s.meetingLink && (
                            <span className="meeting-link-set"><FiLink /> Link added</span>
                        )}
                    </div>
                    <span className={`status-pill status-${s.status}`}>{s.status}</span>
                    {isMentor && s.status === 'booked' && (
                        <button className="btn btn-success"
                            onClick={(e) => { e.stopPropagation(); handleComplete(s._id); }}
                            title="Mark completed">
                            <FiCheck />
                        </button>
                    )}
                </div>

                {isExpanded && (
                    <div className="session-expand-panel">
                        <div className="link-editor">
                            <FiLink className="link-editor-icon" />
                            <input type="url" className="link-input"
                                placeholder="Paste meeting link (Zoom, Google Meet, etc.)"
                                value={linkInput} onChange={e => setLinkInput(e.target.value)}
                                onClick={e => e.stopPropagation()} />
                            <button className="btn btn-primary btn-sm"
                                onClick={(e) => { e.stopPropagation(); handleSaveLink(s._id); }}
                                disabled={savingLink}>
                                <FiSave /> {savingLink ? 'Saving...' : 'Save'}
                            </button>
                            <button className="btn btn-outline btn-sm"
                                onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}>
                                <FiX />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="sessions-page">
            <h1><FiCalendar style={{ marginRight: 8 }} /> Sessions</h1>
            <p className="page-sub">
                {isMentor ? 'Manage your sessions and availability' : 'Your booked sessions'}
            </p>

            {/* Tabs for mentors */}
            {isMentor && (
                <div className="page-tabs">
                    <button className={`page-tab ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>
                        <FiCalendar /> My Sessions
                    </button>
                    <button className={`page-tab ${tab === 'availability' ? 'active' : ''}`} onClick={() => setTab('availability')}>
                        <FiClock /> Availability
                    </button>
                </div>
            )}

            {/* Sessions Tab */}
            {tab === 'sessions' && (
                <>
                    {sessions.length === 0 ? (
                        <div className="programs-empty">
                            <h3>No sessions yet</h3>
                            <p>{isMentor ? 'Sessions will appear here when students book them.' : 'Browse 1:1 programs and book a session!'}</p>
                            {!isMentor && (
                                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/programs')}>
                                    Browse Programs
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {booked.length > 0 && (
                                <>
                                    <h2 style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>Upcoming</h2>
                                    <div className="sessions-list">{booked.map(renderSessionCard)}</div>
                                </>
                            )}
                            {completed.length > 0 && (
                                <>
                                    <h2 style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>Completed</h2>
                                    <div className="sessions-list">
                                        {completed.map(s => {
                                            const d = new Date(s.date);
                                            return (
                                                <div key={s._id} className="session-card" style={{ opacity: 0.7 }}>
                                                    <div className="session-date-block">
                                                        <span className="s-day">{d.getUTCDate()}</span>
                                                        <span className="s-month">{months[d.getUTCMonth()]}</span>
                                                    </div>
                                                    <div className="session-center">
                                                        <h3>{s.program?.title || 'Session'}</h3>
                                                        <div className="session-meta">
                                                            <span>🕐 {s.startTime} — {s.endTime}</span>
                                                            <span>👤 {isMentor ? s.student?.name : s.mentor?.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className="status-pill status-completed">completed</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Availability Tab (mentor only) */}
            {tab === 'availability' && isMentor && (
                <>
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

                    <button className="btn btn-primary save-btn" onClick={handleSaveAvail} disabled={saving}>
                        <FiSave /> {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Availability'}
                    </button>
                </>
            )}
        </div>
    );
};

export default MySessions;
