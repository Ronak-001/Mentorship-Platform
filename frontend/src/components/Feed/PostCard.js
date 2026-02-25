import React, { useState, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiHeart, FiMessageCircle, FiTrash2, FiFileText, FiX, FiDownload } from 'react-icons/fi';
import { resolveMediaUrl } from '../../utils/url';
import Avatar from '../Avatar';
import './Feed.css';

const PostCard = ({ post, currentUser, onUpdate, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  // const isLiked = post.likes?.some(like =>
  //   (typeof like === 'object' ? like._id : like) === (currentUser?.id || currentUser?._id)
  // );
  const isLiked = useMemo(() => {
    return post.likes?.some(like =>
      (typeof like === 'object' ? like._id : like) === (currentUser?.id || currentUser?._id)
    );
  }, [post.likes, currentUser]);

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

  const getDocViewerUrl = (url) => {
    const resolved = resolveMediaUrl(url);
    return `https://docs.google.com/gview?url=${encodeURIComponent(resolved)}&embedded=true`;
  };

  const author = post.author || {};
  const authorId = author._id || author.id;

  return (
    <div className="post-card glass">
      <div className="post-header">
        <Link to={`/profile/${authorId}`} className="post-author">
          <Avatar name={author.name} src={author.profilePicture} size="sm" className="post-avatar" />
          <div>
            <div className="author-name">{author.name}</div>
            <div className="author-role">{author.role}</div>
          </div>
        </Link>
        {currentUser && (currentUser.id || currentUser._id) === authorId && (
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
                    src={resolveMediaUrl(media.url)}
                    alt="Post media"
                    className="post-image"
                  />
                ) : media.type === 'video' ? (
                  <video
                    src={resolveMediaUrl(media.url)}
                    controls
                    className="post-video"
                  />
                ) : (
                  <div className="blog-media-preview">
                    <FiFileText size={40} color="#667eea" />
                    <span className="blog-media-preview-span">
                      {media.originalName || 'Document'}
                    </span>
                    <button
                      onClick={() => setViewingDoc(media)}
                      className="btn btn-primary"
                    >
                      View Document
                    </button>
                  </div>
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
                  <Avatar name={commentUser.name} src={commentUser.profilePicture} size="sm" className="comment-avatar" />
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

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="document-viewer-modal"
          onClick={() => setViewingDoc(null)}
        >
          <div className="document-viewer-modal-header"
            onClick={(e) => e.stopPropagation()}>
            <span className="document-viewer-modal-header-title">
              {viewingDoc.originalName || 'Document'}
            </span>
            <div className="document-viewer-modal-header-actions" >
              <a
                href={resolveMediaUrl(viewingDoc.url)}
                download={viewingDoc.originalName || 'document'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiDownload /> Download
              </a>
              <button
                onClick={() => setViewingDoc(null)}
                className="document-viewer-modal-header-actions-button"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>
          <div className="document-viewer-modal-body" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={getDocViewerUrl(viewingDoc.url)}
              title={viewingDoc.originalName || 'Document viewer'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(PostCard);
