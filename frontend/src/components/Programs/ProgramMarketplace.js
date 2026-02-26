import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiSearch } from 'react-icons/fi';
import './Programs.css';

const ProgramMarketplace = ({ user }) => {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState([]);
    const [myPrograms, setMyPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('browse'); // 'browse' | 'my'
    const [searchQuery, setSearchQuery] = useState('');
    const isMentor = user.role === 'mentor';

    // Filter programs by title, skills, or mentor name
    const filterPrograms = (list) => {
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(p =>
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.mentor?.name?.toLowerCase().includes(q) ||
            p.skillsCovered?.some(s => s.toLowerCase().includes(q))
        );
    };

    const filteredPrograms = filterPrograms(programs);
    const filteredMyPrograms = filterPrograms(myPrograms);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchPrograms(); }, []);

    const fetchPrograms = async () => {
        try {
            const res = await axios.get('/programs');
            setPrograms(res.data);
            if (isMentor) {
                const myRes = await axios.get('/programs/my');
                setMyPrograms(myRes.data);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this program? This cannot be undone.')) return;
        try {
            await axios.delete(`/programs/${id}`);
            setMyPrograms(myPrograms.filter(p => p._id !== id));
            setPrograms(programs.filter(p => p._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting');
        }
    };

    if (loading) return <div className="programs-page"><div className="loading-box">Loading programs...</div></div>;

    return (
        <div className="programs-page">
            <div className="programs-header">
                <div>
                    <h1>Programs</h1>
                    <p className="page-sub">Discover mentorship programs and start learning</p>
                </div>
                {isMentor && (
                    <button className="btn btn-primary" onClick={() => navigate('/programs/new')}>
                        <FiPlus /> Create Program
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="programs-search-bar">
                <FiSearch className="programs-search-icon" />
                <input
                    type="text"
                    placeholder="Search by program name, skill, or mentor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="programs-search-input"
                />
            </div>

            {/* Tabs for mentor */}
            {isMentor && (
                <div className="page-tabs">
                    <button className={`page-tab ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>
                        Browse All
                    </button>
                    <button className={`page-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
                        My Programs
                    </button>
                </div>
            )}

            {/* Browse Tab */}
            {tab === 'browse' && (
                <>
                    {filteredPrograms.length === 0 ? (
                        <div className="programs-empty">
                            <h3>{searchQuery ? 'No programs match your search' : 'No programs yet'}</h3>
                            <p>{searchQuery ? 'Try a different keyword' : "Check back later or create one if you're a mentor!"}</p>
                        </div>
                    ) : (
                        <div className="programs-grid">
                            {filteredPrograms.map(prog => (
                                <div key={prog._id} className="program-card" onClick={() => navigate(`/programs/${prog._id}`)}>
                                    <div className="card-top">
                                        <span className="badge badge-format">{prog.format}</span>
                                        <span className="badge badge-level">{prog.level}</span>
                                    </div>
                                    <h3>{prog.title}</h3>
                                    <p className="card-desc">{prog.description}</p>
                                    {prog.skillsCovered?.length > 0 && (
                                        <div className="card-skills">
                                            {prog.skillsCovered.slice(0, 4).map((s, i) => (
                                                <span key={i} className="skill-chip">{s}</span>
                                            ))}
                                            {prog.skillsCovered.length > 4 && <span className="skill-chip">+{prog.skillsCovered.length - 4}</span>}
                                        </div>
                                    )}
                                    <div className="card-mentor">
                                        <img src={prog.mentor?.profilePicture || `https://ui-avatars.com/api/?name=${prog.mentor?.name}&background=6366f1&color=fff`} alt="" />
                                        <span>{prog.mentor?.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* My Programs Tab */}
            {tab === 'my' && isMentor && (
                <>
                    {filteredMyPrograms.length === 0 ? (
                        <div className="programs-empty">
                            <h3>{searchQuery ? 'No matching programs' : 'No programs created yet'}</h3>
                            <p>{searchQuery ? 'Try a different keyword' : 'Start by creating your first mentorship program!'}</p>
                        </div>
                    ) : (
                        <div className="programs-grid">
                            {filteredMyPrograms.map(prog => (
                                <div key={prog._id} className="program-card">
                                    <div className="card-top">
                                        <span className="badge badge-format">{prog.format}</span>
                                        <span className="badge badge-level">{prog.level}</span>
                                    </div>
                                    <h3>{prog.title}</h3>
                                    <p className="card-desc">{prog.description}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                        <button className="btn btn-outline" onClick={() => navigate(`/programs/${prog._id}`)}>
                                            View
                                        </button>
                                        <button className="btn btn-outline" onClick={() => navigate(`/programs/${prog._id}/edit`)}>
                                            <FiEdit2 /> Edit
                                        </button>
                                        {prog.group && (
                                            <button className="btn btn-outline" onClick={() => navigate(`/groups/${prog.group}`)}>
                                                <FiUsers /> Group
                                            </button>
                                        )}
                                        <button className="btn btn-danger" onClick={() => handleDelete(prog._id)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProgramMarketplace;
