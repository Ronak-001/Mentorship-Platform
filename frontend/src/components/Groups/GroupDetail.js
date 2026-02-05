import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { FiSend, FiVideo, FiUserPlus } from 'react-icons/fi';
import './Groups.css';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

const GroupDetail = ({ user }) => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await axios.get(`/groups/${id}`);
      setGroup(res.data);
      setIsMember(res.data.members?.some(
        m => (m._id || m.id) === (user.id || user._id)
      ));
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const handleReceiveMessage = useCallback((data) => {
    if (data.groupId === id) {
      fetchGroup();
    }
  }, [id, fetchGroup]);

  useEffect(() => {
    fetchGroup();
    
    socket.on('group-message', handleReceiveMessage);

    return () => {
      socket.off('group-message');
    };
  }, [id, fetchGroup, handleReceiveMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [group?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoin = async () => {
    try {
      await axios.post(`/groups/${id}/join`);
      fetchGroup();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isMember) return;

    try {
      const res = await axios.post(`/groups/${id}/messages`, { text: message });
      setGroup(res.data);
      setMessage('');
      
      socket.emit('group-message', {
        groupId: id,
        text: message,
        sender: user
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startVideoCall = () => {
    const roomId = `group-${id}-${Date.now()}`;
    window.open(`/video/${roomId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading group...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container">
        <div className="error">Group not found</div>
      </div>
    );
  }

  return (
    <div className="group-detail-container">
      <div className="container">
        <div className="group-detail-header glass">
          <Link to="/groups" className="back-link">← Back to Groups</Link>
          <div className="group-header-content">
            {group.groupPicture && (
              <img
                src={`http://localhost:5000${group.groupPicture}`}
                alt={group.name}
                className="group-header-image"
              />
            )}
            <div>
              <h1 className="group-header-name">{group.name}</h1>
              <p className="group-header-description">{group.description}</p>
              <div className="group-header-meta">
                <span>{group.members?.length || 0} members</span>
                {isMember && (
                  <button onClick={startVideoCall} className="btn btn-primary">
                    <FiVideo /> Group Video Call
                  </button>
                )}
              </div>
            </div>
          </div>
          {!isMember && (
            <button onClick={handleJoin} className="btn btn-primary">
              <FiUserPlus /> Join Group
            </button>
          )}
        </div>

        {isMember ? (
          <>
            <div className="group-messages-container glass">
              <div className="messages-list">
                {group.messages?.map((msg, index) => {
                  const sender = msg.sender || {};
                  return (
                    <div key={index} className="group-message">
                      <img
                        src={sender.profilePicture || 'https://via.placeholder.com/30'}
                        alt={sender.name}
                        className="message-avatar"
                      />
                      <div className="message-content">
                        <div className="message-sender">{sender.name}</div>
                        <div className="message-text">{msg.text}</div>
                        <div className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSend} className="group-input-container glass">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-input"
              />
              <button type="submit" className="send-btn">
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="not-member glass">
            <p>Join this group to participate in discussions and video calls.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
