import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiHeart, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import './Feed.css';

const PostCard = ({ post, currentUser, onUpdate, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const isLiked = post.likes?.some(like => 
    (typeof like === 'object' ? like._id : like) === (currentUser.id || currentUser._id)
  );

  const handleLike = async () => {
    try {
      const res = await axios.post(`/posts/${post._id}/like`);
      onUpdate(res.data);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(`/posts/${post._id}/comment`, { text: commentText });
      onUpdate(res.data);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`/posts/${post._id}`);
      onDelete(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const author = post.author || {};
  const authorId = author._id || author.id;

  return (
    <div className="post-card glass">
      <div className="post-header">
        <Link to={`/profile/${authorId}`} className="post-author">
          <img
            src={author.profilePicture || 'https://via.placeholder.com/40'}
            alt={author.name}
            className="post-avatar"
          />
          <div>
            <div className="author-name">{author.name}</div>
            <div className="author-role">{author.role}</div>
          </div>
        </Link>
        {(currentUser.id || currentUser._id) === authorId && (
          <button onClick={handleDelete} className="delete-btn">
            <FiTrash2 />
          </button>
        )}
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.media && post.media.length > 0 && (
          <div className="post-media">
            {post.media.map((media, index) => (
              <div key={index} className="media-item">
                {media.type === 'image' ? (
                  <img
                    src={`http://localhost:5000${media.url}`}
                    alt="Post media"
                    className="post-image"
                  />
                ) : (
                  <video
                    src={`http://localhost:5000${media.url}`}
                    controls
                    className="post-video"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="post-footer">
        <button
          onClick={handleLike}
          className={`like-btn ${isLiked ? 'liked' : ''}`}
        >
          <FiHeart /> {post.likes?.length || 0}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="comment-btn"
        >
          <FiMessageCircle /> {post.comments?.length || 0}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {post.comments?.map((comment, index) => {
              const commentUser = comment.user || {};
              return (
                <div key={index} className="comment">
                  <img
                    src={commentUser.profilePicture || 'https://via.placeholder.com/30'}
                    alt={commentUser.name}
                    className="comment-avatar"
                  />
                  <div className="comment-content">
                    <div className="comment-author">{commentUser.name}</div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="comment-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
