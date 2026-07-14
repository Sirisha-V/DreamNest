import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { resetPassword } from '../lib/api';
import { clearStoredSession, storeLocalCredential, validatePassword } from '../lib/auth';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    clearStoredSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await resetPassword({ email: trimmedEmail, password });
      storeLocalCredential(trimmedEmail, password);
      setMessage('Password updated. You can sign in now.');
      setPassword('');
      setConfirmPassword('');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <section className="auth-hero-panel">
          <div className="theme-pill">Forgot password</div>
          <div className="hero-copy">
            <h1>Reset your access securely.</h1>
            <p>Update your password locally and return to sign in immediately.</p>
          </div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-status"><ShieldCheck size={18} /> DreamNest support</div>
            <div className="auth-title">
              <h2>Reset password</h2>
              <p>Use the email on your account and choose a new password.</p>
            </div>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input type="email" placeholder="you@dreamnest.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>New password</span>
              <input type="password" placeholder="Create a new password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Confirm password</span>
              <input type="password" placeholder="Repeat the new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            {message ? <p className="form-success">{message}</p> : null}
            <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">
              <Sparkles size={18} /> {isSubmitting ? 'Resetting...' : 'Reset password'}
            </button>
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
