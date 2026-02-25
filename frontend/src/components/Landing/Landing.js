import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiUsers, FiMessageSquare, FiVideo, FiTarget } from 'react-icons/fi';
import './Landing.css';

const Landing = ({ user }) => {
  if (user) {
    return <Navigate to="/feed" />;
  }

  return (
    <div className="landing-page">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <nav className="landing-nav glass-morphism">
        <div className="nav-container">
          <h1 className="logo">Mentor<span>Connect</span></h1>
          <div className="nav-links">
            <a href="#about" className="nav-link">About</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#join" className="nav-link">Join</a>
            <Link to="/login" className="btn btn-primary-landing-landing glass-btn">Login</Link>
            <Link to="/register" className="btn btn-primary-landing glass-btn">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="landing-content">
        <section className="hero-section">
          <div className="hero-text glass-morphism">
            <h2>Bridge the Gap Between <br /><span>Expertise and Growth</span></h2>
            <p>Connect with industry leaders, learn new skills, and accelerate your career with our modern mentorship platform.</p>
            <div className="hero-action">
              <Link to="/register" className="btn btn-primary-landing glass-btn">Join Now</Link>
              <Link to="/login" className="btn btn-secondary glass-btn">Explore Mentors</Link>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-container glass-morphism">
            <div className="about-text">
              <h3>About <span>MentorConnect</span></h3>
              <p>
                MentorConnect was built to close the gap between ambition and experience.
                We believe growth accelerates when guidance is accessible.
              </p>
              <p>
                Our platform connects aspiring professionals with industry mentors
                through structured conversations, goal tracking, and real-time collaboration.
              </p>
              <p>
                Whether you're navigating your first career step or leveling up your expertise,
                MentorConnect provides the clarity, accountability, and insight needed to grow with confidence.
              </p>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-title">
            <h3>Why Choose <span>MentorConnect?</span></h3>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-morphism">
              <div className="feature-icon"><FiUsers /></div>
              <h4>Direct Connections</h4>
              <p>Find and connect with mentors who match your career goals and interests.</p>
            </div>
            <div className="feature-card glass-morphism">
              <div className="feature-icon"><FiMessageSquare /></div>
              <h4>Real-time Chat</h4>
              <p>Seamless communication through integrated messaging system.</p>
            </div>
            <div className="feature-card glass-morphism">
              <div className="feature-icon"><FiVideo /></div>
              <h4>Video Sessions</h4>
              <p>Face-to-face mentorship sessions with high-quality video calling.</p>
            </div>
            <div className="feature-card glass-morphism">
              <div className="feature-icon"><FiTarget /></div>
              <h4>Skill Tracking</h4>
              <p>Set goals and track your progress with your mentor's guidance.</p>
            </div>
          </div>
        </section>



        <section className="cta-section" id="join">
          <div className="cta-content glass-morphism">
            <h3>Ready to level up your career?</h3>
            <p>Join thousands of mentees and mentors already on the platform.</p>
            <Link to="/register" className="btn btn-primary-landing glass-btn">Get Started Now</Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer glass-morphism">
        <p>&copy; 2024 MentorConnect. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
