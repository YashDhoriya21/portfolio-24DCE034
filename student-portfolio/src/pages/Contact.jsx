import { useState } from 'react';
import './Contact.css';

const MAX_CHARS = 500;

function Contact() {
  // useState #1 — controlled form: captures name input in real time
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  // useState #2 — toggles the help tooltip visibility
  const [showHelp, setShowHelp] = useState(false);

  // useState #3 — tracks form submission success
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    // Enforce character limit on message field
    if (name === 'message' && value.length > MAX_CHARS) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setFormData({ name: '', email: '', message: '' });
    setSubmitted(false);
  }

  const charsLeft = MAX_CHARS - formData.message.length;

  return (
    <main className="contact-wrapper">
      <div className="contact-header">
        <h1 className="contact-title">Contact Me</h1>
        <p className="contact-subtitle">Have a question or want to collaborate? Let me know.</p>
      </div>

      <div className="contact-body">
        {submitted ? (
          /* Success state */
          <div className="contact-success">
            <span className="success-icon">✅</span>
            <h2>Message Sent!</h2>
            <p>
              Thanks <strong>{formData.name}</strong>, I will get back to you soon.
            </p>
            <button id="send-another-btn" className="btn-primary" onClick={handleReset}>
              Send Another
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate>

            {/* Help tooltip — useState #2 UI visibility toggle */}
            <div className="help-row">
              <button
                type="button"
                id="help-toggle-btn"
                className="help-btn"
                onClick={() => setShowHelp((prev) => !prev)}
              >
                {showHelp ? '✕ Hide Help' : '? Show Help'}
              </button>
              {showHelp && (
                <div className="help-tooltip">
                  Fill in all fields and click <strong>Send Message</strong>.
                  Your message will be reviewed within 24 hours.
                </div>
              )}
            </div>

            {/* Name field */}
            <div className="form-group">
              <label htmlFor="name-input" className="form-label">Full Name</label>
              <input
                id="name-input"
                type="text"
                name="name"
                className="form-input"
                placeholder="Yash Dhoriya"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email field */}
            <div className="form-group">
              <label htmlFor="email-input" className="form-label">Email Address</label>
              <input
                id="email-input"
                type="email"
                name="email"
                className="form-input"
                placeholder="yashdhoriya411@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Message field — live character count */}
            <div className="form-group">
              <label htmlFor="message-input" className="form-label">Message</label>
              <textarea
                id="message-input"
                name="message"
                className="form-textarea"
                placeholder="Write your message here..."
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
              />
              {/* Live character count — supplementary requirement */}
              <span className={`char-count ${charsLeft < 50 ? 'char-count--warn' : ''}`}>
                {charsLeft} characters remaining
              </span>
            </div>

            {/* Live preview of what user has typed */}
            {formData.name && (
              <div className="live-preview">
                <span className="live-label">Live Preview →</span>
                Sending as <strong>{formData.name}</strong>
                {formData.email && <> ({formData.email})</>}
              </div>
            )}

            <button
              id="submit-btn"
              type="submit"
              className="btn-primary"
              disabled={!formData.name || !formData.email || !formData.message}
            >
              Send Message ✉️
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default Contact;
