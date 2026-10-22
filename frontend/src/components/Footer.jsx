import React from 'react';
import { ShieldCheck, Heart, Terminal } from 'lucide-react';

export function Footer({ onOpenPrivacy }) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo mono">
              <span className="bold text-flame">YT ROAST</span>
              <span className="dim"> / AI</span>
            </div>
            <p className="footer-desc">
              Privacy-first comedic autopsy of your YouTube watching habits.
              Zero databases, zero disk caching, 100% ephemeral RAM streaming.
            </p>
          </div>

          <div className="footer-links-col">
            <span className="col-heading mono">ARCHITECTURE</span>
            <ul className="footer-link-list">
              <li>
                <button type="button" className="footer-link-btn" onClick={onOpenPrivacy}>
                  <ShieldCheck size={13} className="text-emerald" />
                  <span>Privacy Blueprint</span>
                </button>
              </li>
              <li>
                <span className="footer-static-item mono">
                  <Terminal size={13} />
                  <span>SAX Stream Parser</span>
                </span>
              </li>
              <li>
                <span className="footer-static-item mono">
                  <span>Gemini 2.5 Flash</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-disclaimer">
          <p>
            <strong>Disclaimer:</strong> YouTube Roast AI is an independent experimental application
            and is not affiliated with, sponsored by, or endorsed by Google LLC, YouTube, or Alphabet Inc.
            YouTube™ is a trademark of Google LLC. All data is processed ephemerally in volatile memory
            under your explicit consent and immediately discarded upon response completion.
          </p>
        </div>

        <div className="footer-bottom">
          <div className="mono text-muted copyright-text">
            <span>© {new Date().getFullYear()} YT ROAST AI</span>
            <span>·</span>
            <span>FASTIFY + REACT ESM</span>
          </div>

          <div className="system-pill mono">
            <span className="status-dot"></span>
            <span>ZERO PERSISTENCE CERTIFIED</span>
          </div>
        </div>
      </div>

      <style>{`
        .site-footer {
          border-top: 1px solid var(--border-subtle);
          background-color: var(--bg-root);
          padding: 3.5rem 0 2rem;
          color: var(--text-secondary);
        }

        .footer-inner {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .footer-top {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 2rem;
        }

        @media (min-width: 640px) {
          .footer-top {
            flex-direction: row;
          }
        }

        .footer-brand-col {
          max-width: 380px;
        }

        .footer-logo {
          font-size: 1.125rem;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }

        .footer-desc {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: var(--text-muted);
        }

        .footer-links-col {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .col-heading {
          font-size: 0.6875rem;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }

        .footer-link-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .footer-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          padding: 0;
        }

        .footer-link-btn:hover {
          color: var(--text-primary);
        }

        .footer-static-item {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .footer-disclaimer {
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.75rem;
          line-height: 1.6;
          color: var(--text-muted);
        }

        .footer-disclaimer strong {
          color: var(--text-secondary);
        }

        .footer-bottom {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        @media (min-width: 640px) {
          .footer-bottom {
            flex-direction: row;
            align-items: center;
          }
        }

        .copyright-text {
          font-size: 0.75rem;
          display: flex;
          gap: 0.5rem;
        }

        .system-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.6875rem;
          color: #34d399;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </footer>
  );
}
