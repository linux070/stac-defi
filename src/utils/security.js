/**
 * Security utilities for the Stac DeFi application.
 * 
 * Provides safe object merging (prevents prototype pollution),
 * URL validation (prevents SSRF), and input sanitisation helpers.
 */

/**
 * Safely merges source properties into a target object without
 * allowing prototype pollution via __proto__, constructor, or prototype.
 *
 * @param {Object} target - The target object to merge into.
 * @param {Object} source - The source object to merge from.
 * @returns {Object} The merged target object.
 */
export const safeMerge = (target, source) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return target;
  }

  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  for (const key of Object.keys(source)) {
    // Block prototype pollution vectors
    if (DANGEROUS_KEYS.has(key)) continue;

    // Only own properties
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      // Recursive merge for nested objects
      target[key] = safeMerge({ ...targetVal }, sourceVal);
    } else {
      target[key] = sourceVal;
    }
  }

  return target;
};

/**
 * Validates that a URL belongs to an allowed domain list.
 * Prevents SSRF by blocking requests to arbitrary/internal hosts.
 *
 * @param {string} url - The URL to validate.
 * @param {string[]} allowedDomains - List of allowed domain suffixes.
 * @returns {boolean} True if the URL is safe to fetch.
 */
export const isAllowedUrl = (url, allowedDomains = []) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    // Only allow HTTPS (never allow file://, ftp://, etc.)
    if (parsed.protocol !== 'https:') return false;

    // Block private/internal IPs
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname === '[::1]'
    ) {
      return false;
    }

    // Check against allowed domain list
    if (allowedDomains.length > 0) {
      return allowedDomains.some(
        (domain) => hostname === domain || hostname.endsWith('.' + domain)
      );
    }

    // If no whitelist provided, allow all non-private HTTPS URLs
    return true;
  } catch {
    return false;
  }
};

/**
 * Allowed domains for RPC and API calls in the Stac application.
 */
export const ALLOWED_RPC_DOMAINS = [
  'rpc.testnet.arc.network',
  'publicnode.com',
  'base.org',
  'blockpi.network',
  'g.alchemy.com',
  'quiknode.pro',
  'drpc.org',
];

export const ALLOWED_API_DOMAINS = [
  'iris-api-sandbox.circle.com',
  'iris-api.circle.com',
  'corsproxy.io',
];

/**
 * Validates an RPC URL against the allowed domains.
 * @param {string} url
 * @returns {boolean}
 */
export const isAllowedRpcUrl = (url) => isAllowedUrl(url, ALLOWED_RPC_DOMAINS);

/**
 * Validates an API URL against the allowed domains.
 * @param {string} url
 * @returns {boolean}
 */
export const isAllowedApiUrl = (url) => isAllowedUrl(url, ALLOWED_API_DOMAINS);
