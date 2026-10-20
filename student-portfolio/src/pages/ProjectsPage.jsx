import { useState, useEffect } from 'react';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import RepoCard from '../components/RepoCard';
import './ProjectsPage.css';

// GitHub username — change this to your own username
const GITHUB_USERNAME = 'yashdhoriya21';
const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;

function ProjectsPage() {
  // --- State variables (Practical 3 core requirement) ---
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Supplementary: search filter ---
  const [search, setSearch] = useState('');

  // --- Supplementary: retry mechanism ---
  // Incrementing retryCount re-runs the useEffect dependency
  const [retryCount, setRetryCount] = useState(0);

  // --- Practical 2 carry-over: tip toggle ---
  const [showTip, setShowTip] = useState(false);

  // useEffect triggers the fetch on mount (and on retry)
  // Empty dependency [] → runs once on mount; retryCount added to re-trigger on retry
  useEffect(() => {
    // Reset state before each fetch attempt
    setLoading(true);
    setError(null);

    fetch(API_URL)
      .then((res) => {
        // GitHub returns 404 for unknown users — treat non-200 as an error
        if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        // Filter out forked repos so only original work is shown
        setRepos(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        // Always set loading to false — whether success or failure
        setLoading(false);
      });
  }, [retryCount]); // retryCount in dep array → re-fetch when user clicks Retry

  // --- Supplementary: filter repos by search term ---
  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- Conditional rendering based on async state ---
  const renderContent = () => {
    if (loading) return <Spinner message="Fetching repositories from GitHub..." />;
    if (error)   return <ErrorMessage message={error} onRetry={() => setRetryCount((c) => c + 1)} />;

    return (
      <>
        {/* Supplementary: search input filters the repo list in real time */}
        <div className="search-row">
          <input
            id="repo-search"
            type="text"
            className="search-input"
            placeholder="🔍 Filter repositories by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="repo-count">
            {filteredRepos.length} / {repos.length} repos
          </span>
        </div>

        {filteredRepos.length === 0 ? (
          <p className="no-results">No repositories match "{search}".</p>
        ) : (
          <div className="repo-grid">
            {filteredRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <main className="page-wrapper">
      {/* Page hero header */}
      <div className="page-header">
        <h1 className="page-title">GitHub Repositories</h1>
        <p className="page-subtitle">
          Live data fetched from the GitHub API · @{GITHUB_USERNAME}
        </p>

        <button
          id="tip-toggle-btn"
          className="tip-toggle-btn"
          onClick={() => setShowTip((prev) => !prev)}
        >
          {showTip ? 'Hide Tip ▲' : 'Show Tip ▼'}
        </button>

        {showTip && (
          <div className="info-tip">
            💡 <strong>Tip:</strong> Click any repository name to open it on GitHub.
            Stars ⭐ and language badges are pulled live from the API.
          </div>
        )}
      </div>

      {/* API content area — spinner / error / repo grid */}
      <div className="repos-body">
        {renderContent()}
      </div>
    </main>
  );
}

export default ProjectsPage;
