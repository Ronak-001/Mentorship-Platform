import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import './Programs.css';

const MyPrograms = ({ user }) => {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchMyPrograms(); }, []);

    const fetchMyPrograms = async () => {
        try {
            const res = await axios.get('/programs/my');
            setPrograms(res.data);
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
            setPrograms(programs.filter(p => p._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting');
        }
    };

    if (user.role !== 'mentor') {
        return <div className="programs-page"><div className="loading-box">Only mentors can view this page</div></div>;
    }

    if (loading) return <div className="programs-page"><div className="loading-box">Loading...</div></div>;

    return (
        <div className="programs-page">
            <div className="programs-header">
                <div>
                    <h1>My Programs</h1>
                    <p className="page-sub">Manage the programs you've created</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/programs/new')}>
                    <FiPlus /> Create Program
                </button>
            </div>

            {programs.length === 0 ? (
                <div className="programs-empty">
                    <h3>No programs created yet</h3>
                    <p>Start by creating your first mentorship program!</p>
                </div>
            ) : (
                <div className="programs-grid">
                    {programs.map(prog => (
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
        </div>
    );
};

export default MyPrograms;
