import { Link } from 'react-router-dom';
import './Header.css';

function Header({ name, role, bio, university, themeColor }) {
  return (
    <header className="header" style={themeColor ? { background: themeColor } : {}}>
      <div className="header-content">
        <h1 className="header-name">{name}</h1>
        <p className="header-role">{role}</p>
        <p className="header-bio">{bio}</p>
        <p className="header-university">{university}</p>

        {/* Quick-jump links inside the hero — use Link for SPA navigation */}
        <div className="header-nav">
          <Link to="/projects" className="header-cta">View Projects →</Link>
          <Link to="/contact" className="header-cta header-cta--outline">Contact Me</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
