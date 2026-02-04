import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { FiSend, FiVideo } from 'react-icons/fi';
import './Chat.css';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

const Chat = ({ user }) => {
  const { id } = useParams();
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChat();
    
    socket.emit('join-chat', id);
    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('receive-message');
      socket.emit('leave-chat', id);
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = async () => {
    try {
      // Check if id is a MongoDB ObjectId (24 hex characters) or user ID
      const isChatId = /^[0-9a-fA-F]{24}$/.test(id);
      
      if (isChatId) {
        // It's a chat ID, fetch directly
        const res = await axios.get(`/chat/${id}`);
        setChat(res.data);
      } else {
        // It's a user ID, get or create chat
        const res = await axios.post('/chat', { userId: id });
        setChat(res.data);
        // Update URL if needed
        if (res.data._id) {
          window.history.replaceState(null, '', `/chat/${res.data._id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveMessage = (data) => {
    if (data.chatId === id) {
      fetchChat();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const res = await axios.post(`/chat/${id}/messages`, { text: message });
      setChat(res.data);
      setMessage('');
      
      socket.emit('send-message', {
        chatId: id,
        text: message,
        sender: user
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startVideoCall = () => {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    window.open(`/video/${roomId}`, '_blank');
  };

  const getOtherUser = () => {
    return chat?.participants.find(p => (p._id || p.id) !== (user.id || user._id));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading chat...</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="container">
        <div className="error">Chat not found</div>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="chat-container">
      <div className="chat-header glass">
        <Link to="/chat" className="back-link">← Back</Link>
        <div className="chat-header-user">
          <img
            src={otherUser?.profilePicture || 'https://via.placeholder.com/40'}
            alt={otherUser?.name}
            className="chat-header-avatar"
          />
          <div>
            <div className="chat-header-name">{otherUser?.name}</div>
            <div className="chat-header-role">{otherUser?.role}</div>
          </div>
        </div>
        <button onClick={startVideoCall} className="video-call-btn">
          <FiVideo /> Video Call
        </button>
      </div>

      <div className="messages-container glass">
        <div className="messages-list">
          {chat.messages?.map((msg, index) => {
            const isOwn = (msg.sender._id || msg.sender.id) === (user.id || user._id);
            return (
              <div key={index} className={`message ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && (
                  <img
                    src={msg.sender.profilePicture || 'https://via.placeholder.com/30'}
                    alt={msg.sender.name}
                    className="message-avatar"
                  />
                )}
                <div className="message-content">
                  {!isOwn && <div className="message-sender">{msg.sender.name}</div>}
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

      <form onSubmit={handleSend} className="chat-input-container glass">
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
    </div>
  );
};

export default Chat;
