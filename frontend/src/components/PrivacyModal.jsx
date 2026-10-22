import React, { useEffect } from 'react';
import { X, ShieldCheck, Cpu, HardDrive, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export function PrivacyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog privacy-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-top">
          <div className="modal-title-group">
            <ShieldCheck size={20} className="text-emerald" />
            <span className="mono bold uppercase">Zero-Persistence Privacy Blueprint</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close privacy modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="privacy-body">
          <div className="privacy-banner">
            <div className="banner-title">
              <Lock size={16} className="text-emerald" />
              <strong>Strict Guarantee: We never store your data. Period.</strong>
            </div>
            <p className="banner-sub">
              This application was architected from line one with zero databases, zero temp files,
              and zero persistent storage. Here is how your data travels through the pipeline:
            </p>
          </div>

          <div className="pillars-grid">
            {/* Pillar 1: Streaming Ingestion */}
            <div className="pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon bg-emerald-subtle">
                  <Cpu size={16} className="text-emerald" />
                </div>
                <div>
                  <h4 className="pillar-title">1. Volatile RAM Streaming</h4>
                  <span className="pillar-meta mono">ZERO DISK WRITES</span>
                </div>
              </div>
              <p className="pillar-text">
                Your <code>watch-history.json</code> is streamed directly into an in-memory SAX parser.
                Chunks are parsed in RAM and discarded immediately. No temporary files are ever created on disk.
              </p>
            </div>

            {/* Pillar 2: Evidence Aggregation */}
            <div className="pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon bg-blue-subtle">
                  <HardDrive size={16} className="text-blue" />
                </div>
                <div>
                  <h4 className="pillar-title">2. No Database or Logs</h4>
                  <span className="pillar-meta mono">EPHEMERAL LIFECYCLE</span>
                </div>
              </div>
              <p className="pillar-text">
                There is no MongoDB, PostgreSQL, SQLite, or Redis. Once the statistical engine extracts
                aggregate metrics (e.g. late-night ratio, top 5 channels), all raw title data is flushed from memory.
              </p>
            </div>

            {/* Pillar 3: AI Payload Capping */}
            <div className="pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon bg-amber-subtle">
                  <Sparkles size={16} className="text-amber" />
                </div>
                <div>
                  <h4 className="pillar-title">3. Sanitized Gemini Prompts</h4>
                  <span className="pillar-meta mono">&lt; 4KB STRICT PAYLOAD LIMIT</span>
                </div>
              </div>
              <p className="pillar-text">
                We never send your full history to Google Gemini. Only a curated, capped summary of anonymized
                frequencies and high-signal patterns (under 4,096 bytes) is passed to generate comedic punchlines.
              </p>
            </div>

            {/* Pillar 4: Ephemeral OAuth */}
            <div className="pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon bg-purple-subtle">
                  <Lock size={16} className="text-purple" />
                </div>
                <div>
                  <h4 className="pillar-title">4. Ephemeral OAuth Tokens</h4>
                  <span className="pillar-meta mono">IN-MEMORY ONLY</span>
                </div>
              </div>
              <p className="pillar-text">
                Quick Roast Mode 1 exchanges authorization codes strictly in-flight. Tokens are never saved
                to cookies, session stores, or database records and expire automatically.
              </p>
            </div>
          </div>

          <div className="privacy-footer-note">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>
              All API endpoints send <code>Cache-Control: no-store, no-cache, must-revalidate</code> headers to ensure
              zero client or proxy caching.
            </span>
          </div>
        </div>

        {/* Modal Action */}
        <div className="modal-actions">
          <button type="button" className="btn-primary mono" onClick={onClose} style={{ width: '100%' }}>
            Understood & Close
          </button>
        </div>
      </div>

      <style>{`
        .privacy-dialog {
          max-width: 620px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .privacy-body {
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .privacy-banner {
          background-color: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 8px;
          padding: 1rem;
        }

        .banner-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #34d399;
          font-size: 0.875rem;
          margin-bottom: 0.375rem;
        }

        .banner-sub {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .pillars-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }

        @media (min-width: 580px) {
          .pillars-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .pillar-card {
          background-color: var(--bg-root);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 1rem;
        }

        .pillar-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.625rem;
        }

        .pillar-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bg-emerald-subtle {
          background-color: rgba(16, 185, 129, 0.12);
        }

        .bg-blue-subtle {
          background-color: rgba(59, 130, 246, 0.12);
        }

        .bg-amber-subtle {
          background-color: rgba(245, 158, 11, 0.12);
        }

        .bg-purple-subtle {
          background-color: rgba(168, 85, 247, 0.12);
        }

        .text-emerald { color: #10b981; }
        .text-blue { color: #3b82f6; }
        .text-amber { color: #f59e0b; }
        .text-purple { color: #a855f7; }

        .pillar-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .pillar-meta {
          font-size: 0.625rem;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .pillar-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .privacy-footer-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          background-color: var(--bg-root);
          padding: 0.75rem 1rem;
          border-radius: 6px;
          border: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
