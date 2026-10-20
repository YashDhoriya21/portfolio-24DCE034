import './RepoCard.css';

function RepoCard({ repo }) {
  return (
    <div className="repo-card">
      <div className="repo-card-top">
        <span className="repo-icon">📁</span>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noreferrer"
          className="repo-name"
        >
          {repo.name}
        </a>
      </div>

      {repo.description && (
        <p className="repo-desc">{repo.description}</p>
      )}

      <div className="repo-meta">
        {/* Star count — supplementary requirement */}
        <span className="repo-stars" title="Stars">
          ⭐ {repo.stargazers_count}
        </span>

        {repo.language && (
          <span className="repo-lang">{repo.language}</span>
        )}

        {repo.fork && (
          <span className="repo-fork-badge">Fork</span>
        )}
      </div>
    </div>
  );
}

export default RepoCard;
