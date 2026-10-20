import './Footer.css';

function Footer({ name }) {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="footer">
      <div className="footer-content">
        <p className="footer-contact-label">Get In Touch</p>
        <div className="footer-links">
          <a href="mailto:yashdhoriya411@gmail.com" className="footer-link">📧 yashdhoriya411@gmail.com</a>
          <span className="footer-sep">·</span>
          <a href="https://github.com/yashdhoriya21" target="_blank" rel="noreferrer" className="footer-link">
            GitHub
          </a>
          <span className="footer-sep">·</span>
          <a href="https://www.linkedin.com/in/yash-dhoriya-70b78139b/" target="_blank" rel="noreferrer" className="footer-link">
            LinkedIn
          </a>
        </div>
        <p className="footer-copy">© {year} {name}. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
