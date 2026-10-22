import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Header } from '../components/Header.jsx';
import { Hero } from '../components/Hero.jsx';
import { ModeSelector } from '../components/ModeSelector.jsx';
import { ProcessingTicker } from '../components/ProcessingTicker.jsx';
import { RoastReport } from '../components/RoastReport.jsx';
import { ShareCard } from '../components/ShareCard.jsx';
import { PrivacyModal } from '../components/PrivacyModal.jsx';
import { Footer } from '../components/Footer.jsx';

describe('Frontend Component Tests', () => {
  describe('Header Component', () => {
    it('renders branding and triggers privacy modal & demo roast', () => {
      const openPrivacySpy = vi.fn();
      const loadDemoSpy = vi.fn();

      render(
        <Header
          onOpenPrivacy={openPrivacySpy}
          onLoadDemo={loadDemoSpy}
          isProcessing={false}
        />
      );

      expect(screen.getByText('YT ROAST')).toBeInTheDocument();
      expect(screen.getByText(/0 PERSISTENCE/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /0 PERSISTENCE/i }));
      expect(openPrivacySpy).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Sample Roast/i }));
      expect(loadDemoSpy).toHaveBeenCalledTimes(1);
    });

    it('disables demo button when isProcessing is true', () => {
      render(
        <Header
          onOpenPrivacy={vi.fn()}
          onLoadDemo={vi.fn()}
          isProcessing={true}
        />
      );

      const demoBtn = screen.getByRole('button', { name: /Sample Roast/i });
      expect(demoBtn).toBeDisabled();
    });
  });

  describe('Hero Component', () => {
    it('renders hero title and privacy architecture guarantees', () => {
      render(<Hero />);

      expect(screen.getByText(/ruthlessly roasted/i)).toBeInTheDocument();
      expect(screen.getByText(/0 Database Storage/i)).toBeInTheDocument();
      expect(screen.getByText(/Pure RAM Streaming/i)).toBeInTheDocument();
      expect(screen.getByText(/Grounded Punchlines Only/i)).toBeInTheDocument();
    });
  });

  describe('ModeSelector Component', () => {
    it('switches between Mode 2 (Takeout) and Mode 1 (OAuth) tabs', () => {
      const setActiveModeSpy = vi.fn();

      const { rerender } = render(
        <ModeSelector
          activeMode="takeout"
          setActiveMode={setActiveModeSpy}
          onStartOAuth={vi.fn()}
          onFileSelect={vi.fn()}
          selectedFile={null}
          consentGiven={false}
          setConsentGiven={vi.fn()}
          onSubmitTakeout={vi.fn()}
          isProcessing={false}
        />
      );

      expect(screen.getByText(/Full History Roast \(Takeout\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Quick Roast \(Google OAuth\)/i)).toBeInTheDocument();

      // Click OAuth tab
      fireEvent.click(screen.getByRole('button', { name: /Quick Roast \(Google OAuth\)/i }));
      expect(setActiveModeSpy).toHaveBeenCalledWith('oauth');

      // Re-render with OAuth mode active
      rerender(
        <ModeSelector
          activeMode="oauth"
          setActiveMode={setActiveModeSpy}
          onStartOAuth={vi.fn()}
          onFileSelect={vi.fn()}
          selectedFile={null}
          consentGiven={false}
          setConsentGiven={vi.fn()}
          onSubmitTakeout={vi.fn()}
          isProcessing={false}
        />
      );

      expect(screen.getByText(/Quick Roast via Google Sign-In/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign in with Google to Roast My Taste/i)).toBeInTheDocument();
    });

    it('toggles consent checkbox and handles file selection in Mode 2', () => {
      const setConsentGivenSpy = vi.fn();
      const onFileSelectSpy = vi.fn();
      const onSubmitTakeoutSpy = vi.fn();

      render(
        <ModeSelector
          activeMode="takeout"
          setActiveMode={vi.fn()}
          onStartOAuth={vi.fn()}
          onFileSelect={onFileSelectSpy}
          selectedFile={new File(['[]'], 'watch-history.json', { type: 'application/json' })}
          consentGiven={true}
          setConsentGiven={setConsentGivenSpy}
          onSubmitTakeout={onSubmitTakeoutSpy}
          isProcessing={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(setConsentGivenSpy).toHaveBeenCalled();

      const submitBtn = screen.getByRole('button', { name: /Generate Full Takeout Roast/i });
      fireEvent.click(submitBtn);
      expect(onSubmitTakeoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProcessingTicker Component', () => {
    it('renders stage ticker and upload progress when isUploading is true', () => {
      render(<ProcessingTicker uploadProgress={65} isUploading={true} />);

      expect(screen.getByText(/Dissecting Your History.../i)).toBeInTheDocument();
      expect(screen.getByText(/Streaming Takeout File/i)).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('renders indeterminate pulse when isUploading is false', () => {
      const { container } = render(<ProcessingTicker uploadProgress={100} isUploading={false} />);

      expect(container.querySelector('.indeterminate')).toBeInTheDocument();
    });
  });

  describe('RoastReport Component', () => {
    const mockReportData = {
      brainrotScore: 84,
      viewingArchetype: 'The 3 AM Productivity Goblin',
      roastSummary: 'A terminal dopamine hostage suffering from aspirational insomnia.',
      roasts: [
        {
          style: 'combination',
          joke: 'Cold plunge paired with 6-hour lo-fi study loop.',
          supportingEvidence: 'Observed 12 cold plunge lectures at 3 AM.',
          referencedItem: 'Andrew Huberman'
        },
        {
          style: 'specific',
          joke: 'Watched 5 AM routines at 3:45 AM.',
          supportingEvidence: 'Played 8 times.',
          referencedItem: '5 AM Morning Routine'
        }
      ],
      redFlags: ['Watched morning tutorials at 2 AM', 'Excessive lo-fi loops'],
      finalVerdict: 'Stop optimizing your morning routine until you actually experience morning.',
      cardPayload: {
        brainrotScore: 84,
        tier: 'Deep Fried',
        headline: 'The 3 AM Productivity Goblin',
        topCrime: 'Watching 5 AM morning routines at 3:45 AM'
      }
    };

    it('renders Brainrot score, tier badge, archetype, jokes, and red flags', () => {
      const onResetSpy = vi.fn();

      render(<RoastReport data={mockReportData} onReset={onResetSpy} />);

      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText('Deep Fried')).toBeInTheDocument();
      expect(screen.getByText('The 3 AM Productivity Goblin')).toBeInTheDocument();
      expect(screen.getByText(/Cold plunge paired with 6-hour lo-fi/i)).toBeInTheDocument();
      expect(screen.getByText(/Watched morning tutorials at 2 AM/i)).toBeInTheDocument();
      expect(screen.getByText(/Stop optimizing your morning routine/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Roast Another Account/i }));
      expect(onResetSpy).toHaveBeenCalledTimes(1);
    });

    it('opens ShareCard modal when Share Social Card button is clicked', () => {
      render(<RoastReport data={mockReportData} onReset={vi.fn()} />);

      expect(screen.queryByText(/Shareable Roast Card/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Share Social Card/i }));
      expect(screen.getByText(/Shareable Roast Card/i)).toBeInTheDocument();
    });
  });

  describe('ShareCard Component', () => {
    it('renders certificate card and handles copy to clipboard', async () => {
      const onCloseSpy = vi.fn();
      const mockCardPayload = {
        brainrotScore: 84,
        tier: 'Deep Fried',
        headline: 'The 3 AM Productivity Goblin',
        topCrime: 'Watching 5 AM morning routines at 3:45 AM'
      };

      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue()
        }
      });

      render(
        <ShareCard
          cardPayload={mockCardPayload}
          archetype="The 3 AM Productivity Goblin"
          verdict="Stop optimizing."
          onClose={onCloseSpy}
        />
      );

      expect(screen.getByText(/YT ROAST \/\/ CERTIFICATE/i)).toBeInTheDocument();
      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText('Deep Fried')).toBeInTheDocument();

      const copyBtn = screen.getByRole('button', { name: /Copy Shareable Text/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();

      // Test escape key listener
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('PrivacyModal Component', () => {
    it('renders all 4 zero-persistence privacy pillars and closes on demand', () => {
      const onCloseSpy = vi.fn();

      render(<PrivacyModal isOpen={true} onClose={onCloseSpy} />);

      expect(screen.getByText(/Zero-Persistence Privacy Blueprint/i)).toBeInTheDocument();
      expect(screen.getByText(/1. Volatile RAM Streaming/i)).toBeInTheDocument();
      expect(screen.getByText(/2. No Database or Logs/i)).toBeInTheDocument();
      expect(screen.getByText(/3. Sanitized Gemini Prompts/i)).toBeInTheDocument();
      expect(screen.getByText(/4. Ephemeral OAuth Tokens/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Understood & Close/i }));
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(<PrivacyModal isOpen={false} onClose={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Footer Component', () => {
    it('renders disclaimer and triggers privacy blueprint modal', () => {
      const onOpenPrivacySpy = vi.fn();

      render(<Footer onOpenPrivacy={onOpenPrivacySpy} />);

      expect(screen.getByText(/ZERO PERSISTENCE CERTIFIED/i)).toBeInTheDocument();
      expect(screen.getByText(/YouTube™ is a trademark of Google LLC/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Privacy Blueprint/i }));
      expect(onOpenPrivacySpy).toHaveBeenCalledTimes(1);
    });
  });
});
