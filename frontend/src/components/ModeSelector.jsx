import React, { useState } from 'react';
import { UploadCloud, Zap, ShieldAlert, CheckCircle2, FileJson, ArrowRight } from 'lucide-react';

export function ModeSelector({
  activeMode,
  setActiveMode,
  onStartOAuth,
  onFileSelect,
  selectedFile,
  consentGiven,
  setConsentGiven,
  onSubmitTakeout,
  isProcessing
}) {
  const [showTakeoutGuide, setShowTakeoutGuide] = useState(false);

  return (
    <section className="mode-selector-section">
      <div className="container">
        {/* Mode Selector Tabs */}
        <div className="mode-tabs">
          <button
            type="button"
            className={`mode-tab ${activeMode === 'takeout' ? 'active' : ''}`}
            onClick={() => setActiveMode('takeout')}
          >
            <UploadCloud size={18} />
            <span>Mode 2: Full History Roast (Takeout)</span>
            <span className="tab-pill flame mono">Maximum Savage</span>
          </button>

          <button
            type="button"
            className={`mode-tab ${activeMode === 'oauth' ? 'active' : ''}`}
            onClick={() => setActiveMode('oauth')}
          >
            <Zap size={18} />
            <span>Mode 1: Quick Roast (Google OAuth)</span>
            <span className="tab-pill neutral mono">1-Click</span>
          </button>
        </div>

        {/* Mode 2: Takeout Upload */}
        {activeMode === 'takeout' && (
          <div className="mode-card takeout-card">
            <div className="mode-card-header">
              <div className="mode-card-title-group">
                <h2>Full History Takeout Roast</h2>
                <p>
                  Upload your unzipped <code>watch-history.json</code>. Analyzes chronological
                  late-night binges, re-watches, and rabbit holes without saving anything to disk.
                </p>
              </div>
              <button
                type="button"
                className="guide-toggle mono"
                onClick={() => setShowTakeoutGuide(!showTakeoutGuide)}
              >
                {showTakeoutGuide ? 'Hide Takeout Instructions' : 'How to get watch-history.json?'}
              </button>
            </div>

            {/* Collapsible Takeout Guide */}
            {showTakeoutGuide && (
              <div className="takeout-guide">
                <ol className="guide-steps">
                  <li>
                    Visit{' '}
                    <a
                      href="https://takeout.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="guide-link"
                    >
                      Google Takeout ↗
                    </a>
                    .
                  </li>
                  <li>Click <strong>Deselect all</strong>, then scroll down and check <strong>YouTube and YouTube Music</strong>.</li>
                  <li>Click <strong>All YouTube data included</strong>, select <strong>history</strong> only, and ensure format is <strong>JSON</strong>.</li>
                  <li>Create export, download the ZIP, extract it, and drop the <strong>watch-history.json</strong> file below.</li>
                </ol>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              className={`dropzone ${selectedFile ? 'has-file' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  onFileSelect(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                type="file"
                id="takeout-file-input"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onFileSelect(e.target.files[0]);
                  }
                }}
              />

              {!selectedFile ? (
                <label htmlFor="takeout-file-input" className="dropzone-label">
                  <div className="dropzone-icon">
                    <UploadCloud size={32} />
                  </div>
                  <span className="dropzone-main-text">
                    Drag and drop your <code>watch-history.json</code> here
                  </span>
                  <span className="dropzone-sub-text">
                    or click to browse from your device (Max 100 MB · Pure RAM streaming)
                  </span>
                </label>
              ) : (
                <div className="file-preview">
                  <FileJson size={28} className="file-icon" />
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size mono">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={() => onFileSelect(null)}
                    title="Remove file"
                  >
                    Change File
                  </button>
                </div>
              )}
            </div>

            {/* Explicit Consent Checkbox (API-05) */}
            <div className="consent-container">
              <label className="consent-label">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="consent-checkbox"
                />
                <span className="consent-text">
                  I consent to streaming my watch history in-memory to Google Gemini for roast
                  generation. I understand my data is processed ephemerally and never written to a
                  database or disk.
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="card-actions">
              <button
                type="button"
                className="btn-primary btn-submit-roast"
                disabled={!selectedFile || !consentGiven || isProcessing}
                onClick={onSubmitTakeout}
              >
                <span>Generate Full Takeout Roast</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mode 1: OAuth Quick Roast */}
        {activeMode === 'oauth' && (
          <div className="mode-card oauth-card">
            <div className="mode-card-header">
              <div className="mode-card-title-group">
                <h2>Quick Roast via Google Sign-In</h2>
                <p>
                  One-click Google authentication. Reads your public subscriptions and liked videos to
                  construct a comedic taste profile without requiring file downloads.
                </p>
              </div>
            </div>

            {/* Mandatory Mode 1 Disclaimer Badge (API-04) */}
            <div className="disclaimer-badge-box">
              <ShieldAlert size={20} className="disclaimer-icon" />
              <div className="disclaimer-content">
                <strong>Honest Data Boundary:</strong>
                <p>
                  This roast is based on your Subscriptions and Liked Videos taste profile. The
                  YouTube API does not provide access to private, unliked watch history. Your
                  ephemeral OAuth token is deleted from memory immediately upon signal extraction.
                </p>
              </div>
            </div>

            <div className="oauth-features">
              <div className="feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span>Zero file downloads or Takeout exports required</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span>Identifies your favorite creators and recurring tastes</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span>Token discarded immediately in RAM with zero storage</span>
              </div>
            </div>

            <div className="card-actions">
              <button
                type="button"
                className="btn-google-oauth"
                onClick={onStartOAuth}
                disabled={isProcessing}
              >
                <svg className="google-logo" viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.09 3.66-5.17 3.66-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.42l4.04-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Sign in with Google to Roast My Taste</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .mode-selector-section {
          padding: 1.5rem 0 4rem;
        }

        .mode-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          max-width: 820px;
          margin-left: auto;
          margin-right: auto;
        }

        .mode-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 1rem 1.25rem;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out;
        }

        .mode-tab:hover {
          background-color: var(--bg-surface-raised);
          color: var(--text-primary);
        }

        .mode-tab.active {
          background-color: var(--bg-surface-raised);
          border-color: var(--border-focus);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .tab-pill {
          font-size: 0.6875rem;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
        }

        .tab-pill.flame {
          background: var(--accent-flame-subtle);
          color: var(--accent-flame);
          border: 1px solid var(--accent-flame-border);
        }

        .tab-pill.neutral {
          background: var(--bg-subtle);
          color: var(--text-secondary);
          border: 1px solid var(--border-medium);
        }

        .mode-card {
          max-width: 820px;
          margin: 0 auto;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 2.25rem;
          box-shadow: var(--shadow-card);
        }

        .mode-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 1.75rem;
        }

        .mode-card-title-group h2 {
          font-size: 1.375rem;
          margin-bottom: 0.5rem;
        }

        .mode-card-title-group p {
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .mode-card-title-group code {
          background: var(--bg-subtle);
          padding: 0.15rem 0.375rem;
          border-radius: 4px;
          font-size: 0.8125rem;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .guide-toggle {
          white-space: nowrap;
          font-size: 0.8125rem;
          color: var(--accent-flame);
          text-decoration: underline;
          cursor: pointer;
          background: none;
        }

        .takeout-guide {
          background: var(--bg-surface-raised);
          border: 1px solid var(--border-medium);
          border-radius: 10px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.75rem;
          font-size: 0.875rem;
        }

        .guide-steps {
          margin-left: 1.25rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .guide-link {
          color: var(--accent-flame);
          font-weight: 600;
          text-decoration: underline;
        }

        .dropzone {
          border: 2px dashed var(--border-medium);
          border-radius: 12px;
          padding: 2.5rem 1.5rem;
          background: var(--bg-subtle);
          text-align: center;
          cursor: pointer;
          transition: border-color 150ms ease-out, background-color 150ms ease-out;
        }

        .dropzone:hover {
          border-color: var(--border-focus);
          background-color: var(--bg-subtle-hover);
        }

        .dropzone.has-file {
          border-style: solid;
          border-color: var(--border-focus);
          background-color: var(--bg-surface-raised);
          padding: 1.5rem;
        }

        .dropzone-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .dropzone-icon {
          color: var(--accent-flame);
        }

        .dropzone-main-text {
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .dropzone-sub-text {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          text-align: left;
        }

        .file-icon {
          color: var(--accent-flame);
        }

        .file-info {
          flex: 1;
        }

        .file-name {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .file-remove-btn {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          border: 1px solid var(--border-medium);
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
        }

        .file-remove-btn:hover {
          background: var(--bg-subtle);
          color: var(--text-primary);
        }

        .consent-container {
          margin-top: 1.5rem;
          padding: 1rem;
          background: var(--bg-surface-raised);
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
        }

        .consent-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }

        .consent-checkbox {
          margin-top: 0.25rem;
          width: 16px;
          height: 16px;
          accent-color: var(--accent-flame);
          cursor: pointer;
        }

        .consent-text {
          font-size: 0.8125rem;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        .card-actions {
          margin-top: 1.75rem;
          display: flex;
          justify-content: flex-end;
        }

        .btn-submit-roast {
          width: 100%;
          padding: 0.875rem 1.75rem;
          font-size: 1rem;
        }

        .btn-submit-roast:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* OAuth Card Specifics */
        .disclaimer-badge-box {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 1.125rem 1.25rem;
          background: var(--accent-amber-subtle);
          border: 1px solid var(--accent-amber-border);
          border-radius: 10px;
          margin-bottom: 1.5rem;
        }

        .disclaimer-icon {
          color: var(--accent-amber);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .disclaimer-content strong {
          display: block;
          color: var(--accent-amber);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .disclaimer-content p {
          color: var(--text-secondary);
          font-size: 0.8125rem;
          line-height: 1.5;
        }

        .oauth-features {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .feature-check {
          color: var(--accent-emerald);
        }

        .btn-google-oauth {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background-color: #ffffff;
          color: #1f1f1f;
          font-weight: 600;
          font-size: 0.9375rem;
          padding: 0.875rem 1.5rem;
          border-radius: 8px;
          transition: background-color 150ms ease-out, transform 120ms ease-out;
        }

        .btn-google-oauth:hover {
          background-color: #f2f2f2;
        }

        .btn-google-oauth:active {
          transform: scale(0.98);
        }

        @media (max-width: 640px) {
          .mode-tabs {
            flex-direction: column;
          }
          .mode-card {
            padding: 1.5rem;
          }
          .mode-card-header {
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
