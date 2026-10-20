import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <main className="notfound-wrapper">
      <div className="notfound-card">
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-desc">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="notfound-btn">← Back to Home</Link>
      </div>
    </main>
  );
}

export default NotFound;
