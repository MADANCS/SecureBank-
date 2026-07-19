import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

export function SessionTimeoutOverlay() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!username) return;

    let timeoutWarning: ReturnType<typeof setTimeout>;
    let logoutTimer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const resetTimers = () => {
      clearTimeout(timeoutWarning);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
      setShowWarning(false);
      setCountdown(60);

      // Warning at 14 minutes (assuming 15 min JWT expiry)
      timeoutWarning = setTimeout(() => {
        setShowWarning(true);
        // Start countdown for the last 60 seconds
        countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 14 * 60 * 1000);

      // Auto logout at 15 minutes
      logoutTimer = setTimeout(() => {
        handleLogout();
      }, 15 * 60 * 1000);
    };

    // Listen for activity to reset timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    events.forEach(event => document.addEventListener(event, handleActivity));
    resetTimers();

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      clearTimeout(timeoutWarning);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
    };
  }, [username, showWarning]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/signin', { replace: true });
    setShowWarning(false);
  };

  const handleStayLoggedIn = async () => {
    try {
      // Refresh the token via API
      const refreshPayload = {
        refreshToken: localStorage.getItem('refreshToken')
      };
      const result = await axios.post('/auth/refresh-token', refreshPayload);
      localStorage.setItem('accessToken', result.data.accessToken);
      
      // Close warning and reset timers implicitly by user activity
      setShowWarning(false);
    } catch (err) {
      handleLogout(); // Force logout if refresh fails
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Session Expiring</h2>
        <p className="text-slate-600 text-center mb-6">
          You've been inactive for a while. For your security, you will be automatically logged out in <strong className="text-red-600">{countdown}</strong> seconds.
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition font-medium"
          >
            Log Out Now
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition font-medium"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
