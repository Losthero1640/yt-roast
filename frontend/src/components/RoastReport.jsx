import React, { useState } from 'react';
import {
  RotateCcw,
  Share2,
  Flame,
  AlertTriangle,
  Quote,
  CheckCircle2,
  Sparkles,
  Layers,
  Clock,
  Repeat
} from 'lucide-react';
import { ShareCard } from './ShareCard.jsx';

export function RoastReport({ data = {}, onReset, mode = 'takeout' }) {
  const [showShareModal, setShowShareModal] = useState(false);

  const roast = data?.roast || data || {};
  const scoreDetails = data?.scoreDetails || null;
  const disclaimerBadge = data?.disclaimer || data?.disclaimerBadge || null;
  const score = roast?.brainrotScore ?? scoreDetails?.score ?? 0;
  const tier = scoreDetails?.tier || roast?.cardPayload?.tier || 'Casual';

  // Tier color mapper
  const getTierClass = (tierName) => {
    switch (tierName) {
      case 'Monk':
        return 'badge-emerald';
      case 'Casual':
        return 'badge-neutral';
      case 'Slime Brain':
        return 'badge-amber';
      case 'Deep Fried':
      case 'Digital Zombie':
        return 'badge-flame';
      default:
        return 'badge-neutral';
    }
  };

  const getStyleLabel = (style) => {
    switch (style) {
      case 'specific':
        return { label: 'Specific Target', icon: <Sparkles size={12} /> };
      case 'combination':
        return { label: 'Unholy Combo', icon: <Layers size={12} /> };
      case 'pattern':
        return { label: 'Observed Pattern', icon: <Repeat size={12} /> };
      case 'archetype':
        return { label: 'Persona Diagnosis', icon: <Flame size={12} /> };
      default:
        return { label: 'Roast Punchline', icon: <Flame size={12} /> };
    }
  };

  return (
    <section className="report-section">
      <div className="container">
        {/* Navigation & Action Bar */}
        <div className="report-action-bar">
          <button type="button" className="btn-back" onClick={onReset}>
            <RotateCcw size={16} />
            <span>Roast Another Account</span>
          </button>

          <div className="report-mode-stamp">
            {disclaimerBadge ? (
              <span className="badge badge-amber mono">
                Taste Profile Roast (OAuth)
              </span>
            ) : (
              <span className="badge badge-flame mono">
                Full History Roast (Takeout)
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn-primary btn-share"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 size={16} />
            <span>Share Social Card</span>
          </button>
        </div>

        {/* Mode 1 Disclaimer Notice if applicable */}
        {disclaimerBadge && (
          <div className="oauth-disclaimer-banner">
            <AlertTriangle size={18} className="banner-icon" />
            <p className="mono">{disclaimerBadge}</p>
          </div>
        )}

        {/* Master Score & Archetype Hero Card */}
        <div className="score-hero-card">
          <div className="score-column">
            <span className="score-label mono">Brainrot Score</span>
            <div className="score-display">
              <span className="score-number">{score}</span>
              <span className="score-total mono">/100</span>
            </div>
            <div className={`score-tier-badge badge ${getTierClass(tier)}`}>
              {tier}
            </div>
          </div>

          <div className="archetype-column">
            <span className="archetype-label mono">Viewing Archetype</span>
            <h2 className="archetype-title">{roast.viewingArchetype}</h2>
            <p className="roast-summary">{roast.roastSummary}</p>

            {scoreDetails?.subscores && (
              <div className="subscores-bar">
                {scoreDetails.subscores.lateNight !== null && (
                  <div className="subscore-item mono">
                    <Clock size={13} />
                    <span>Late Night: <strong>{scoreDetails.subscores.lateNight}</strong></span>
                  </div>
                )}
                {scoreDetails.subscores.repetition !== null && (
                  <div className="subscore-item mono">
                    <Repeat size={13} />
                    <span>Replay Ratio: <strong>{scoreDetails.subscores.repetition}</strong></span>
                  </div>
                )}
                {scoreDetails.subscores.velocity !== null && (
                  <div className="subscore-item mono">
                    <Flame size={13} />
                    <span>Binge Velocity: <strong>{scoreDetails.subscores.velocity}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grounded Jokes Grid */}
        <div className="jokes-section">
          <div className="section-header">
            <h3>Dissected Habit Punchlines</h3>
            <span className="section-note mono">Ground truth evidence, zero hallucinations</span>
          </div>

          <div className="jokes-grid">
            {roast.roasts?.map((item, idx) => {
              const meta = getStyleLabel(item.style);
              return (
                <div key={idx} className="joke-card">
                  <div className="joke-card-top">
                    <span className="joke-style-badge badge badge-neutral mono">
                      {meta.icon}
                      <span>{meta.label}</span>
                    </span>

                    {item.referencedItem && (
                      <span className="referenced-item-pill mono" title="Target item">
                        {item.referencedItem}
                      </span>
                    )}
                  </div>

                  <p className="joke-text">{item.joke}</p>

                  <div className="joke-evidence">
                    <span className="evidence-label mono">Observed Evidence:</span>
                    <p className="evidence-text">{item.supportingEvidence}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Digital Red Flags */}
        {roast.redFlags && roast.redFlags.length > 0 && (
          <div className="red-flags-card">
            <div className="flags-header">
              <AlertTriangle size={20} className="flags-icon" />
              <h3>Digital Red Flags & Content Rabbit Holes</h3>
            </div>
            <ul className="flags-list">
              {roast.redFlags.map((flag, idx) => (
                <li key={idx} className="flag-item">
                  <span className="flag-bullet mono">#{idx + 1}</span>
                  <span className="flag-text">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Final Verdict Callout */}
        <div className="verdict-card">
          <div className="verdict-icon">
            <Quote size={28} />
          </div>
          <div className="verdict-content">
            <span className="verdict-label mono">Final Takeaway</span>
            <p className="verdict-text">{roast.finalVerdict}</p>
          </div>
        </div>
      </div>

      {/* Shareable Card Modal */}
      {showShareModal && (
        <ShareCard
          cardPayload={roast.cardPayload}
          archetype={roast.viewingArchetype}
          verdict={roast.finalVerdict}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <style>{`
        .report-section {
          padding: 2rem 0 5rem;
        }

        .report-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          border: 1px solid var(--border-subtle);
        }

        .btn-back:hover {
          background-color: var(--bg-surface);
          color: var(--text-primary);
        }

        .btn-share {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }

        .oauth-disclaimer-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--accent-amber-subtle);
          border: 1px solid var(--accent-amber-border);
          border-radius: 8px;
          padding: 0.75rem 1.25rem;
          margin-bottom: 2rem;
          font-size: 0.8125rem;
          color: var(--accent-amber);
        }

        .score-hero-card {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 2.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 2.5rem;
          margin-bottom: 2.5rem;
          box-shadow: var(--shadow-card);
        }

        .score-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-right: 1px solid var(--border-subtle);
          padding-right: 2rem;
        }

        .score-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-tertiary);
          letter-spacing: 0.08em;
          margin-bottom: 0.25rem;
        }

        .score-display {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .score-number {
          font-size: 5rem;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--text-primary);
        }

        .score-total {
          font-size: 1.125rem;
          color: var(--text-tertiary);
        }

        .score-tier-badge {
          font-size: 0.875rem;
          padding: 0.375rem 0.875rem;
        }

        .archetype-column {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .archetype-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-flame);
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }

        .archetype-title {
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 1rem;
        }

        .roast-summary {
          font-size: 1.0625rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .subscores-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        .subscore-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .subscore-item strong {
          color: var(--text-primary);
        }

        /* Jokes Section */
        .jokes-section {
          margin-bottom: 2.5rem;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .section-header h3 {
          font-size: 1.25rem;
        }

        .section-note {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .jokes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .joke-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .joke-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .referenced-item-pill {
          background: var(--accent-flame-subtle);
          color: var(--accent-flame);
          border: 1px solid var(--accent-flame-border);
          font-size: 0.6875rem;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joke-text {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }

        .joke-evidence {
          background: var(--bg-surface-raised);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.8125rem;
        }

        .evidence-label {
          display: block;
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .evidence-text {
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Red Flags */
        .red-flags-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 2rem;
          margin-bottom: 2.5rem;
        }

        .flags-header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 1.25rem;
        }

        .flags-icon {
          color: var(--accent-amber);
        }

        .flags-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .flag-item {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }

        .flag-bullet {
          font-size: 0.75rem;
          color: var(--accent-amber);
          background: var(--accent-amber-subtle);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          margin-top: 0.15rem;
        }

        .flag-text {
          color: var(--text-secondary);
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        /* Verdict */
        .verdict-card {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          background: var(--bg-surface-raised);
          border: 1px solid var(--border-medium);
          border-radius: 14px;
          padding: 2rem;
        }

        .verdict-icon {
          color: var(--accent-flame);
          flex-shrink: 0;
        }

        .verdict-label {
          display: block;
          font-size: 0.75rem;
          color: var(--accent-flame);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.375rem;
        }

        .verdict-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .score-hero-card {
            grid-template-columns: 1fr;
            padding: 1.75rem;
          }
          .score-column {
            border-right: none;
            border-bottom: 1px solid var(--border-subtle);
            padding-right: 0;
            padding-bottom: 1.5rem;
          }
          .jokes-grid {
            grid-template-columns: 1fr;
          }
          .report-action-bar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </section>
  );
}
