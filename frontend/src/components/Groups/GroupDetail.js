import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { FiSend, FiVideo, FiUserPlus, FiX, FiSearch, FiUsers, FiShield, FiSettings, FiShieldOff } from 'react-icons/fi';
import { resolveMediaUrl } from '../../utils/url';
import Avatar from '../Avatar';
import './Groups.css';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

const GroupDetail = ({ user }) => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const messagesEndRef = useRef(null);

  // Add Members modal state
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingUserId, setAddingUserId] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Members sidebar state
  const [showMembers, setShowMembers] = useState(false);

  // Group Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '' });
  const [settingsFile, setSettingsFile] = useState(null);
  const [settingsPreview, setSettingsPreview] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await axios.get(`/groups/${id}`);
      setGroup(res.data);
      const userId = user.id || user._id;
      setIsMember(res.data.members?.some(
        m => (m._id || m.id) === userId
      ));
      const adminIds = (res.data.admins || []).map(a => a._id || a.id);
      const cId = res.data.admin?._id || res.data.admin?.id || res.data.admin;
      setIsAdmin(adminIds.includes(userId) || cId === userId);
      setIsCreator(cId === userId);
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
    return () => { socket.off('group-message'); };
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
      socket.emit('group-message', { groupId: id, text: message, sender: user });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startVideoCall = () => {
    const roomId = `group-${id}-${Date.now()}`;
    window.open(`/video/${roomId}`, '_blank');
  };

  // ─── Add Members Logic ───
  const openAddMembers = async () => {
    setShowAddMembers(true);
    setSearchQuery('');
    setUsersLoading(true);
    try {
      const res = await axios.get('/users');
      setAllUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const closeAddMembers = () => {
    setShowAddMembers(false);
    setSearchQuery('');
    setAddingUserId(null);
  };

  const handleAddMember = async (userId) => {
    setAddingUserId(userId);
    try {
      const res = await axios.post(`/groups/${id}/add-member`, { userId });
      setGroup(res.data);
      await fetchGroup();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add member';
      alert(msg);
    } finally {
      setAddingUserId(null);
    }
  };

  // ─── Make / Remove Admin Logic ───
  const handleMakeAdmin = async (userId) => {
    try {
      const res = await axios.post(`/groups/${id}/make-admin`, { userId });
      setGroup(res.data);
      await fetchGroup();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to promote member';
      alert(msg);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      const res = await axios.post(`/groups/${id}/remove-admin`, { userId });
      setGroup(res.data);
      await fetchGroup();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to remove admin';
      alert(msg);
    }
  };

  // ─── Group Settings Logic ───
  const openSettings = () => {
    setSettingsForm({
      name: group.name || '',
      description: group.description || ''
    });
    setSettingsFile(null);
    setSettingsPreview(null);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
    setSettingsFile(null);
    setSettingsPreview(null);
  };

  const handleSettingsFileChange = (e) => {
    const file = e.target.files[0];
    setSettingsFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSettingsPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setSettingsPreview(null);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const data = new FormData();
      data.append('name', settingsForm.name);
      data.append('description', settingsForm.description);
      if (settingsFile) {
        data.append('groupPicture', settingsFile);
      }
      const res = await axios.put(`/groups/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGroup(res.data);
      await fetchGroup();
      closeSettings();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save settings';
      alert(msg);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filter users: exclude current members and match search query
  const memberIds = group?.members?.map(m => m._id || m.id) || [];
  const adminIds = (group?.admins || []).map(a => a._id || a.id);
  const creatorId = group?.admin?._id || group?.admin?.id || group?.admin;
  const filteredUsers = allUsers.filter(u => {
    const uid = u._id || u.id;
    if (memberIds.includes(uid)) return false;
    if (!searchQuery.trim()) return true;
    return u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
                src={resolveMediaUrl(group.groupPicture)}
                alt={group.name}
                className="group-header-image"
              />
            )}
            <div>
              <h1 className="group-header-name">{group.name}</h1>
              <p className="group-header-description">{group.description}</p>
              <div className="group-header-meta">
                <span
                  className="members-count-link"
                  onClick={() => setShowMembers(!showMembers)}
                  title="View members"
                >
                  <FiUsers style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {group.members?.length || 0} members
                </span>
                {isMember && (
                  <button onClick={startVideoCall} className="btn btn-primary">
                    <FiVideo /> Group Video Call
                  </button>
                )}
                {isAdmin && (
                  <button onClick={openAddMembers} className="btn btn-primary">
                    <FiUserPlus /> Add Members
                  </button>
                )}
                {isAdmin && (
                  <button onClick={openSettings} className="btn btn-secondary">
                    <FiSettings /> Settings
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

        {/* Members Panel */}
        {showMembers && (
          <div className="members-panel glass">
            <div className="members-panel-header">
              <h3>Members ({group.members?.length || 0})</h3>
              <button onClick={() => setShowMembers(false)} className="close-btn">
                <FiX />
              </button>
            </div>
            <div className="members-list">
              {group.members?.map((member) => {
                const mid = member._id || member.id;
                const isMemberAdmin = adminIds.includes(mid) || mid === creatorId;
                const isMemberCreator = mid === creatorId;
                const myId = user.id || user._id;
                return (
                  <div key={mid} className="member-item">
                    <Link to={`/profile/${mid}`} className="member-link">
                      <Avatar name={member.name} src={member.profilePicture} size="sm" />
                      <span className="member-name">{member.name}</span>
                    </Link>
                    <div className="member-actions">
                      {isMemberCreator && (
                        <span className="admin-badge creator">Creator</span>
                      )}
                      {isMemberAdmin && !isMemberCreator && (
                        <span className="admin-badge">Admin</span>
                      )}
                      {/* Creator can remove admin from others */}
                      {isCreator && isMemberAdmin && !isMemberCreator && (
                        <button
                          onClick={() => handleRemoveAdmin(mid)}
                          className="remove-admin-btn"
                          title="Remove Admin"
                        >
                          <FiShieldOff />
                        </button>
                      )}
                      {/* Admins can promote non-admins (not yourself) */}
                      {isAdmin && !isMemberAdmin && mid !== myId && (
                        <button
                          onClick={() => handleMakeAdmin(mid)}
                          className="make-admin-btn"
                          title="Make Admin"
                        >
                          <FiShield /> Admin
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isMember ? (
          <>
            <div className="group-messages-container glass">
              <div className="messages-list">
                {group.messages?.map((msg, index) => {
                  const sender = msg.sender || {};
                  return (
                    <div key={index} className="group-message">
                      <Avatar
                        name={sender.name}
                        src={sender.profilePicture}
                        size="sm"
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

      {/* ─── Add Members Modal ─── */}
      {showAddMembers && (
        <div className="add-members-overlay" onClick={closeAddMembers}>
          <div className="add-members-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="add-members-header">
              <h2>Add Members</h2>
              <button onClick={closeAddMembers} className="close-btn">
                <FiX />
              </button>
            </div>

            <div className="add-members-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>

            <div className="add-members-list">
              {usersLoading ? (
                <div className="add-members-empty">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="add-members-empty">
                  {searchQuery ? 'No users found matching your search' : 'All users are already members'}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const uid = u._id || u.id;
                  return (
                    <div key={uid} className="add-member-item">
                      <Avatar name={u.name} src={u.profilePicture} size="sm" />
                      <div className="add-member-info">
                        <span className="add-member-name">{u.name}</span>
                        <span className="add-member-role">{u.role}</span>
                      </div>
                      <button
                        onClick={() => handleAddMember(uid)}
                        className="btn btn-primary btn-sm"
                        disabled={addingUserId === uid}
                      >
                        {addingUserId === uid ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Group Settings Modal ─── */}
      {showSettings && (
        <div className="add-members-overlay" onClick={closeSettings}>
          <div className="add-members-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="add-members-header">
              <h2>Group Settings</h2>
              <button onClick={closeSettings} className="close-btn">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSettingsSave} className="settings-form">
              <div className="settings-field">
                <label>Group Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="search-input"
                  required
                />
              </div>

              <div className="settings-field">
                <label>Description</label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  className="search-input settings-textarea"
                  rows="3"
                  placeholder="Group description..."
                />
              </div>

              <div className="settings-field">
                <label>Group Photo</label>
                {(settingsPreview || group.groupPicture) && (
                  <img
                    src={settingsPreview || resolveMediaUrl(group.groupPicture)}
                    alt="Preview"
                    className="settings-photo-preview"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSettingsFileChange}
                  className="search-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary settings-save-btn"
                disabled={settingsSaving}
              >
                {settingsSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
