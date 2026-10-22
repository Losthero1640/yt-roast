import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Flame, Shield, Share2 } from 'lucide-react';

export function ShareCard({ cardPayload, archetype, verdict, onClose }) {
  const [copied, setCopied] = useState(false);

  const score = cardPayload?.brainrotScore ?? 0;
  const tier = cardPayload?.tier ?? 'Casual';
  const headline = cardPayload?.headline || archetype || 'Certified Slime Brain';
  const topCrime = cardPayload?.topCrime || 'Endless late-night autoplay loops';

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const copyShareText = async () => {
    const text = `🔥 YouTube Roast AI: I got a Brainrot Score of ${score}/100 (${tier})!\nArchetype: "${headline}"\nTop Crime: "${topCrime}"\nVerdict: "${verdict}"\n\nAnalyzed with zero persistence at YouTube Roast AI`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback if clipboard API fails
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-top">
          <div className="modal-title-group">
            <Share2 size={18} className="text-flame" />
            <span className="mono bold uppercase">Shareable Roast Card</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visual Share Card */}
        <div className="share-card-container">
          <div className="card-badge-row">
            <span className="card-brand mono">YT ROAST // CERTIFICATE</span>
            <span className="card-privacy-tag mono">
              <Shield size={10} /> ZERO STORAGE
            </span>
          </div>

          <div className="card-body">
            <div className="card-score-box">
              <div className="card-score-num mono">{score}</div>
              <div className="card-score-denom mono">/ 100</div>
              <div className="card-flame">
                <Flame size={28} />
              </div>
            </div>

            <div className="card-tier-pill mono uppercase">{tier}</div>

            <div className="card-headline-group">
              <div className="card-label mono">DIAGNOSED ARCHETYPE</div>
              <div className="card-headline">{headline}</div>
            </div>

            <div className="card-crime-group">
              <div className="card-label mono">TOP CRIMINAL ACTIVITY</div>
              <div className="card-crime">"{topCrime}"</div>
            </div>

            {verdict && (
              <div className="card-verdict-box">
                <span className="card-label mono">VERDICT:</span>
                <span className="card-verdict-text">{verdict}</span>
              </div>
            )}
          </div>

          <div className="card-footer mono">
            <span>AUDITED BY GEMINI FLASH</span>
            <span>PRIVACY-FIRST ENGINE</span>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-primary copy-button mono"
            onClick={copyShareText}
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Shareable Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-secondary mono"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 100;
          animation: modalFadeIn 180ms ease-out;
        }

        .modal-dialog {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: 14px;
          max-width: 480px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
        }

        .modal-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          background-color: var(--bg-root);
        }

        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .btn-close {
          color: var(--text-muted);
          padding: 0.35rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-close:hover {
          color: var(--text-primary);
          background-color: var(--bg-surface);
        }

        .share-card-container {
          margin: 1.25rem;
          background: linear-gradient(145deg, #18191f 0%, #101115 100%);
          border: 1px solid var(--border-medium);
          border-radius: 12px;
          padding: 1.5rem;
          position: relative;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .card-badge-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.6875rem;
          color: var(--text-muted);
          padding-bottom: 1rem;
          border-bottom: 1px dashed var(--border-subtle);
        }

        .card-privacy-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #34d399;
        }

        .card-body {
          padding: 1.25rem 0;
          text-align: center;
        }

        .card-score-box {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
          position: relative;
        }

        .card-score-num {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1;
          color: var(--text-primary);
        }

        .card-score-denom {
          font-size: 1.25rem;
          color: var(--text-muted);
        }

        .card-flame {
          color: var(--accent-flame);
          margin-left: 0.5rem;
        }

        .card-tier-pill {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.875rem;
          border-radius: 9999px;
          background-color: var(--accent-flame-subtle);
          color: var(--accent-flame);
          border: 1px solid var(--accent-flame-border);
          margin: 0.75rem 0 1.25rem;
        }

        .card-label {
          font-size: 0.625rem;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .card-headline {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin-bottom: 1rem;
        }

        .card-crime-group {
          background-color: rgba(9, 10, 12, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          text-align: left;
        }

        .card-crime {
          font-size: 0.8125rem;
          color: #fca5a5;
          font-style: italic;
        }

        .card-verdict-box {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: left;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          border-left: 2px solid var(--border-medium);
          padding-left: 0.75rem;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.625rem;
          color: var(--text-muted);
          padding-top: 1rem;
          border-top: 1px dashed var(--border-subtle);
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background-color: var(--bg-root);
          border-top: 1px solid var(--border-subtle);
        }

        .copy-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
