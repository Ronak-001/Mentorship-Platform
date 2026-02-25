import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import './Feed.css';



const Feed = ({ user }) => {
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);



  const fetchPosts = useCallback(async () => {
    try {
      setError(null);        // reset previous errors
      setLoading(true);      // important if you ever re-fetch

      const res = await axios.get('/posts');
      setPosts(res.data);

    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load feed');

    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
    <div className="feed-container">
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
  );
};

export default Feed;
