import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';

import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { ModeSelector } from './components/ModeSelector.jsx';
import { ProcessingTicker } from './components/ProcessingTicker.jsx';
import { RoastReport } from './components/RoastReport.jsx';
import { PrivacyModal } from './components/PrivacyModal.jsx';
import { Footer } from './components/Footer.jsx';

import {
  fetchDemoRoast,
  fetchOAuthUrl,
  executeOAuthCallback,
  uploadTakeoutHistory
} from './api.js';

export function App() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'report' | 'error'
  const [activeMode, setActiveMode] = useState('takeout'); // 'takeout' | 'oauth'
  const [selectedFile, setSelectedFile] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [roastData, setRoastData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // StrictMode / duplicate guard for single-use authorization code (SEC-02, PRIV-01)
  const oauthCodeHandledRef = React.useRef(false);

  // Check for OAuth callback code on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code && !oauthCodeHandledRef.current) {
      oauthCodeHandledRef.current = true;
      // Immediately clean authorization code from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    setStatus('processing');
    setErrorMessage(null);
    try {
      const data = await executeOAuthCallback(code);
      if (data?.isInsufficient) {
        setStatus('idle');
        setErrorMessage(data.message || 'Insufficient viewing or subscription data found to generate a roast.');
        return;
      }
      setRoastData(data);
      setStatus('report');
    } catch (err) {
      setStatus('idle');
      setErrorMessage(err.message || 'Google OAuth quick roast failed. Please try again.');
    }
  };

  const handleStartOAuth = async () => {
    setErrorMessage(null);
    try {
      const data = await fetchOAuthUrl();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('OAuth authentication URL was not returned by server.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initialize Google OAuth sign-in.');
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleSubmitTakeout = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or drop your watch-history.json file before submitting.');
      return;
    }

    if (!consentGiven) {
      setErrorMessage('Explicit consent is required: please check the authorization checkbox.');
      return;
    }

    setErrorMessage(null);
    setStatus('uploading');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const data = await uploadTakeoutHistory(selectedFile, {
        consent: consentGiven,
        onProgress: (pct) => {
          setUploadProgress(pct);
          if (pct >= 100) {
            setIsUploading(false);
            setStatus('processing');
          }
        }
      });

      setRoastData(data);
      setStatus('report');
      setIsUploading(false);
    } catch (err) {
      setStatus('idle');
      setIsUploading(false);
      setErrorMessage(err.message || 'Takeout analysis failed. Please verify the JSON file.');
    }
  };

  const handleLoadDemo = async () => {
    setErrorMessage(null);
    setStatus('processing');
    setIsUploading(false);

    try {
      const data = await fetchDemoRoast();
      setRoastData(data);
      setStatus('report');
    } catch (err) {
      setStatus('idle');
      setErrorMessage(err.message || 'Failed to load sample demo roast.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setRoastData(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <div className="app-layout">
      {/* Persistent Navigation Header */}
      <Header
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onLoadDemo={handleLoadDemo}
        isProcessing={isProcessing}
      />

      {/* Main App Content */}
      <main className="app-main">
        {/* Dismissible Error Banner */}
        {errorMessage && (
          <div className="container">
            <div className="error-banner" role="alert">
              <div className="error-content">
                <AlertCircle size={18} className="text-flame flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                className="btn-dismiss"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* View Switch: Report vs Landing & Inputs */}
        {status === 'report' && roastData ? (
          <RoastReport
            data={roastData}
            onReset={handleReset}
            mode={activeMode}
          />
        ) : (
          <>
            <Hero />

            {isProcessing ? (
              <ProcessingTicker
                uploadProgress={uploadProgress}
                isUploading={isUploading}
              />
            ) : (
              <ModeSelector
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                onStartOAuth={handleStartOAuth}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                consentGiven={consentGiven}
                setConsentGiven={setConsentGiven}
                onSubmitTakeout={handleSubmitTakeout}
                isProcessing={isProcessing}
              />
            )}
          </>
        )}
      </main>

      {/* Footer & Privacy Modal */}
      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
        }

        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: rgba(225, 29, 72, 0.1);
          border: 1px solid var(--accent-flame-border);
          border-radius: 8px;
          padding: 0.875rem 1.25rem;
          margin-top: 1.5rem;
          animation: bannerSlideDown 150ms ease-out;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: #fca5a5;
        }

        .flex-shrink-0 {
          flex-shrink: 0;
        }

        .text-flame {
          color: var(--accent-flame);
        }

        .text-emerald {
          color: var(--accent-emerald);
        }

        .btn-dismiss {
          color: var(--text-muted);
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-dismiss:hover {
          color: var(--text-primary);
          background-color: var(--accent-flame-subtle);
        }

        @keyframes bannerSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
