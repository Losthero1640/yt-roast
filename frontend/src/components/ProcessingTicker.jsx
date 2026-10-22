import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

const WITTY_STAGES = [
  'Streaming watch history into ephemeral RAM (0 disk writes)...',
  'Filtering deleted video placeholders and broken links...',
  'Auditing 3 AM rabbit holes and binge session clusters...',
  'Compiling top re-watched videos and creator loyalties...',
  'Calculating deterministic Brainrot Score...',
  'Google Gemini Flash drafting merciless punchlines...',
  'Validating evidence grounding to guarantee authentic roasts...',
  'Formatting your digital shame...'
];

export function ProcessingTicker({ uploadProgress = 0, isUploading = false }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < WITTY_STAGES.length - 1 ? prev + 1 : prev));
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="processing-container">
      <div className="processing-card">
        <div className="processing-header">
          <div className="flame-spinner">
            <Flame size={24} className="spinning-flame" />
          </div>
          <div className="processing-text">
            <h3>Dissecting Your History...</h3>
            <p className="stage-message mono">{WITTY_STAGES[stageIndex]}</p>
          </div>
        </div>

        {/* Real Upload Progress if streaming */}
        {isUploading && (
          <div className="upload-progress-wrapper">
            <div className="upload-info mono">
              <span>Streaming Takeout File</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.max(5, uploadProgress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Indeterminate Pulse Bar when AI is generating */}
        {!isUploading && (
          <div className="progress-track indeterminate">
            <div className="progress-fill-pulse" />
          </div>
        )}
      </div>

      <style>{`
        .processing-container {
          padding: 3rem 0;
          display: flex;
          justify-content: center;
        }

        .processing-card {
          width: 100%;
          max-width: 640px;
          background: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: 14px;
          padding: 2rem;
          box-shadow: var(--shadow-card);
        }

        .processing-header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .flame-spinner {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--accent-flame-subtle);
          border: 1px solid var(--accent-flame-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-flame);
        }

        .spinning-flame {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
            filter: drop-shadow(0 0 8px var(--accent-flame));
          }
        }

        .processing-text h3 {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .stage-message {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .upload-progress-wrapper {
          margin-top: 1rem;
        }

        .upload-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-bottom: 0.5rem;
        }

        .progress-track {
          width: 100%;
          height: 6px;
          background: var(--bg-subtle);
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent-flame);
          border-radius: 9999px;
          transition: width 200ms ease-out;
        }

        .progress-track.indeterminate {
          margin-top: 0.5rem;
        }

        .progress-fill-pulse {
          width: 40%;
          height: 100%;
          background: var(--accent-flame);
          border-radius: 9999px;
          position: absolute;
          animation: indeterminate-slide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes indeterminate-slide {
          0% {
            left: -40%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
