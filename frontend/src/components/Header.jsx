import React from 'react';
import { Flame, ShieldCheck, Sparkles } from 'lucide-react';

export function Header({ onOpenPrivacy, onLoadDemo, isProcessing }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand" onClick={() => window.location.reload()} role="button" tabIndex={0}>
          <div className="brand-icon">
            <Flame size={20} className="flame-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">YT ROAST</span>
            <span className="brand-tag mono">AI</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="privacy-trigger badge badge-emerald"
            onClick={onOpenPrivacy}
            title="Inspect zero-storage privacy architecture"
          >
            <ShieldCheck size={14} />
            <span>0 PERSISTENCE · RAM STREAMING</span>
          </button>

          <button
            type="button"
            className="btn-demo mono"
            onClick={onLoadDemo}
            disabled={isProcessing}
            title="Load sample roast without signing in or uploading"
          >
            <Sparkles size={14} />
            <span>Sample Roast</span>
          </button>
        </div>
      </div>

      <style>{`
        .site-header {
          border-bottom: 1px solid var(--border-subtle);
          background-color: rgba(9, 10, 12, 0.85);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          cursor: pointer;
          user-select: none;
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--accent-flame-subtle);
          border: 1px solid var(--accent-flame-border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flame-icon {
          color: var(--accent-flame);
        }

        .brand-text {
          display: flex;
          align-items: baseline;
          gap: 0.375rem;
        }

        .brand-title {
          font-weight: 800;
          font-size: 1.125rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .brand-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-flame);
          background: var(--accent-flame-subtle);
          padding: 0.1rem 0.375rem;
          border-radius: 4px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .privacy-trigger {
          cursor: pointer;
          transition: background-color 150ms ease-out;
        }

        .privacy-trigger:hover {
          background-color: rgba(16, 185, 129, 0.2);
        }

        .btn-demo {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-medium);
          color: var(--text-primary);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
        }

        .btn-demo:hover:not(:disabled) {
          background-color: var(--bg-subtle-hover);
          border-color: var(--border-focus);
        }

        .btn-demo:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .privacy-trigger span {
            display: none;
          }
          .privacy-trigger {
            padding: 0.375rem;
          }
        }
      `}</style>
    </header>
  );
}
