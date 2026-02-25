import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiCheck, FiX, FiInbox } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Requests.css';

const Requests = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/users/connection-requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (senderId) => {
        setActionLoading(prev => ({ ...prev, [senderId]: 'accepting' }));
        try {
            await axios.post(`/users/${senderId}/accept`);
            // Remove from list
            setRequests(prev => prev.filter(r => (r._id || r.id) !== senderId));
        } catch (error) {
            console.error('Error accepting request:', error);
        } finally {
            setActionLoading(prev => ({ ...prev, [senderId]: null }));
        }
    };

    const handleDecline = async (senderId) => {
        setActionLoading(prev => ({ ...prev, [senderId]: 'declining' }));
        try {
            await axios.post(`/users/${senderId}/decline`);
            // Remove from list
            setRequests(prev => prev.filter(r => (r._id || r.id) !== senderId));
        } catch (error) {
            console.error('Error declining request:', error);
        } finally {
            setActionLoading(prev => ({ ...prev, [senderId]: null }));
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Loading requests...</div>
            </div>
        );
    }

    return (
        <div className="requests-container">
            <div className="container">
                <h1 className="requests-title"><FiInbox /> Connection Requests</h1>

                {requests.length === 0 ? (
                    <div className="empty-state glass">
                        <p>No pending connection requests.</p>
                        <Link to="/discover" className="btn btn-primary-request">
                            Discover People
                        </Link>
                    </div>
                ) : (
                    <div className="requests-list">
                        {requests.map(sender => {
                            const senderId = sender._id || sender.id;
                            const action = actionLoading[senderId];
                            return (
                                <div key={senderId} className="request-card glass">
                                    <Link to={`/profile/${senderId}`} className="request-user-info">
                                        <Avatar name={sender.name} src={sender.profilePicture} size="md" />
                                        <div className="request-user-details">
                                            <h3 className="request-user-name">{sender.name}</h3>
                                            <p className="request-user-role">{sender.role}</p>
                                            {sender.bio && (
                                                <p className="request-user-bio">{sender.bio.substring(0, 80)}...</p>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="request-actions">
                                        <button
                                            onClick={() => handleAccept(senderId)}
                                            className="btn btn-primary-request"
                                            disabled={!!action}
                                        >
                                            {action === 'accepting' ? '...' : <><FiCheck /> Accept</>}
                                        </button>
                                        <button
                                            onClick={() => handleDecline(senderId)}
                                            className="btn btn-danger"
                                            disabled={!!action}
                                        >
                                            {action === 'declining' ? '...' : <><FiX /> Decline</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Requests;
