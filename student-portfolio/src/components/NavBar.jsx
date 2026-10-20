import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './NavBar.css';

function NavBar({ darkMode, onToggleDark }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">YD.</span>

        {/* Hamburger for mobile */}
        <button
          className="navbar-burger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-links ${menuOpen ? 'navbar-links--open' : ''}`}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/projects"
              className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
              onClick={() => setMenuOpen(false)}
            >
              Projects
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/tasks"
              className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
              onClick={() => setMenuOpen(false)}
            >
              Tasks
            </NavLink>
          </li>
        </ul>

        {/* Dark/Light mode toggle — useState used in App.jsx */}
        <button
          id="theme-toggle"
          className="theme-toggle"
          onClick={onToggleDark}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
