import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiMessageCircle } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Chat.css';

const ChatList = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Connection search state
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);
  const [startingChat, setStartingChat] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await axios.get('/chat');
      setChats(res.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch connections when the search bar is focused for the first time
  const loadConnections = async () => {
    if (connectionsLoaded) return;
    try {
      const myId = user.id || user._id;
      const res = await axios.get(`/users/${myId}`);
      setConnections(res.data.connections || []);
      setConnectionsLoaded(true);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    loadConnections();
  };

  // Start or open chat with a connection
  const startChat = async (connectionId) => {
    setStartingChat(connectionId);
    try {
      const res = await axios.post('/chat', { userId: connectionId });
      navigate(`/chat/${res.data._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat');
    } finally {
      setStartingChat(null);
    }
  };

  // Filter connections by search query, also exclude connections who already have a chat
  const existingChatUserIds = chats.map(chat => {
    const other = chat.participants?.find(p => (p._id || p.id) !== (user.id || user._id));
    return other?._id || other?.id;
  }).filter(Boolean);

  const filteredConnections = connections.filter(c => {
    const cId = c._id || c.id;
    if (!searchQuery.trim()) return true;
    return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Split into: connections with no existing chat, and those with one
  const newConnections = filteredConnections.filter(c => !existingChatUserIds.includes(c._id || c.id));
  const existingConnections = filteredConnections.filter(c => existingChatUserIds.includes(c._id || c.id));

  const getOtherUser = (chat) => {
    return chat.participants.find(p => (p._id || p.id) !== (user.id || user._id));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <div className="container">
        <h1 className="chat-list-title">Your Chats</h1>

        {/* ─── Connection Search Bar ─── */}
        <div className="chat-search-wrapper">
          <div className="chat-search-bar">
            <FiSearch className="chat-search-icon" />
            <input
              type="text"
              placeholder="Search connections to start a chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="chat-search-input"
            />
          </div>

          {/* Dropdown results */}
          {searchFocused && (searchQuery.trim() || connectionsLoaded) && (
            <div className="chat-search-dropdown glass">
              {!connectionsLoaded ? (
                <div className="chat-search-empty">Loading connections...</div>
              ) : filteredConnections.length === 0 ? (
                <div className="chat-search-empty">
                  {searchQuery ? 'No connections match your search' : 'No connections yet'}
                </div>
              ) : (
                <>
                  {newConnections.length > 0 && (
                    <>
                      {searchQuery && existingConnections.length > 0 && (
                        <div className="chat-search-label">Start new chat</div>
                      )}
                      {newConnections.map(c => {
                        const cId = c._id || c.id;
                        return (
                          <div
                            key={cId}
                            className="chat-search-item"
                            onMouseDown={() => startChat(cId)}
                          >
                            <Avatar name={c.name} src={c.profilePicture} size="sm" />
                            <div className="chat-search-item-info">
                              <span className="chat-search-item-name">{c.name}</span>
                              <span className="chat-search-item-role">{c.role}</span>
                            </div>
                            <span className="chat-search-item-action">
                              {startingChat === cId ? '...' : <><FiMessageCircle /> Chat</>}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {existingConnections.length > 0 && (
                    <>
                      {newConnections.length > 0 && (
                        <div className="chat-search-label">Existing chats</div>
                      )}
                      {existingConnections.map(c => {
                        const cId = c._id || c.id;
                        const chat = chats.find(ch => {
                          const other = ch.participants?.find(p => (p._id || p.id) !== (user.id || user._id));
                          return (other?._id || other?.id) === cId;
                        });
                        return (
                          <div
                            key={cId}
                            className="chat-search-item"
                            onMouseDown={() => chat && navigate(`/chat/${chat._id}`)}
                          >
                            <Avatar name={c.name} src={c.profilePicture} size="sm" />
                            <div className="chat-search-item-info">
                              <span className="chat-search-item-name">{c.name}</span>
                              <span className="chat-search-item-role">{c.role}</span>
                            </div>
                            <span className="chat-search-item-action existing">Open</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Existing Chats List ─── */}
        {chats.length === 0 ? (
          <div className="empty-state glass">
            <p>No chats yet. Search your connections above to start a conversation!</p>
          </div>
        ) : (
          <div className="chats-list">
            {chats.map(chat => {
              const otherUser = getOtherUser(chat);
              return (
                <Link
                  key={chat._id}
                  to={`/chat/${chat._id}`}
                  className="chat-item"
                >
                  <Avatar name={otherUser?.name} src={otherUser?.profilePicture} size="md" className="chat-avatar" />
                  <div className="chat-info">
                    <div className="chat-name">{otherUser?.name}</div>
                    <div className="chat-last-message">{chat.lastMessage || 'No messages yet'}</div>
                  </div>
                  <div className="chat-time">
                    {chat.lastMessageAt && new Date(chat.lastMessageAt).toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
