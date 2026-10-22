/**
 * Frontend API client communicating with Fastify REST endpoints
 * Adheres strictly to Phase 3 privacy headers, sanitized error codes, and consent parameters.
 */
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

/**
 * Checks system health and verifies zero-persistence status
 */
export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error('Backend service is unavailable.');
  }
  return res.json();
}

/**
 * Fetches sample pre-loaded roast without uploading data
 */
export async function fetchDemoRoast() {
  const res = await fetch(`${API_BASE}/roast/demo`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to load demo roast.');
  }
  return res.json();
}

/**
 * Gets Google OAuth authorization URL for Mode 1 Quick Roast
 */
export async function fetchOAuthUrl() {
  const state = 'state_' + Math.random().toString(36).substring(2, 10);
  const res = await fetch(`${API_BASE}/roast/oauth/url?state=${encodeURIComponent(state)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to initialize Google sign-in.');
  }
  return res.json();
}

/**
 * Exchanges OAuth authorization code for ephemeral Mode 1 Quick Roast
 */
export async function executeOAuthCallback(code) {
  const res = await fetch(`${API_BASE}/roast/oauth/callback?code=${encodeURIComponent(code)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Google OAuth quick roast failed.');
  }
  return res.json();
}

/**
 * Streams unzipped Takeout watch-history.json to Fastify backend (Mode 2)
 *
 * @param {File} file
 * @param {Object} options
 * @param {boolean} options.consent - User consent confirmation
 * @param {Function} [options.onProgress] - (progressPercent: number) => void
 * @returns {Promise<any>}
 */
export function uploadTakeoutHistory(file, { consent = false, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Please select a valid watch-history.json file.'));
    }

    if (!consent) {
      return reject(
        new Error('You must check the consent box to authorize in-memory AI roast processing.')
      );
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/roast/upload?consent=true`);
    xhr.setRequestHeader('x-consent', 'true');

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const responseJson = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseJson);
        } else {
          const message =
            responseJson.error?.message ||
            `Server returned HTTP ${xhr.status}: ${xhr.statusText || 'Upload failed'}`;
          reject(new Error(message));
        }
      } catch {
        reject(new Error(`Server error (${xhr.status}). Please check file format.`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred while uploading. Please check connection.'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload was cancelled.'));
    };

    xhr.send(formData);
  });
}
