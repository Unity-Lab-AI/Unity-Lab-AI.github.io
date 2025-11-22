import React from 'react';
import './styles.css';

const Hero = () => (
  <div
    className="hero"
    style={{
      backgroundImage: 'url("https://via.placeholder.com/1920x400")',
    }}
  >
    <div className="hero-overlay"></div>
    <div className="hero-content">
      <h1>Welcome to Unity AI Lab</h1>
      <p>Exploring the boundaries of creativity and intelligence.</p>
      <a className="btn btn-primary" href="/learn-more">
        Learn More
      </a>
    </div>
  </div>
);

export default Hero;
