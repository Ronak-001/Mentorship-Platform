import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FiUserPlus,
  FiCheck,
  FiClock,
  FiVideo,
  FiMessageCircle,
  FiSearch
} from 'react-icons/fi';
import Avatar from '../Avatar';
import './Discover.css';

const Discover = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({});

  const gridRef = useRef(null);
  const animationFrame = useRef(null);

  /* =============================
     FETCH USERS
  ============================== */

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

      setConnectionStatus(Object.fromEntries(statusEntries));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* =============================
     WAVE ANIMATION
  ============================== */

  const handleMouseMove = (e) => {
    if (!gridRef.current) return;

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    animationFrame.current = requestAnimationFrame(() => {
      const cards = gridRef.current.querySelectorAll('.user-card');

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        const radius = 280;      // wave spread
        const maxLift = 15;      // vertical movement
        const maxScale = 0.05;   // slight scale

        const intensity = Math.max(0, 1 - distance / radius);

        const lift = intensity * maxLift;
        const scale = 1 + intensity * maxScale;

        card.style.transform = `translateY(${-lift}px) scale(${scale})`;
      });
    });
  };

  const handleMouseLeave = () => {
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll('.user-card');

    cards.forEach((card) => {
      card.style.transform = 'translateY(0px) scale(1)';
    });
  };

  /* =============================
     CONNECTION LOGIC
  ============================== */

  const handleConnect = async (userId) => {
    setConnectionStatus(prev => ({ ...prev, [userId]: 'loading' }));
    try {
      const res = await axios.post(`/users/${userId}/connect`);
      setConnectionStatus(prev => ({ ...prev, [userId]: res.data.status }));
    } catch (error) {
      const status = error.response?.data?.status;
      setConnectionStatus(prev => ({
        ...prev,
        [userId]: status || 'NOT_CONNECTED'
      }));
    }
  };

  const startVideoCall = () => {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    window.open(`/video/${roomId}`, '_blank');
  };

  const renderActionButtons = (userId) => {
    let status = connectionStatus[userId] || 'NOT_CONNECTED';
    if (status === 'REQUEST_RECEIVED') status = 'NOT_CONNECTED';

    switch (status) {
      case 'CONNECTED':
        return (
          <>
            <button className="btn btn-success" disabled>
              <FiCheck /> Connected
            </button>
            <button onClick={() => startVideoCall(userId)} className="btn">
              <FiVideo />
            </button>
            <button
              onClick={async () => {
                const res = await axios.post('/chat', { userId });
                window.location.href = `/chat/${res.data._id}`;
              }}
              className="btn"
            >
              <FiMessageCircle />
            </button>
          </>
        );

      case 'REQUEST_SENT':
        return (
          <button className="btn btn-primary-discover" disabled>
            <FiClock /> Request Sent
          </button>
        );

      case 'loading':
        return (
          <button className="btn btn-primary-discover" disabled>
            ...
          </button>
        );

      default:
        return (
          <button
            onClick={() => handleConnect(userId)}
            className="btn btn-primary-discover"
          >
            <FiUserPlus /> Connect
          </button>
        );
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q) ||
      (u.skills || []).some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="discover-container">
      <div className="container">
        <h1 className="discover-title">Discover People</h1>

        <div
          className="users-grid"
          ref={gridRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {filteredUsers.map(discoveredUser => {
            const userId = discoveredUser._id || discoveredUser.id;

            return (
              <div key={userId} className="user-card glass">
                <Link to={`/profile/${userId}`} className="user-link">
                  <Avatar
                    name={discoveredUser.name}
                    src={discoveredUser.profilePicture}
                    size="md"
                    className="user-avatar"
                  />
                  <h3 className="user-name">{discoveredUser.name}</h3>
                  <p className="user-role">{discoveredUser.role}</p>
                </Link>

                <div className="user-actions">
                  {renderActionButtons(userId)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Discover;