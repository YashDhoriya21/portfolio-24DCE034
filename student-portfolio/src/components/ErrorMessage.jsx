import './ErrorMessage.css';

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-wrapper">
      <div className="error-card">
        <span className="error-icon">⚠️</span>
        <h3 className="error-title">Failed to Load Repositories</h3>
        <p className="error-desc">{message}</p>

        {/* Supplementary: retry button re-triggers the fetch in parent */}
        {onRetry && (
          <button id="retry-btn" className="retry-btn" onClick={onRetry}>
            ↻ Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
