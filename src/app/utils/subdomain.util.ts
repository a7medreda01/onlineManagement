/**
 * Utility to detect merchant store subdomains from hostname
 * e.g.:
 * - 'seven.besnesy.com' -> 'seven'
 * - 'seven.localhost'   -> 'seven'
 * - 'besnesy.com'       -> null
 * - 'www.besnesy.com'   -> null
 */
export function getSubdomain(): string | null {
  if (typeof window === 'undefined' || !window.location || !window.location.hostname) {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();

  // Ignore raw IPs or single word domains (like localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d+\.){3}\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split('.');

  // e.g. seven.besnesy.com -> parts: ['seven', 'besnesy', 'com']
  if (parts.length >= 3) {
    const sub = parts[0];
    const reserved = ['www', 'api', 'admin', 'superadmin', 'app', 'mail', 'besnesy', 'runasp'];
    if (!reserved.includes(sub)) {
      return sub;
    }
  }

  // e.g. seven.localhost -> parts: ['seven', 'localhost']
  if (parts.length === 2 && parts[1] === 'localhost') {
    const sub = parts[0];
    if (sub !== 'www') {
      return sub;
    }
  }

  return null;
}
