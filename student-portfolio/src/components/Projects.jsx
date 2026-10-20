import './Projects.css';

function Projects({ projects }) {
  return (
    <section id="projects" className="projects-section">
      <div className="projects-inner">
        <h2 className="projects-title">Projects</h2>
        <div className="projects-divider"></div>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              <div className="project-icon">🚀</div>
              <h3 className="project-name">{project.name}</h3>
              <p className="project-desc">{project.description}</p>
              <span className="project-tag">{project.tech}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
