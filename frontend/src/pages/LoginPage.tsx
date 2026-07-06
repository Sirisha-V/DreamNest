import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Gift } from 'lucide-react';
import { loginUser } from '../lib/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginUser({ email, password });
      localStorage.setItem('dreamnest_token', response.access_token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="auth-card">
        <section className="auth-hero-panel">
          <div className="hero-pill"><Gift size={18} /> Birthday gift</div>
          <div className="hero-copy">
            <p className="eyebrow">Intelligent financial dreams</p>
            <h1>Welcome to your birthday dream runway.</h1>
            <p>A special gift for a year of growth, saving, and celebrating milestones.</p>
          </div>
          <div className="hero-features">
            <div className="hero-feature">
              <span>Celebration launch</span>
              <strong>Designed to feel premium and personal</strong>
            </div>
            <div className="hero-feature">
              <span>Dream-powered savings</span>
              <strong>Make every milestone feel special</strong>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-status"><ShieldCheck size={18} /> Secure sign in</div>
            <div className="auth-title">
              <h2>Sign in</h2>
              <p>Continue planning the life you want.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input type="email" placeholder="you@dreamnest.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">
              <Sparkles size={18} /> {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            <Link to="/register" className="auth-link auth-link-strong">Create account</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
