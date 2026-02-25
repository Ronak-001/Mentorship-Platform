import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { FiSend, FiVideo } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Chat.css';

// Socket is created INSIDE the component lifecycle now — prevents stale sockets
// from accumulating across page navigations (was the #1 freeze cause)

const Chat = ({ user }) => {
  const { id } = useParams();
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const fetchChat = useCallback(async () => {
    try {
      // Check if id is a MongoDB ObjectId (24 hex characters) or user ID
      const isChatId = /^[0-9a-fA-F]{24}$/.test(id);

      if (isChatId) {
        const res = await axios.get(`/chat/${id}`);
        setChat(res.data);
      } else {
        const res = await axios.post('/chat', { userId: id });
        setChat(res.data);
        if (res.data._id) {
          window.history.replaceState(null, '', `/chat/${res.data._id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Create socket once per chat session and clean up on unmount/id change
    const socket = io(process.env.REACT_APP_SOCKET_URL || window.location.origin, {
      transports: ['websocket'], // skip polling — faster connection
    });
    socketRef.current = socket;

    fetchChat();
    socket.emit('join-chat', id);

    // Append new message directly to state — no DB re-fetch needed
    socket.on('receive-message', (data) => {
      if (data.chatId === id && data.message) {
        setChat(prev => {
          if (!prev) return prev;
          // Avoid duplicate if we're the sender (we already updated optimistically)
          const alreadyExists = prev.messages.some(m => m._id === data.message._id);
          if (alreadyExists) return prev;
          return { ...prev, messages: [...prev.messages, data.message] };
        });
      }
    });

    return () => {
      socket.emit('leave-chat', id);
      socket.disconnect(); // properly disconnect on navigate away
    };
  }, [id, fetchChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const textToSend = message;
    setMessage('');

    try {
      const res = await axios.post(`/chat/${id}/messages`, { text: textToSend });
      const newMsg = res.data.message;

      // Optimistically append our own message immediately
      setChat(prev => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, newMsg] };
      });

      // Broadcast to other participants via socket
      socketRef.current?.emit('send-message', {
        chatId: id,
        message: newMsg,
        sender: user
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(textToSend); // restore on failure
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
      <div className="chat-header">
        <Link to="/chat" className="back-link">← Back</Link>
        <div className="chat-header-user">
          <Avatar name={otherUser?.name} src={otherUser?.profilePicture} size="sm" className="chat-header-avatar" />
          <div>
            <div className="chat-header-name">{otherUser?.name}</div>
            <div className="chat-header-role">{otherUser?.role}</div>
          </div>
        </div>
        <button onClick={startVideoCall} className="video-call-btn">
          <FiVideo /> Video Call
        </button>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {chat.messages?.map((msg, index) => {
            const isOwn = (msg.sender._id || msg.sender.id || msg.sender) === (user.id || user._id);
            return (
              <div key={msg._id || index} className={`message ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && (
                  <Avatar name={msg.sender.name} src={msg.sender.profilePicture} size="sm" className="message-avatar" />
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

      <form onSubmit={handleSend} className="chat-input-container">
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
