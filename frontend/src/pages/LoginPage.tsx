import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Gift } from 'lucide-react';
import { loginUser } from '../lib/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBirthdaySurprise, setShowBirthdaySurprise] = useState(false);
  const [surpriseStep, setSurpriseStep] = useState<'intro' | 'message'>('intro');
  const hasContinuedRef = useRef(false);

  useEffect(() => {
    localStorage.removeItem('dreamnest_token');
  }, []);

  useEffect(() => {
    if (!showBirthdaySurprise) {
      return;
    }

    setSurpriseStep('intro');

    const showMessageTimer = window.setTimeout(() => {
      setSurpriseStep('message');
    }, 1200);

    const autoContinueTimer = window.setTimeout(() => {
      if (hasContinuedRef.current) {
        return;
      }
      hasContinuedRef.current = true;
      navigate('/');
    }, 3400);

    return () => {
      window.clearTimeout(showMessageTimer);
      window.clearTimeout(autoContinueTimer);
    };
  }, [showBirthdaySurprise, navigate]);

  const continueToDashboard = () => {
    if (hasContinuedRef.current) {
      return;
    }
    hasContinuedRef.current = true;
    navigate('/');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginUser({ email, password });
      localStorage.setItem('dreamnest_token', response.access_token);
      hasContinuedRef.current = false;
      setShowBirthdaySurprise(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-shell login-gift-shell">
      <span className="gift-heart gift-heart-1" aria-hidden="true">❤</span>
      <span className="gift-heart gift-heart-2" aria-hidden="true">❤</span>
      <span className="gift-heart gift-heart-3" aria-hidden="true">❤</span>
      <span className="gift-heart gift-heart-4" aria-hidden="true">❤</span>

      <div className="auth-card login-gift-card">
        <section className="auth-hero-panel">
          <div className="hero-pill gift-pill"><Gift size={18} /> 🎁 Made with Love <span className="gift-badge-sparkle" aria-hidden="true">✦</span></div>
          <div className="hero-copy gift-hero-copy">
            <p className="eyebrow">INTELLIGENT DREAMS FOR US</p>
            <h1>Happy Birthday, My Love ❤️</h1>
            <p>
              Every dream you've ever shared with me has a place here.
              <br />
              <br />
              This isn't just a website.
              <br />
              It's my promise to build those dreams with you.
            </p>
          </div>

          <div className="gift-note" aria-label="Handwritten note">
            <p>Dear Love,</p>
            <p>I wanted your birthday gift to be something no one else could give you.</p>
            <p>Not flowers.<br />Not a watch.</p>
            <p>But a little world where every dream we talk about can become a plan.</p>
            <p>Happy Birthday ❤️</p>
            <p>— Siri Papa</p>
          </div>

          <div className="hero-features">
            <div className="hero-feature">
              <span>Our Future ✨</span>
              <strong>Every dream we build today becomes tomorrow's reality.</strong>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-status"><ShieldCheck size={18} /> Open Your Birthday Gift 🎂</div>
            <div className="auth-title">
              <h2>Welcome ❤️</h2>
              <p>One click away from your surprise.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input type="email" placeholder="Your nickname" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input type="password" placeholder="A special memory" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button button-primary auth-submit gift-submit" disabled={isSubmitting} type="submit">
              <Sparkles size={18} /> {isSubmitting ? 'Opening...' : 'Open My Gift 🎁'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-link">Need a tiny hint? 😉</Link>
            <Link to="/register" className="auth-link auth-link-strong">Already stolen my heart ❤️</Link>
          </div>
        </section>
      </div>

      {showBirthdaySurprise ? (
        <div className="birthday-surprise-overlay" role="dialog" aria-modal="true" aria-label="Birthday surprise">
          <div className="birthday-hearts" aria-hidden="true">
            <span className="birthday-heart">❤</span>
            <span className="birthday-heart">❤</span>
            <span className="birthday-heart">❤</span>
            <span className="birthday-heart">❤</span>
          </div>

          <div className="birthday-confetti" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} className="confetti-piece" />
            ))}
          </div>

          <div className="birthday-surprise-card">
            <div className="birthday-sparkles" aria-hidden="true">
              <span className="birthday-sparkle">✦</span>
              <span className="birthday-sparkle">✦</span>
              <span className="birthday-sparkle">✦</span>
            </div>

            <div className="birthday-text-stage">
              <div className={`birthday-text-group ${surpriseStep === 'intro' ? 'is-visible' : 'is-hidden'}`}>
                <h2>🎉 Hi Nana! ❤️</h2>
                <p>Welcome to your birthday surprise.</p>
              </div>

              <div className={`birthday-text-group birthday-love-note ${surpriseStep === 'message' ? 'is-visible' : 'is-hidden'}`}>
                <h3>Happy Birthday, My Love! 🎂</h3>
                <p>I built this little world just for you.</p>
                <p>Every dream here is one we'll chase together.</p>
                <p>Love,<br />Siri Papa ❤️</p>
              </div>
            </div>

            <button type="button" className="button button-primary birthday-continue" onClick={continueToDashboard}>
              Continue
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LoginPage;
