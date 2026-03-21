import React from 'react';
import '../css/HomePage.css';
import p1 from '../src/img/src_pre/p1.avif';
import p2 from '../src/img/src_pre/p2.avif';
import NavigationBar from '../components/NavigationBar';

const HomePage = () => {
  return (
    <div>
      {/* <Navbar/> */}
      {/* --- 1. HERO SECTION --- */}
      <header className="hero-section" id="home">
        <div className="container hero-wrapper">
          <div className="hero-content">
            <span className="badge">Welcome to Leads Wariyapola</span>
            <h1>
              Where <span className="highlight-green">Learning</span> Meets <span className="highlight-yellow">Joyful</span> Discovery.
            </h1>
            <p>
              We provide a nurturing environment where children can explore, create, and grow. 
              Join our vibrant community today!
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary">Enroll Now</button>
              <button className="btn btn-secondary">Watch Video</button>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src={p1} 
              alt="Happy Kids" 
            />
            <div className="floating-card">
              <span className="emoji">⭐</span>
              <div>
                <strong>Top Rated</strong>
                <small>By Local Parents</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- 2. FEATURES SECTION --- */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-title">
            <h2>Why Kids Love Us</h2>
            <p>Our unique approach combines nature, fun, and education.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card card-green">
              <div className="icon">🍎</div>
              <h3>Little Market</h3>
              <p>Kids learn math and social skills by managing their own little shops.</p>
            </div>
            <div className="feature-card card-yellow">
              <div className="icon">🎨</div>
              <h3>Creative Arts</h3>
              <p>Expressing imagination through painting, drama, and music.</p>
            </div>
            <div className="feature-card card-blue">
              <div className="icon">🌳</div>
              <h3>Garden Learning</h3>
              <p>Outdoor classrooms where nature becomes the best teacher.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. ABOUT SECTION --- */}
      <section className="about-section" id="about">
        <div className="container about-wrapper">
          <div className="about-image">
            <img src={p2}
             alt="Teacher reading" />
          </div>
          <div className="about-text">
            <h4>About Our School</h4>
            <h2>Nurturing the Leaders of Tomorrow</h2>
            <p>
              At Leads Wariyapola, we believe every child is unique. Our curriculum is designed 
              to foster independence, critical thinking, and emotional intelligence.
            </p>
            <ul className="check-list">
              <li>✅ Experienced & Caring Teachers</li>
              <li>✅ Safe & Secure Environment</li>
              <li>✅ Modern Montessori Methods</li>
            </ul>
            <button className="btn btn-text">Learn More &rarr;</button>
          </div>
        </div>
      </section>

      {/* --- 4. STATS SECTION --- */}
      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stat-item">
            <h3>15+</h3>
            <p>Years Experience</p>
          </div>
          <div className="stat-item">
            <h3>500+</h3>
            <p>Happy Students</p>
          </div>
          <div className="stat-item">
            <h3>20+</h3>
            <p>Expert Teachers</p>
          </div>
          <div className="stat-item">
            <h3>100%</h3>
            <p>Parent Satisfaction</p>
          </div>
        </div>
      </section>

      {/* --- 5. TESTIMONIALS --- */}
      <section className="testimonials-section" id="reviews">
        <div className="container">
          <div className="section-title">
            <h2>Parents Say</h2>
          </div>
          <div className="review-grid">
            <div className="review-card">
              <p>"The best decision we made for our daughter. She loves the outdoor activities!"</p>
              <div className="reviewer">
                <strong>- Sarah P.</strong>
              </div>
            </div>
            <div className="review-card">
              <p>"The teachers are so supportive and kind. Highly recommended for early education."</p>
              <div className="reviewer">
                <strong>- Ruwan D.</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 6. FOOTER --- */}
      <footer className="footer-section">
        <div className="container footer-grid">
          <div className="footer-col">
            <h3>🌱 Leads Wariyapola</h3>
            <p>Shaping bright futures, one child at a time.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li>Home</li>
              <li>Admissions</li>
              <li>Gallery</li>
              <li>Contact</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <p>123 Main Street, Wariyapola</p>
            <p>+94 123 456 789</p>
            <p>hello@leads.lk</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Leads Wariyapola. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;