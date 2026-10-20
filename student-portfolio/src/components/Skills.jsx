import './Skills.css';

function Skills({ skillList }) {
  return (
    <section id="skills" className="skills-section">
      <div className="skills-card">
        <h2 className="skills-title">Skills</h2>
        <div className="skills-divider"></div>
        <ul className="skills-list">
          {skillList.map((s) => (
            <li key={s} className="skill-item">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Skills;
