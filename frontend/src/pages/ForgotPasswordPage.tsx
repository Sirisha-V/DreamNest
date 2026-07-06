import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const ForgotPasswordPage = () => {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <section className="auth-hero-panel">
          <div className="theme-pill">Forgot password</div>
          <div className="hero-copy">
            <h1>Reset your access securely.</h1>
            <p>Enter your email and we’ll send a secure recovery link right away.</p>
          </div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-status"><Sparkles size={18} /> DreamNest support</div>
          </div>
          <form className="auth-form">
            <label className="form-field">
              <span>Email</span>
              <input type="email" placeholder="you@dreamnest.com" />
            </label>
            <button className="button button-primary auth-submit">Send reset link</button>
          </form>
          <div className="auth-footer">
            <Link to="/login" className="auth-link">Back to sign in</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
