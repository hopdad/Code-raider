import { useState, useEffect } from 'react';

// Module-level cache so all components share a single fetch
let cached  = undefined;
let pending = null;

function fetchUser() {
  if (!pending) {
    pending = fetch('/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }
  return pending;
}

export function useAuth() {
  const [user, setUser] = useState(cached);

  useEffect(() => {
    if (cached !== undefined) return;
    fetchUser().then(u => { cached = u; setUser(u); });
  }, []);

  return user; // undefined = loading, null = not authed, object = authed
}

// Call this after logout to bust the cache
export function clearAuthCache() {
  cached  = undefined;
  pending = null;
}
