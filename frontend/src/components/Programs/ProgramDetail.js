import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiCalendar, FiClock, FiEdit2, FiCheck, FiUsers } from 'react-icons/fi';
import './Programs.css';

const ProgramDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);

    // Booking state (for 1:1)
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [booking, setBooking] = useState(false);
    const [booked, setBooked] = useState(false);
    const [existingSession, setExistingSession] = useState(null);

    // Group join
    const [joined, setJoined] = useState(false);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchProgram();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchProgram = async () => {
        try {
            const res = await axios.get(`/programs/${id}`);
            setProgram(res.data);

            // Check if already joined group
            if (res.data.format === 'Group' && res.data.group) {
                const members = res.data.group.members || [];
                const uid = user._id || user.id;
                if (members.some(m => (m._id || m).toString() === uid)) {
                    setJoined(true);
                }
            }

            // Check if already have an ACTIVE (booked) 1:1 session (only for students, not the owning mentor)
            const mentorId = res.data.mentor._id || res.data.mentor;
            const uid = user._id || user.id;
            if (res.data.format === '1:1' && mentorId !== uid) {
                try {
                    const sessRes = await axios.get('/sessions');
                    const active = sessRes.data.find(s => (s.program?._id === id || s.program === id) && s.status === 'booked');
                    if (active) setExistingSession(active);
                } catch { }
            }

            // Default date = tomorrow
            const tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            setSelectedDate(tmr.toISOString().slice(0, 10));
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate && program?.format === '1:1') fetchSlots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const fetchSlots = async () => {
        setSlotsLoading(true);
        setSelectedSlot(null);
        try {
            const res = await axios.get(`/availability/${program.mentor._id || program.mentor}/slots?date=${selectedDate}`);
            setSlots(res.data);
        } catch {
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedSlot) return;
        setBooking(true);
        try {
            const res = await axios.post('/sessions/book', {
                programId: id,
                date: selectedDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime
            });
            setBooked(true);
            setExistingSession(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            await axios.post(`/programs/${id}/join`);
            setJoined(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Error joining');
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <div className="programs-page"><div className="loading-box">Loading...</div></div>;
    if (!program) return <div className="programs-page"><div className="loading-box">Program not found</div></div>;

    const isOwner = (program.mentor._id || program.mentor) === (user._id || user.id);

    return (
        <div className="programs-page">
            <button className="back-btn" onClick={() => navigate('/programs')}>
                <FiArrowLeft /> Back to Programs
            </button>

            <div className="detail-layout">
                {/* ── Main ── */}
                <div className="detail-main">
                    <div className="detail-badges">
                        <span className="badge badge-format">{program.format}</span>
                        <span className="badge badge-level">{program.level}</span>
                    </div>

                    <h1>{program.title}</h1>

                    {program.schedule && (
                        <p style={{ color: '#a5b4fc', marginBottom: '1rem' }}>
                            <FiClock style={{ marginRight: 4 }} /> {program.schedule}
                        </p>
                    )}

                    <div className="detail-section">
                        <h2>Description</h2>
                        <p>{program.description}</p>
                    </div>

                    {program.skillsCovered?.length > 0 && (
                        <div className="detail-section">
                            <h2>Skills Covered</h2>
                            <div className="skills-wrap">
                                {program.skillsCovered.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
                            </div>
                        </div>
                    )}

                    {program.outcomes?.length > 0 && (
                        <div className="detail-section">
                            <h2>🎯 What You'll Achieve</h2>
                            <ul className="outcomes-list">
                                {program.outcomes.map((o, i) => (
                                    <li key={i}><FiCheck className="outcome-icon" /> {o}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ── 1:1 Booking Section ── */}
                    {program.format === '1:1' && !isOwner && (!existingSession || existingSession.status === 'completed') && (
                        <div className="booking-section">
                            <h3><FiCalendar /> Book a Session</h3>
                            <input
                                type="date"
                                className="date-input"
                                value={selectedDate}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                            {slotsLoading ? (
                                <p className="no-slots">Loading slots...</p>
                            ) : slots.length > 0 ? (
                                <>
                                    <div className="slots-grid">
                                        {slots.map((slot, i) => (
                                            <button
                                                key={i}
                                                className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {slot.startTime} — {slot.endTime}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedSlot && (
                                        <button className="btn btn-success full-width" style={{ marginTop: '1rem' }}
                                            onClick={handleBook} disabled={booking}>
                                            {booking ? 'Booking...' : `Book ${selectedSlot.startTime} — ${selectedSlot.endTime}`}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="no-slots">No available slots for this date</p>
                            )}
                        </div>
                    )}

                    {/* Already booked */}
                    {existingSession && (
                        <div className="booking-success">
                            <h3>✅ Session {booked ? 'Booked!' : 'Already Booked'}</h3>
                            <p>
                                📅 {new Date(existingSession.date).toLocaleDateString()} &nbsp;
                                🕐 {existingSession.startTime} — {existingSession.endTime} &nbsp;
                                <span className={`status-pill status-${existingSession.status}`}>{existingSession.status}</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Sidebar ── */}
                <div className="detail-sidebar">
                    <div className="sidebar-card">
                        <div className="mentor-row" onClick={() => navigate(`/profile/${program.mentor._id || program.mentor}`)}>
                            <img src={program.mentor?.profilePicture || `https://ui-avatars.com/api/?name=${program.mentor?.name}&background=6366f1&color=fff`} alt="" />
                            <div>
                                <h3>{program.mentor?.name}</h3>
                                <p>Mentor</p>
                            </div>
                        </div>
                        {program.mentor?.bio && <p className="mentor-bio-sm">{program.mentor.bio}</p>}
                    </div>

                    <div className="sidebar-card sidebar-actions">
                        {isOwner ? (
                            <>
                                <button className="btn btn-primary full-width" onClick={() => navigate(`/programs/${id}/edit`)}>
                                    <FiEdit2 /> Edit Program
                                </button>
                                {program.group && (
                                    <button className="btn btn-outline full-width" onClick={() => navigate(`/groups/${program.group._id || program.group}`)}>
                                        <FiUsers /> Open Group Chat
                                    </button>
                                )}
                            </>
                        ) : program.format === 'Group' ? (
                            joined ? (
                                <>
                                    <div className="joined-badge">✅ You've joined this program</div>
                                    <button className="btn btn-outline full-width" onClick={() => navigate(`/groups/${program.group._id || program.group}`)}>
                                        <FiUsers /> Open Group Chat
                                    </button>
                                </>
                            ) : (
                                <button className="btn btn-success full-width" onClick={handleJoin} disabled={joining}>
                                    {joining ? 'Joining...' : 'Join Program'}
                                </button>
                            )
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramDetail;
