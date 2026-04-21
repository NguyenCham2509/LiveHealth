import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, KeyRound, CheckCircle } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import './Register.css';

// Step: 'form' → 'otp' → 'done'

const Register = () => {
  const { t } = useLang();
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('form');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  if (isAuthenticated) {
    navigate('/account', { replace: true });
    return null;
  }

  // ── Step 1: Register ──────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPw) {
      setError(t('register.pwMismatch') || 'Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    const result = await register(email, password);
    setLoading(false);
    if (result.success) {
      setStep('otp');
    } else {
      setError(result.error);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError(t('register.otpInvalid') || 'Mã OTP không hợp lệ.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.verifyOtp(email, otp);
      setStep('done');
    } catch (err) {
      setError(err.message || t('register.otpWrong') || 'Mã OTP không đúng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────
  const handleResend = async () => {
    setError('');
    setResendMsg('');
    setLoading(true);
    try {
      await register(email, password);
      setResendMsg(t('register.otpResent') || 'Mã OTP mới đã được gửi đến email của bạn.');
    } catch (err) {
      setError(err.message || 'Gửi lại thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['form', 'otp', 'done'];
  const stepIndex = STEPS.indexOf(step);

  const StepBar = () => (
    <div className="reg-steps-bar">
      {[
        { icon: <Mail size={15}/>, label: t('register.stepInfo') || 'Thông tin' },
        { icon: <KeyRound size={15}/>, label: t('register.stepOtp') || 'Xác nhận' },
        { icon: <CheckCircle size={15}/>, label: t('register.stepDone') || 'Hoàn tất' },
      ].map((s, i) => (
        <div key={i} className={`reg-step ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}>
          <div className="reg-step-circle">
            {i < stepIndex ? '✓' : s.icon}
          </div>
          <span className="reg-step-label">{s.label}</span>
          {i < 2 && <div className={`reg-step-line ${i < stepIndex ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="auth-wrap">
      {/* Breadcrumb */}
      <div className="auth-breadcrumb">
        <div className="container auth-bc-inner">
          <Link to="/">🏠</Link>
          <span>›</span>
          <span>{t('account.breadcrumb')}</span>
          <span>›</span>
          <span className="bc-active">{t('register.breadcrumb')}</span>
        </div>
      </div>

      <div className="auth-section">
        <div className="auth-card reg-card">

          {/* Step indicator (only for form/otp/done) */}
          <StepBar />

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="reg-done">
              <div className="reg-done-icon">
                <CheckCircle size={48} strokeWidth={1.8} />
              </div>
              <h2 className="auth-title" style={{ marginBottom: 10 }}>
                {t('register.doneTitle') || '🎉 Đăng ký thành công!'}
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                {t('register.doneDesc') || 'Tài khoản đã được xác minh. Bạn có thể đăng nhập ngay bây giờ.'}
              </p>
              <button className="auth-submit-btn" onClick={() => navigate('/login')}>
                {t('register.goLogin') || 'Đăng nhập ngay'}
              </button>
            </div>
          )}

          {/* ── OTP step ── */}
          {step === 'otp' && (
            <>
              <h2 className="auth-title">{t('register.otpTitle') || 'Xác nhận Email'}</h2>
              <p className="reg-otp-subtitle">
                {t('register.otpSubtitle') || 'Mã xác nhận đã được gửi đến'}{' '}
                <strong>{email}</strong>
              </p>

              {error   && <div className="auth-error">{error}</div>}
              {resendMsg && <div className="reg-success-msg">{resendMsg}</div>}

              <form onSubmit={handleVerifyOtp}>
                <div className="auth-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="● ● ● ● ● ●"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); setResendMsg(''); }}
                    required
                    autoFocus
                    className="reg-otp-input"
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (t('register.verifying') || 'Đang xác nhận...') : (t('register.verifyOtp') || 'Xác nhận OTP')}
                </button>
              </form>

              <p className="auth-switch" style={{ marginTop: 18 }}>
                {t('register.noOtp') || 'Không nhận được mã?'}{' '}
                <button
                  type="button"
                  className="reg-resend-btn"
                  onClick={handleResend}
                  disabled={loading}
                >
                  {t('register.resendOtp') || 'Gửi lại'}
                </button>
              </p>
            </>
          )}

          {/* ── Register form ── */}
          {step === 'form' && (
            <>
              <h2 className="auth-title">{t('register.title')}</h2>
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleRegister}>
                <div className="auth-field">
                  <input
                    type="email"
                    placeholder={t('register.email')}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required
                  />
                </div>

                <div className="auth-field auth-field-pw">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder={t('register.password')}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    required
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>

                <div className="auth-field auth-field-pw">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder={t('register.confirmPassword')}
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setError(''); }}
                    required
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>

                <label className="auth-terms">
                  <input type="checkbox" required />
                  <span>{t('register.acceptTerms')}</span>
                </label>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (t('register.registering') || 'Đang đăng ký...') : t('register.submit')}
                </button>
              </form>

              <p className="auth-switch">
                {t('register.hasAccount')}{' '}
                <Link to="/login" className="auth-switch-link">
                  {t('register.login')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
