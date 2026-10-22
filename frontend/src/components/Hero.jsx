import React from 'react';
import { Flame, ShieldCheck, DatabaseZap, Crosshair } from 'lucide-react';

export function Hero() {
  return (
    <section className="hero-section">
      <div className="container hero-container">
        <div className="hero-badge badge badge-flame">
          <Flame size={12} />
          <span>Brutally Honest AI Analysis</span>
        </div>

        <h1 className="hero-title">
          Your 3 AM YouTube spirals, <br />
          <span className="hero-highlight">ruthlessly roasted.</span>
        </h1>

        <p className="hero-subtitle">
          Connect your account for a 1-click Taste Profile roast or drop your Google Takeout archive
          for the unabridged truth. Calculates your deterministic Brainrot Score and dissects your
          questionable digital obsessions.
        </p>

        <div className="hero-guarantees">
          <div className="guarantee-item">
            <DatabaseZap size={16} className="guarantee-icon emerald" />
            <span className="mono">0 Database Storage</span>
          </div>
          <div className="guarantee-divider" />
          <div className="guarantee-item">
            <ShieldCheck size={16} className="guarantee-icon emerald" />
            <span className="mono">Pure RAM Streaming</span>
          </div>
          <div className="guarantee-divider" />
          <div className="guarantee-item">
            <Crosshair size={16} className="guarantee-icon flame" />
            <span className="mono">Grounded Punchlines Only</span>
          </div>
        </div>
      </div>

      <style>{`
        .hero-section {
          padding: 4.5rem 0 2.5rem;
          text-align: center;
        }

        .hero-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-badge {
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.035em;
          margin-bottom: 1.25rem;
          max-width: 820px;
        }

        .hero-highlight {
          color: var(--accent-flame);
          display: inline-block;
          position: relative;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.1875rem);
          max-width: 680px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 2.25rem;
        }

        .hero-guarantees {
          display: inline-flex;
          align-items: center;
          gap: 1.25rem;
          padding: 0.75rem 1.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 9999px;
          font-size: 0.8125rem;
          color: var(--text-tertiary);
          box-shadow: var(--shadow-sm);
        }

        .guarantee-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .guarantee-icon.emerald {
          color: var(--accent-emerald);
        }

        .guarantee-icon.flame {
          color: var(--accent-flame);
        }

        .guarantee-divider {
          width: 1px;
          height: 14px;
          background-color: var(--border-medium);
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 3rem 0 1.5rem;
          }
          .hero-guarantees {
            flex-direction: column;
            gap: 0.5rem;
            border-radius: 12px;
            padding: 1rem;
            width: 100%;
          }
          .guarantee-divider {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
