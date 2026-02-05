import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../Avatar';
import './Chat.css';

const ChatList = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await axios.get('/chat');
      setChats(res.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

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
        {chats.length === 0 ? (
          <div className="empty-state glass">
            <p>No chats yet. Start a conversation!</p>
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
