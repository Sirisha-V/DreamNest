import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import { getOnboardingName } from '../lib/onboarding';

type Stage = 'celebration' | 'letter' | 'wizard' | 'success';

type WizardData = {
  category: string;
  title: string;
  targetAmount: string;
  targetDate: string;
  monthlyGoal: string;
};

const categories = [
  { id: 'travel', label: 'Travel' },
  { id: 'home', label: 'Home' },
  { id: 'education', label: 'Education' },
  { id: 'car', label: 'Car' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'business', label: 'Business' },
];

const defaultWizard: WizardData = {
  category: 'travel',
  title: '',
  targetAmount: '',
  targetDate: '',
  monthlyGoal: '',
};

const OnboardingExperience = () => {
  const { addDream, completeOnboarding, grantDreamCoins } = useDreams();
  const onboardingName = getOnboardingName();
  const [stage, setStage] = useState<Stage>('celebration');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<WizardData>(defaultWizard);

  useEffect(() => {
    if (stage !== 'celebration') {
      return;
    }

    const timer = window.setTimeout(() => {
      setStage('letter');
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== 'success') {
      return;
    }

    const timer = window.setTimeout(() => {
      completeOnboarding();
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [completeOnboarding, stage]);

  const stepValid = () => {
    if (step === 1) return Boolean(data.category);
    if (step === 2) return data.title.trim().length >= 2;
    if (step === 3) return Number(data.targetAmount) > 0;
    if (step === 4) return Boolean(data.targetDate);
    if (step === 5) return Number(data.monthlyGoal) > 0;
    return true;
  };

  const goNext = () => {
    setError('');
    if (!stepValid()) {
      setError('Please complete this step before continuing.');
      return;
    }
    setStep((current) => Math.min(5, current + 1));
  };

  const goBack = () => {
    setError('');
    setStep((current) => Math.max(1, current - 1));
  };

  const handleCreateDream = async () => {
    setError('');
    if (!stepValid()) {
      setError('Please complete this step before creating your dream.');
      return;
    }

    setSaving(true);
    try {
      await addDream({
        title: data.title.trim(),
        target_amount: Number(data.targetAmount),
        monthly_contribution: Number(data.monthlyGoal),
        deadline: data.targetDate,
        notes: `First onboarding dream in category: ${data.category}`,
        priority: 'High',
      });
      grantDreamCoins(50, 'First dream onboarding reward');
      setStage('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create first dream');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="First time onboarding">
      <div className="onboarding-bg" />

      {stage === 'celebration' ? (
        <div className="onboarding-celebration">
          <div className="onboarding-confetti" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, index) => (
              <span key={index} className="onboarding-confetti-piece" />
            ))}
          </div>
          <div className="onboarding-sparkles" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, index) => (
              <span key={index} className="onboarding-spark" />
            ))}
          </div>
          <p className="onboarding-pill">Premium Welcome</p>
          <h2>{`🎉 Happy Birthday ${onboardingName} ❤️`}</h2>
          <p>I've been waiting for you to open this.</p>
        </div>
      ) : null}

      {stage === 'letter' ? (
        <article className="onboarding-letter-modal">
          <p className="onboarding-pill">A Letter For You</p>
          <h3>{`Dear ${onboardingName},`}</h3>
          <p>
            Birthdays usually come with cakes and gifts.
            <br />
            <br />
            But I wanted to give you something that grows with you.
            <br />
            <br />
            Every dream you add here...
            <br />
            Every rupee you save...
            <br />
            Every milestone you reach...
            <br />
            <br />
            Will remind you that I'm always cheering for you.
            <br />
            <br />
            Let's build our future one dream at a time.
            <br />
            <br />
            Happy Birthday ❤️
            <br />
            <br />
            Love,
            <br />
            Siri Papa
          </p>
          <div className="onboarding-actions">
            <button type="button" className="button button-primary" onClick={() => setStage('wizard')}>❤️ Let's Build Our Dreams</button>
            <button type="button" className="button button-ghost" onClick={() => completeOnboarding()}>Skip</button>
          </div>
        </article>
      ) : null}

      {stage === 'wizard' ? (
        <article className="onboarding-wizard">
          <div className="panel-actions">
            <div>
              <p className="onboarding-pill">First Dream Wizard</p>
              <h3>Create your first dream in 5 steps</h3>
            </div>
            <p className="setting-detail">Step {step}/5</p>
          </div>

          <div className="onboarding-progress"><div style={{ width: `${(step / 5) * 100}%` }} /></div>

          {step === 1 ? (
            <div className="onboarding-step-grid">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`onboarding-category ${data.category === category.id ? 'active' : ''}`}
                  onClick={() => setData((current) => ({ ...current, category: category.id }))}
                >
                  {category.label}
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <label className="form-field onboarding-field">
              <span>Dream title</span>
              <input
                value={data.title}
                onChange={(event) => setData((current) => ({ ...current, title: event.target.value }))}
                placeholder="Japan Trip"
              />
            </label>
          ) : null}

          {step === 3 ? (
            <label className="form-field onboarding-field">
              <span>Target amount</span>
              <input
                type="number"
                min="1"
                value={data.targetAmount}
                onChange={(event) => setData((current) => ({ ...current, targetAmount: event.target.value }))}
                placeholder="250000"
              />
            </label>
          ) : null}

          {step === 4 ? (
            <label className="form-field onboarding-field">
              <span>Target date</span>
              <input
                type="date"
                value={data.targetDate}
                onChange={(event) => setData((current) => ({ ...current, targetDate: event.target.value }))}
              />
            </label>
          ) : null}

          {step === 5 ? (
            <label className="form-field onboarding-field">
              <span>Monthly savings goal</span>
              <input
                type="number"
                min="1"
                value={data.monthlyGoal}
                onChange={(event) => setData((current) => ({ ...current, monthlyGoal: event.target.value }))}
                placeholder="15000"
              />
            </label>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <div className="onboarding-actions">
            <button type="button" className="button button-ghost" onClick={goBack} disabled={step === 1 || saving}>Back</button>
            {step < 5 ? (
              <button type="button" className="button button-primary" onClick={goNext}>Next</button>
            ) : (
              <button type="button" className="button button-primary" onClick={handleCreateDream} disabled={saving}>
                <Sparkles size={16} /> {saving ? 'Creating...' : 'Create First Dream'}
              </button>
            )}
          </div>
        </article>
      ) : null}

      {stage === 'success' ? (
        <div className="onboarding-celebration">
          <div className="onboarding-confetti" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, index) => (
              <span key={index} className="onboarding-confetti-piece" />
            ))}
          </div>
          <p className="onboarding-pill">First Dream Unlocked</p>
          <h2>{`Amazing ${onboardingName}! Your first dream is ready. ❤️`}</h2>
          <p>+50 Dream Coins added to your Dream Jar.</p>
        </div>
      ) : null}
    </div>
  );
};

export default OnboardingExperience;
