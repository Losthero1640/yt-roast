import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchHealth,
  fetchDemoRoast,
  fetchOAuthUrl,
  executeOAuthCallback,
  uploadTakeoutHistory
} from '../api.js';

describe('Frontend API Client (api.js)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchHealth', () => {
    it('resolves health payload when response is ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy', persistence: 'none' })
      });

      const data = await fetchHealth();
      expect(data.status).toBe('healthy');
      expect(data.persistence).toBe('none');
      expect(global.fetch).toHaveBeenCalledWith('/api/health');
    });

    it('throws error when backend service is down', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503
      });

      await expect(fetchHealth()).rejects.toThrow('Backend service is unavailable.');
    });
  });

  describe('fetchDemoRoast', () => {
    it('fetches and returns pre-computed demo roast', async () => {
      const mockDemo = {
        brainrotScore: 84,
        viewingArchetype: 'The 3 AM Productivity Goblin'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDemo
      });

      const data = await fetchDemoRoast();
      expect(data.brainrotScore).toBe(84);
      expect(data.viewingArchetype).toBe('The 3 AM Productivity Goblin');
      expect(global.fetch).toHaveBeenCalledWith('/api/roast/demo');
    });

    it('extracts server error message when request fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Demo fixture missing.' } })
      });

      await expect(fetchDemoRoast()).rejects.toThrow('Demo fixture missing.');
    });
  });

  describe('fetchOAuthUrl', () => {
    it('requests OAuth URL with generated state parameter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
          state: 'state_123'
        })
      });

      const res = await fetchOAuthUrl();
      expect(res.url).toContain('accounts.google.com');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/roast/oauth/url?state=state_'));
    });
  });

  describe('executeOAuthCallback', () => {
    it('exchanges code for roast report', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ roast: { brainrotScore: 72 }, mode: 'mode_1_quick_roast' })
      });

      const data = await executeOAuthCallback('auth_code_xyz');
      expect(data.roast.brainrotScore).toBe(72);
      expect(data.mode).toBe('mode_1_quick_roast');
      expect(global.fetch).toHaveBeenCalledWith('/api/roast/oauth/callback?code=auth_code_xyz');
    });
  });

  describe('uploadTakeoutHistory', () => {
    it('rejects immediately when no file is passed', async () => {
      await expect(uploadTakeoutHistory(null, { consent: true })).rejects.toThrow(
        'Please select a valid watch-history.json file.'
      );
    });

    it('rejects immediately when consent is false (API-05 pre-gate)', async () => {
      const mockFile = new File(['[]'], 'watch-history.json', { type: 'application/json' });
      await expect(uploadTakeoutHistory(mockFile, { consent: false })).rejects.toThrow(
        'You must check the consent box to authorize in-memory AI roast processing.'
      );
    });

    it('transmits file via XMLHttpRequest with progress events and x-consent headers', async () => {
      const mockFile = new File(['[{"title":"video"}]'], 'watch-history.json', { type: 'application/json' });

      let capturedInstance;
      function MockXHR() {
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.send = vi.fn();
        this.upload = {};
        this.status = 200;
        this.responseText = JSON.stringify({ roast: { brainrotScore: 90 } });
        capturedInstance = this;
      }
      global.XMLHttpRequest = MockXHR;

      const progressSpy = vi.fn();
      const uploadPromise = uploadTakeoutHistory(mockFile, {
        consent: true,
        onProgress: progressSpy
      });

      expect(capturedInstance.open).toHaveBeenCalledWith('POST', '/api/roast/upload?consent=true');
      expect(capturedInstance.setRequestHeader).toHaveBeenCalledWith('x-consent', 'true');

      // Trigger progress event
      capturedInstance.upload.onprogress({
        lengthComputable: true,
        loaded: 50,
        total: 100
      });
      expect(progressSpy).toHaveBeenCalledWith(50);

      // Trigger load event
      capturedInstance.onload();

      const result = await uploadPromise;
      expect(result.roast.brainrotScore).toBe(90);
    });

    it('rejects with server message when HTTP status is not 200', async () => {
      const mockFile = new File(['[]'], 'watch-history.json', { type: 'application/json' });

      let capturedInstance;
      function MockXHR() {
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.send = vi.fn();
        this.upload = {};
        this.status = 413;
        this.statusText = 'Payload Too Large';
        this.responseText = JSON.stringify({ error: { message: 'Upload exceeds 100MB limit.' } });
        capturedInstance = this;
      }
      global.XMLHttpRequest = MockXHR;

      const uploadPromise = uploadTakeoutHistory(mockFile, { consent: true });
      capturedInstance.onload();

      await expect(uploadPromise).rejects.toThrow('Upload exceeds 100MB limit.');
    });

    it('rejects on network error or abort', async () => {
      const mockFile = new File(['[]'], 'watch-history.json', { type: 'application/json' });

      let capturedInstance;
      function MockXHR() {
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.send = vi.fn();
        this.upload = {};
        capturedInstance = this;
      }
      global.XMLHttpRequest = MockXHR;

      const uploadPromise = uploadTakeoutHistory(mockFile, { consent: true });
      capturedInstance.onerror();

      await expect(uploadPromise).rejects.toThrow('Network error occurred while uploading. Please check connection.');
    });
  });
});
