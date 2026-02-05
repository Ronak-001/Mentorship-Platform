import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUserPlus, FiVideo, FiMessageCircle } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Discover.css';

const Discover = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      let filteredUsers = res.data;
      
      if (filter === 'mentors') {
        filteredUsers = filteredUsers.filter(u => u.role === 'mentor');
      } else if (filter === 'students') {
        filteredUsers = filteredUsers.filter(u => u.role === 'student');
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await axios.post(`/users/${userId}/connect`);
      fetchUsers();
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const startVideoCall = (userId) => {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    window.open(`/video/${roomId}`, '_blank');
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
          {users.map(discoveredUser => {
            const userId = discoveredUser._id || discoveredUser.id;
            const isConnected = discoveredUser.connections?.some(
              conn => (conn._id || conn) === (user.id || user._id)
            );
            
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
                  {!isConnected && (
                    <button
                      onClick={() => handleConnect(userId)}
                      className="btn btn-primary"
                    >
                      <FiUserPlus /> Connect
                    </button>
                  )}
                  {isConnected && (
                    <>
                      <button
                        onClick={() => startVideoCall(userId)}
                        className="btn"
                      >
                        <FiVideo />
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
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {users.length === 0 && (
          <div className="empty-state glass">
            <p>No other users to discover yet.</p>
            <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>
              Discover shows other people on the platform — you won&apos;t see yourself here.
            </p>
            <Link to={`/profile/${user.id || user._id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Go to my profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
