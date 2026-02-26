import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { FiSend, FiVideo, FiUserPlus, FiX, FiSearch, FiUsers, FiShield, FiSettings, FiShieldOff, FiHash, FiVolume2 } from 'react-icons/fi';
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

  // Channel state (for program groups)
  const [activeChannel, setActiveChannel] = useState(null);
  const activeChannelRef = useRef(null);
  const [channelMessages, setChannelMessages] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const groupRef = useRef(null);
  const initialChannelSet = useRef(false);

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

  // Keep refs in sync
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);
  useEffect(() => {
    groupRef.current = group;
  }, [group]);

  // ─── Fetch group (only on mount / id change) ───
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

      // Default to first channel ONLY on first load
      if (res.data.isProgramGroup && res.data.channels?.length > 0 && !initialChannelSet.current) {
        initialChannelSet.current = true;
        setActiveChannel(res.data.channels[0]);
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user._id || user.id]);

  // Initial fetch — runs once per group id
  useEffect(() => {
    initialChannelSet.current = false;
    fetchGroup();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fetch channel messages ───
  const fetchChannelMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    setChannelsLoading(true);
    try {
      const res = await axios.get(`/groups/${id}/channels/${channelId}/messages`);
      setChannelMessages(res.data);
    } catch (err) {
      console.error('Error fetching channel messages:', err);
    } finally {
      setChannelsLoading(false);
    }
  }, [id]);

  // Fetch messages when active channel changes
  useEffect(() => {
    if (activeChannel?._id) {
      fetchChannelMessages(activeChannel._id);
    }
  }, [activeChannel?._id, fetchChannelMessages]);

  // ─── Socket: handle incoming messages ───
  useEffect(() => {
    const handler = (data) => {
      if (data.groupId !== id) return;
      const g = groupRef.current;
      const ch = activeChannelRef.current;
      if (g?.isProgramGroup && ch) {
        fetchChannelMessages(ch._id);
      } else {
        // Regular group — re-fetch group to get new messages
        fetchGroup();
      }
    };
    socket.on('group-message', handler);
    return () => { socket.off('group-message', handler); };
  }, [id, fetchGroup, fetchChannelMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [group?.messages, channelMessages]);

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

  // ─── Send message ───
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isMember) return;
    try {
      if (group.isProgramGroup && activeChannel) {
        await axios.post(`/groups/${id}/channels/${activeChannel._id}/messages`, { text: message });
        setMessage('');
        fetchChannelMessages(activeChannel._id);
        socket.emit('group-message', { groupId: id, channelId: activeChannel._id, text: message, sender: user });
      } else {
        const res = await axios.post(`/groups/${id}/messages`, { text: message });
        setGroup(res.data);
        setMessage('');
        socket.emit('group-message', { groupId: id, text: message, sender: user });
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert(error.response.data.message || 'You cannot post in this channel');
      }
      console.error('Error sending message:', error);
    }
  };

  const startVideoCall = () => {
    window.open(`/video-call/${id}`, '_blank');
  };

  // ─── Add Members Logic ───
  const openAddMembers = async () => {
    setShowAddMembers(true);
    setSearchQuery('');
    setUsersLoading(true);
    try {
      const res = await axios.get('/users');
      setAllUsers(res.data);
    } catch {
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const closeAddMembers = () => {
    setShowAddMembers(false);
    setSearchQuery('');
  };

  const handleAddMember = async (userId) => {
    setAddingUserId(userId);
    try {
      const res = await axios.post(`/groups/${id}/add-member`, { userId });
      setGroup(res.data);
      setAllUsers(allUsers.filter(u => (u._id || u.id) !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding member');
    } finally {
      setAddingUserId(null);
    }
  };

  // ─── Make / Remove Admin ───
  const handleMakeAdmin = async (userId) => {
    try {
      const res = await axios.post(`/groups/${id}/make-admin`, { userId });
      setGroup(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      const res = await axios.post(`/groups/${id}/remove-admin`, { userId });
      setGroup(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  // ─── Group Settings ───
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
    if (file) {
      setSettingsFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', settingsForm.name);
      formData.append('description', settingsForm.description);
      if (settingsFile) {
        formData.append('groupPicture', settingsFile);
      }
      const res = await axios.put(`/groups/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGroup(res.data);
      closeSettings();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ─── Switch channel handler ───
  const switchChannel = (ch) => {
    setActiveChannel(ch);
    // fetchChannelMessages will be triggered by the useEffect watching activeChannel._id
  };

  // ─── Computed values ───
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

  const isProgramGroup = group?.isProgramGroup;
  const displayMessages = isProgramGroup ? channelMessages : (group?.messages || []);

  const canSendInChannel = () => {
    if (!isProgramGroup) return true;
    if (!activeChannel) return false;
    if (activeChannel.type === 'announcements') return isAdmin;
    return true;
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

  // ═════════════════════════════════════════════
  //   RENDER — program group has sidebar layout
  // ═════════════════════════════════════════════
  return (
    <div className="group-detail-container">
      <div className="container">
        {/* ── Header ── */}
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
                {isMember && !isProgramGroup && (
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

        {/* ── Members Panel ── */}
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
                      {isCreator && isMemberAdmin && !isMemberCreator && (
                        <button
                          onClick={() => handleRemoveAdmin(mid)}
                          className="remove-admin-btn"
                          title="Remove Admin"
                        >
                          <FiShieldOff />
                        </button>
                      )}
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

        {/* ════════════════════════════════════
            PROGRAM GROUP — sidebar channel layout
            ════════════════════════════════════ */}
        {isMember && isProgramGroup && group.channels?.length > 0 ? (
          <div className="pgc-layout">
            {/* Channel sidebar (left) */}
            <div className="pgc-sidebar glass">
              <div className="pgc-sidebar-title">Channels</div>
              {group.channels.map(ch => (
                <button
                  key={ch._id}
                  className={`pgc-channel-btn ${activeChannel?._id === ch._id ? 'active' : ''}`}
                  onClick={() => switchChannel(ch)}
                >
                  {ch.type === 'announcements' ? <FiVolume2 /> : <FiHash />}
                  <span>{ch.name}</span>
                </button>
              ))}
            </div>

            {/* Chat area (right) */}
            <div className="pgc-chat-area">
              <div className="pgc-chat-header glass">
                {activeChannel?.type === 'announcements' ? <FiVolume2 /> : <FiHash />}
                <span className="pgc-chat-header-name">{activeChannel?.name || 'Select a channel'}</span>
                {activeChannel?.type === 'announcements' && !isAdmin && (
                  <span className="pgc-readonly-badge">Read only</span>
                )}
              </div>

              <div className="pgc-messages glass">
                <div className="messages-list">
                  {channelsLoading ? (
                    <div className="pgc-empty-msg">Loading messages...</div>
                  ) : displayMessages.length === 0 ? (
                    <div className="pgc-empty-msg">
                      {activeChannel?.type === 'announcements'
                        ? '📢 No announcements yet'
                        : '💬 No messages yet. Start the conversation!'}
                    </div>
                  ) : (
                    displayMessages.map((msg, index) => {
                      const sender = msg.sender || {};
                      return (
                        <div key={msg._id || index} className="group-message">
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
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {canSendInChannel() && (
                <form onSubmit={handleSend} className="group-input-container glass">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message #${activeChannel?.name || 'channel'}...`}
                    className="chat-input"
                  />
                  <button type="submit" className="send-btn">
                    <FiSend />
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : isMember ? (
          /* ════════════════════════════════════
             REGULAR GROUP — existing flat chat
             ════════════════════════════════════ */
          <>
            <div className="group-messages-container glass">
              <div className="messages-list">
                {displayMessages.length === 0 ? (
                  <div className="pgc-empty-msg">No messages yet. Start the conversation!</div>
                ) : (
                  displayMessages.map((msg, index) => {
                    const sender = msg.sender || {};
                    return (
                      <div key={msg._id || index} className="group-message">
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
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
