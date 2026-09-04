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

  // Check if it's a custom domain purchased by the merchant (e.g. brand.com or shop.brand.com)
  // If the host does NOT end with besnesy.com or vercel.app or runasp.net, and is not localhost/IP:
  const isPlatformDomain = hostname.endsWith('besnesy.com') || 
                           hostname.endsWith('vercel.app') || 
                           hostname.endsWith('runasp.net') || 
                           hostname.endsWith('localhost');

  if (!isPlatformDomain) {
    // It's a custom domain! Strip leading 'www.' if present
    const cleanDomain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    return cleanDomain;
  }

  return null;
}
