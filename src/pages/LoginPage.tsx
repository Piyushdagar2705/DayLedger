import React from 'react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { FirebaseError } from 'firebase/app';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { classifyUserProfileError, getUser, getUserProfileErrorMessage } from '../services/userService';

function mapAuthErrorMessage(error: unknown): string {
  const firebaseError = error as FirebaseError | undefined;

  switch (firebaseError?.code) {
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not initialized for this project. In Firebase Console, open Authentication and click Get started.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled. Enable Google and/or Email/Password in Firebase Console > Authentication > Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase auth. Add localhost in Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network request failed. This is often caused by ad blockers/privacy extensions blocking googleapis/firebase calls. Disable them for localhost and retry.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

export function LoginPage() {
  const { currentUser, loading, configError, authFlowError, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignupRoute = location.pathname === '/signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !currentUser) {
      return;
    }

    let isActive = true;

    const resolveRoute = async () => {
      setCheckingProfile(true);
      setError(null);

      try {
        const userProfile = await getUser(currentUser.uid);

        if (!isActive) {
          return;
        }

        navigate(userProfile ? '/' : '/onboarding', { replace: true });
      } catch (profileError) {
        if (isActive) {
          const profileErrorCategory = classifyUserProfileError(profileError);

          if (profileErrorCategory !== 'unknown') {
            const setupMessage = getUserProfileErrorMessage(profileError);
            setError(setupMessage);
            showToast({
              title: 'Setup required',
              description: setupMessage,
              variant: 'error',
            });
            navigate('/setup/firestore', { replace: true });
            return;
          }

          showToast({
            title: 'Profile lookup failed',
            description: 'You are signed in. Opening app in fallback mode.',
            variant: 'info',
          });

          // Do not keep users trapped on /login after successful auth.
          // If profile read fails temporarily, route into app shell and let pages recover.
          navigate('/', { replace: true });
        }
      } finally {
        if (isActive) {
          setCheckingProfile(false);
        }
      }
    };

    void resolveRoute();

    return () => {
      isActive = false;
    };
  }, [currentUser, loading, navigate, showToast]);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    if (isSignupRoute) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      if (!confirmPassword.trim()) {
        setError('Please confirm your password.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Password and confirm password do not match.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isSignupRoute) {
        await registerWithEmail(email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }

      showToast({
        title: isSignupRoute ? 'Account created' : 'Sign-in successful',
        description: 'Checking your profile details now.',
        variant: 'success',
      });

      setPassword('');
      setConfirmPassword('');
    } catch (authError) {
      setError(mapAuthErrorMessage(authError));
      showToast({
        title: 'Authentication failed',
        description: mapAuthErrorMessage(authError),
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    setError(null);

    try {
      const flow = await loginWithGoogle();

      if (flow === 'popup' && auth?.currentUser) {
        try {
          const userProfile = await getUser(auth.currentUser.uid);
          navigate(userProfile ? '/' : '/onboarding', { replace: true });
        } catch (profileError) {
          const profileErrorCategory = classifyUserProfileError(profileError);
          if (profileErrorCategory !== 'unknown') {
            const setupMessage = getUserProfileErrorMessage(profileError);
            setError(setupMessage);
            showToast({
              title: 'Setup required',
              description: setupMessage,
              variant: 'error',
            });
            navigate('/setup/firestore', { replace: true });
            return;
          }

          throw profileError;
        }
      }
    } catch (authError) {
      setError(mapAuthErrorMessage(authError));
      showToast({
        title: 'Google sign-in failed',
        description: mapAuthErrorMessage(authError),
        variant: 'error',
      });
      setGoogleSubmitting(false);
      return;
    }

    setGoogleSubmitting(false);
  };

  const handleForgotPasswordClick = () => {
    showToast({
      title: 'Not available yet',
      description: 'Forgot password flow is not configured yet.',
      variant: 'info',
    });
  };

  const toggleMode = () => {
    navigate(isSignupRoute ? '/login' : '/signup');
  };

  if (loading || checkingProfile || currentUser) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-6 py-8">
        <div className="w-full space-y-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <StyledWrapper>
      <div className="page-shell">
        <form className="form" onSubmit={handleAuthSubmit}>
          <h1 className="title">{isSignupRoute ? 'Create your account' : 'Sign in to your account'}</h1>
          <p className="subtitle">{isSignupRoute ? 'Use your email and set a password to get started.' : 'Use your email and password to continue.'}</p>

          <div className="flex-column">
            <label>Email </label>
          </div>
          <div className="inputForm">
            <svg height={20} viewBox="0 0 32 32" width={20} xmlns="http://www.w3.org/2000/svg">
              <g id="Layer_3" data-name="Layer 3">
                <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
              </g>
            </svg>
            <input
              type="text"
              className="input"
              placeholder="Enter your Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="flex-column">
            <label>Password </label>
          </div>
          <div className="inputForm">
            <svg height={20} viewBox="-64 0 512 512" width={20} xmlns="http://www.w3.org/2000/svg">
              <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" />
              <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" />
            </svg>
            <input
              type="password"
              className="input"
              placeholder="Enter your Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignupRoute ? 'new-password' : 'current-password'}
              minLength={isSignupRoute ? 6 : undefined}
              required
            />
          </div>

          {isSignupRoute ? (
            <>
              <div className="flex-column">
                <label>Confirm Password </label>
              </div>
              <div className="inputForm">
                <svg height={20} viewBox="-64 0 512 512" width={20} xmlns="http://www.w3.org/2000/svg">
                  <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" />
                  <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" />
                </svg>
                <input
                  type="password"
                  className="input"
                  placeholder="Confirm your Password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </>
          ) : (
            <div className="flex-row">
              <div>
                <input type="radio" checked={rememberMe} onChange={() => setRememberMe((value) => !value)} />
                <label>Remember me </label>
              </div>
              <span className="span" role="button" tabIndex={0} onClick={handleForgotPasswordClick} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleForgotPasswordClick();
                }
              }}>
                Forgot password?
              </span>
            </div>
          )}

          <button className="button-submit" type="submit" disabled={submitting || googleSubmitting || Boolean(configError)}>
            {submitting ? (isSignupRoute ? 'Creating Account...' : 'Signing In...') : isSignupRoute ? 'Sign Up' : 'Sign In'}
          </button>
          <p className="p">
            {isSignupRoute ? 'Already have an account? ' : "Don't have an account? "}
            <span className="span" role="button" tabIndex={0} onClick={toggleMode} onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMode();
              }
            }}>
              {isSignupRoute ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
          {!isSignupRoute ? (
            <>
              <p className="p line">Or With</p>
              <div className="flex-row">
                <button className="btn google" type="button" onClick={handleGoogleSignIn} disabled={Boolean(configError) || googleSubmitting || submitting}>
                  <svg
                    version="1.1"
                    width={20}
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 512 512"
                    style={{ enableBackground: 'new 0 0 512 512' } as React.CSSProperties}
                    xmlSpace="preserve"
                  >
                    <path
                      style={{ fill: '#FBBB00' }}
                      d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256
       c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456
       C103.821,274.792,107.225,292.797,113.47,309.408z"
                    />
                    <path
                      style={{ fill: '#518EF8' }}
                      d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451
       c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535
       c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z"
                    />
                    <path
                      style={{ fill: '#28B446' }}
                      d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512
       c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771
       c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z"
                    />
                    <path
                      style={{ fill: '#F14336' }}
                      d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012
       c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0
       C318.115,0,375.068,22.126,419.404,58.936z"
                    />
                  </svg>
                  {googleSubmitting ? 'Google...' : 'Google'}
                </button>
              </div>
            </>
          ) : null}

          {error ? <p className="p">{error}</p> : null}
          {configError ? <p className="p">{configError}</p> : null}
          {!configError && authFlowError ? <p className="p">{authFlowError}</p> : null}
        </form>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  min-height: 100dvh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: #1f1f1f;

  .page-shell {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: #1f1f1f;
    padding: 30px;
    width: 450px;
    border-radius: 20px;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Open Sans',
      'Helvetica Neue',
      sans-serif;
  }

  .title {
    color: #f1f1f1;
    font-size: 24px;
    margin: 0;
    line-height: 1.2;
  }

  .subtitle {
    color: #b9bac1;
    margin: 0 0 6px;
    font-size: 14px;
  }

  ::placeholder {
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Open Sans',
      'Helvetica Neue',
      sans-serif;
    color: #aaa;
  }

  .form button {
    align-self: flex-end;
  }

  .flex-column > label {
    color: #f1f1f1;
    font-weight: 600;
  }

  .inputForm {
    border: 1.5px solid #333;
    border-radius: 10px;
    height: 50px;
    display: flex;
    align-items: center;
    padding-left: 10px;
    transition: 0.2s ease-in-out;
    background-color: #2b2b2b;
  }

  .input {
    margin-left: 10px;
    border-radius: 10px;
    border: none;
    width: 100%;
    height: 100%;
    background-color: #2b2b2b;
    color: #f1f1f1;
  }

  .input:focus {
    outline: none;
  }

  .inputForm:focus-within {
    border: 1.5px solid #2d79f3;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
  }

  .flex-row > div > label {
    font-size: 14px;
    color: #f1f1f1;
    font-weight: 400;
  }

  .span {
    font-size: 14px;
    margin-left: 5px;
    color: #2d79f3;
    font-weight: 500;
    cursor: pointer;
  }

  .button-submit {
    margin: 20px 0 10px 0;
    background-color: #2d79f3;
    border: none;
    color: white;
    font-size: 15px;
    font-weight: 500;
    border-radius: 10px;
    height: 50px;
    width: 100%;
    cursor: pointer;
  }

  .p {
    text-align: center;
    color: #f1f1f1;
    font-size: 14px;
    margin: 5px 0;
  }

  .btn {
    margin-top: 10px;
    width: 100%;
    height: 50px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 500;
    gap: 10px;
    border: 1px solid #333;
    background-color: #2b2b2b;
    color: #f1f1f1;
    cursor: pointer;
    transition: 0.2s ease-in-out;
  }

  .btn:hover {
    border: 1px solid #2d79f3;
  }

  .button-submit:disabled,
  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  @media (max-width: 520px) {
    .form {
      width: 100%;
    }
  }
`;
