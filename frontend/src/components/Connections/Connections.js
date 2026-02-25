import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiSearch } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Connections.css';

const Connections = ({ user }) => {
    const { id } = useParams();
    const [connections, setConnections] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                setLoading(true);
                const [connRes, userRes] = await Promise.all([
                    axios.get(`/users/${id}/connections`),
                    axios.get(`/users/${id}`)
                ]);
                setConnections(connRes.data);
                setProfileName(userRes.data.name);
            } catch (error) {
                console.error('Error fetching connections:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConnections();
    }, [id]);

    const isOwnProfile = (user._id || user.id) === id;

    const filteredConnections = connections
        .filter(c => {
            if (filter === 'mentors') return c.role === 'mentor';
            if (filter === 'students') return c.role === 'student';
            return true;
        })
        .filter(c => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            const name = (c.name || '').toLowerCase();
            const role = (c.role || '').toLowerCase();
            const bio = (c.bio || '').toLowerCase();
            const skills = (c.skills || []).map(s => s.toLowerCase());
            return name.includes(q) || role.includes(q) || bio.includes(q) || skills.some(s => s.includes(q));
        });

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Loading connections...</div>
            </div>
        );
    }

    return (
        <div className="connections-page">
            <div className="container">
                <h1 className="connections-title">
                    {isOwnProfile ? 'My Connections' : `${profileName}'s Connections`}
                    <span className="connections-count">{connections.length}</span>
                </h1>

                <div className="connections-search-bar">
                    <FiSearch className="connections-search-icon" />
                    <input
                        type="text"
                        placeholder="Search connections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="connections-search-input"
                    />
                    {searchQuery && (
                        <button
                            className="connections-search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="filter-buttons">
                    <button
                        onClick={() => setFilter('all')}
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('mentors')}
                        className={`filter-btn ${filter === 'mentors' ? 'active' : ''}`}
                    >
                        Mentors
                    </button>
                    <button
                        onClick={() => setFilter('students')}
                        className={`filter-btn ${filter === 'students' ? 'active' : ''}`}
                    >
                        Students
                    </button>
                </div>

                <div className="users-grid">
                    {filteredConnections.map(conn => {
                        const connId = conn._id || conn.id;
                        return (
                            <div key={connId} className="user-card glass">
                                <Link to={`/profile/${connId}`} className="user-link">
                                    <Avatar name={conn.name} src={conn.profilePicture} size="md" className="user-avatar" />
                                    <h3 className="user-name">{conn.name}</h3>
                                    <p className="user-role">{conn.role}</p>
                                    {conn.bio && (
                                        <p className="user-bio">{conn.bio.substring(0, 100)}...</p>
                                    )}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {filteredConnections.length === 0 && !loading && (
                    <div className="empty-state glass">
                        {searchQuery.trim() ? (
                            <>
                                <p>No connections found for "{searchQuery}"</p>
                                <button onClick={() => setSearchQuery('')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                    Clear Search
                                </button>
                            </>
                        ) : filter !== 'all' ? (
                            <p>No {filter === 'mentors' ? 'mentor' : 'student'} connections yet.</p>
                        ) : (
                            <>
                                <p>No connections yet.</p>
                                <Link to="/discover" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                    Discover People
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Connections;
