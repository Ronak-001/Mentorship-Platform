import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiMessageCircle } from 'react-icons/fi';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import Avatar from '../Avatar';
import './Feed.css';

const Feed = ({ user }) => {
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat sidebar
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.get('/posts');
      setPosts(res.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await axios.get('/chat');
      setChats(res.data);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchChats();
  }, [fetchPosts, fetchChats]);

  const addPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (updatedPost) => {
    setPosts(prev =>
      prev.map(p => p._id === updatedPost._id ? updatedPost : p)
    );
  };

  const removePost = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const getOtherUser = (chat) => {
    return chat.participants?.find(p => (p._id || p.id) !== (user.id || user._id));
  };

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="feed-layout">
      {/* Main Feed */}
      <div className="feed-main">
        <div className="container">
          <h1 className="feed-title">Your Feed</h1>
          <CreatePost user={user} onPostCreated={addPost} />
          <div className="posts-list">
            {posts.length === 0 ? (
              <div className="empty-state glass">
                <p>No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onUpdate={updatePost}
                  onDelete={removePost}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="feed-chat-sidebar">
        <div className="sidebar-header">
          <FiMessageCircle /> Messages
        </div>
        {chatsLoading ? (
          <div className="sidebar-empty">Loading...</div>
        ) : chats.length === 0 ? (
          <div className="sidebar-empty">No conversations yet</div>
        ) : (
          <div className="sidebar-chat-list">
            {chats.map(chat => {
              const other = getOtherUser(chat);
              return (
                <Link key={chat._id} to={`/chat/${chat._id}`} className="sidebar-chat-item">
                  <Avatar name={other?.name} src={other?.profilePicture} size="sm" />
                  <div className="sidebar-chat-info">
                    <span className="sidebar-chat-name">{other?.name}</span>
                    <span className="sidebar-chat-last">{chat.lastMessage || 'No messages yet'}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link to="/chat" className="sidebar-view-all">View All Chats</Link>
      </div>
    </div>
  );
};

export default Feed;
