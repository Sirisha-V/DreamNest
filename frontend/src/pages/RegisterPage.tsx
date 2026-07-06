import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { registerUser } from '../lib/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await registerUser({ name, email, password });
      localStorage.setItem('dreamnest_token', response.access_token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <section className="auth-hero-panel">
          <div className="hero-pill"><Sparkles size={18} /> Welcome to DreamNest</div>
          <div className="hero-copy">
            <h1>Turn life goals into a beautiful plan.</h1>
            <p>Create your account and start following dreams like a real financial coach would.</p>
          </div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-status"><ShieldCheck size={18} /> Join DreamNest</div>
            <div>
              <h2>Create account</h2>
              <p>Start with your first dream today.</p>
            </div>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Name</span>
              <input placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input type="email" placeholder="you@dreamnest.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input type="password" placeholder="Create a password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">{isSubmitting ? 'Creating account...' : 'Create account'}</button>
          </form>
          <div className="auth-footer">
            <Link to="/login" className="auth-link">Already have an account?</Link>
            <Link to="/login" className="auth-link auth-link-strong">Sign in</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
