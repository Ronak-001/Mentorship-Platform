import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUserPlus, FiCheck, FiClock, FiVideo, FiMessageCircle, FiSearch } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Discover.css';

const Discover = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  // Per-user status: 'NOT_CONNECTED' | 'REQUEST_SENT' | 'CONNECTED' | 'loading'
  // NOTE: We intentionally do NOT show REQUEST_RECEIVED here — that belongs in the Requests page
  const [connectionStatus, setConnectionStatus] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/users');
      let filteredUsers = res.data;

      if (filter === 'mentors') {
        filteredUsers = filteredUsers.filter(u => u.role === 'mentor');
      } else if (filter === 'students') {
        filteredUsers = filteredUsers.filter(u => u.role === 'student');
      }

      setUsers(filteredUsers);

      // Fetch connection status for every user in parallel
      const statusEntries = await Promise.all(
        filteredUsers.map(async (u) => {
          const uid = u._id || u.id;
          try {
            const statusRes = await axios.get(`/users/${uid}/connection-status`);
            return [uid, statusRes.data.status];
          } catch {
            return [uid, 'NOT_CONNECTED'];
          }
        })
      );
      const statusMap = Object.fromEntries(statusEntries);
      setConnectionStatus(statusMap);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleConnect = async (userId) => {
    setConnectionStatus(prev => ({ ...prev, [userId]: 'loading' }));
    try {
      const res = await axios.post(`/users/${userId}/connect`);
      setConnectionStatus(prev => ({ ...prev, [userId]: res.data.status }));
    } catch (error) {
      const status = error.response?.data?.status;
      if (status) {
        setConnectionStatus(prev => ({ ...prev, [userId]: status }));
      } else {
        setConnectionStatus(prev => ({ ...prev, [userId]: 'NOT_CONNECTED' }));
        console.error('Error connecting:', error);
      }
    }
  };

  const startVideoCall = (userId) => {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    window.open(`/video/${roomId}`, '_blank');
  };

  const renderActionButtons = (userId) => {
    // Map REQUEST_RECEIVED to NOT_CONNECTED for Discover page display
    // Accept/Decline belongs in the Requests page, not here
    let status = connectionStatus[userId] || 'NOT_CONNECTED';
    if (status === 'REQUEST_RECEIVED') status = 'NOT_CONNECTED';

    switch (status) {
      case 'CONNECTED':
        return (
          <>
            <button className="btn  btn-success" disabled style={{ opacity: 0.8 }}>
              <FiCheck /> Connected
            </button>

            <button
              onClick={async () => {
                try {
                  const res = await axios.post('/chat', { userId });
                  window.location.href = `/chat/${res.data._id}`;
                } catch (error) {
                  console.error('Error creating chat:', error);
                }
              }}
              className="btn"
            >
              <FiMessageCircle />
            </button>
          </>
        );

      case 'REQUEST_SENT':
        return (
          <button className="btn btn-primary-discover" disabled style={{ opacity: 0.7 }}>
            <FiClock /> Request Sent
          </button>
        );

      case 'loading':
        return (
          <button className="btn btn-primary-discover" disabled>
            ...
          </button>
        );

      default: // NOT_CONNECTED
        return (
          <button onClick={() => handleConnect(userId)} className="btn btn-primary-discover">
            <FiUserPlus /> Connect
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="discover-container">
      <div className="container">
        <h1 className="discover-title">Discover People</h1>

        <div className="discover-search-bar">
          <FiSearch className="discover-search-icon" />
          <input
            type="text"
            placeholder="Search by name, role, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="discover-search-input"
          />
          {searchQuery && (
            <button
              className="discover-search-clear"
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
          {users
            .filter(u => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              const name = (u.name || '').toLowerCase();
              const role = (u.role || '').toLowerCase();
              const bio = (u.bio || '').toLowerCase();
              const skills = (u.skills || []).map(s => s.toLowerCase());
              return name.includes(q) || role.includes(q) || bio.includes(q) || skills.some(s => s.includes(q));
            })
            .map(discoveredUser => {
              const userId = discoveredUser._id || discoveredUser.id;
              return (
                <div key={userId} className="user-card glass">
                  <Link to={`/profile/${userId}`} className="user-link">
                    <Avatar name={discoveredUser.name} src={discoveredUser.profilePicture} size="md" className="user-avatar" />
                    <h3 className="user-name">{discoveredUser.name}</h3>
                    <p className="user-role">{discoveredUser.role}</p>
                    {discoveredUser.bio && (
                      <p className="user-bio">{discoveredUser.bio.substring(0, 100)}...</p>
                    )}
                  </Link>
                  <div className="user-actions">
                    {renderActionButtons(userId)}
                  </div>
                </div>
              );
            })}
        </div>

        {users.filter(u => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const name = (u.name || '').toLowerCase();
          const role = (u.role || '').toLowerCase();
          const bio = (u.bio || '').toLowerCase();
          const skills = (u.skills || []).map(s => s.toLowerCase());
          return name.includes(q) || role.includes(q) || bio.includes(q) || skills.some(s => s.includes(q));
        }).length === 0 && !loading && (
            <div className="empty-state glass">
              {searchQuery.trim() ? (
                <>
                  <p>No users found for "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className="btn btn-primary-discover" style={{ marginTop: '1rem' }}>
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <p>No other users to discover yet.</p>
                  <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>
                    Discover shows other people on the platform — you won&apos;t see yourself here.
                  </p>
                  <Link to={`/profile/${user.id || user._id}`} className="btn btn-primary-discover" style={{ marginTop: '1rem' }}>
                    Go to my profile
                  </Link>
                </>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default Discover;