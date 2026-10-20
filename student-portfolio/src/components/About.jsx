import './About.css';

function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-card">
        <h2 className="about-title">About Me</h2>
        <div className="about-divider"></div>
        <p className="about-text">
          Hello! I am Yash{' '}
          <a href="https://github.com/yashdhoriya" className="about-link" target="_blank" rel="noreferrer">
            Dhoriya
          </a>
          , a Computer Engineering student at{' '}
          <a href="https://www.charusat.ac.in" className="about-link" target="_blank" rel="noreferrer">
            CHARUSAT
          </a>
          . I am passionate about web development, programming, and learning new technologies.
        </p>
      </div>
    </section>
  );
}

export default About;
