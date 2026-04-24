import { Buffer } from 'buffer';

// Essential for Circle SDK and CCTP cryptographic operations
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Core-js polyfills for older browsers
import 'core-js/es/array/includes';
import 'core-js/es/array/flat';
import 'core-js/es/array/flat-map';
import 'core-js/es/object/assign';
import 'core-js/es/object/entries';
import 'core-js/es/object/from-entries';
import 'core-js/es/object/values';
import 'core-js/es/promise';
import 'core-js/es/set';
import 'core-js/es/string/includes';
import 'core-js/es/string/starts-with';
import 'core-js/es/string/ends-with';
import 'core-js/es/symbol';
import 'core-js/es/symbol/async-iterator';

// WebCrypto check
if (typeof window !== 'undefined' && !window.crypto) {
  if (import.meta.env?.DEV) {
    console.warn('[Security] window.crypto is not available.');
  }
}

// TextEncoder/TextDecoder polyfill
if (typeof window !== 'undefined' && !window.TextEncoder) {
  window.TextEncoder = class TextEncoder {
    encode(string) {
      return new Uint8Array(string.split('').map(char => char.charCodeAt(0)));
    }
  };
}

if (typeof window !== 'undefined' && !window.TextDecoder) {
  window.TextDecoder = class TextDecoder {
    decode(buffer) {
      return Array.from(buffer).map(byte => String.fromCharCode(byte)).join('');
    }
  };
}

// BigInt polyfill for older browsers
if (typeof BigInt === 'undefined') {
  window.BigInt = function BigInt(value) {
    return Number(value);
  };
}

// AbortController polyfill
if (typeof window !== 'undefined' && !window.AbortController) {
  window.AbortController = class AbortController {
    constructor() {
      this.signal = new EventTarget();
      this.signal.aborted = false;
    }
    abort() {
      this.signal.aborted = true;
      this.signal.dispatchEvent(new Event('abort'));
    }
  };
}

// Circle SDK CORS Workaround (X-User-Agent fix)
// The Circle App Kit SDK (v1.3.0) adds an 'X-User-Agent' header which is currently 
// blocked by Circle's API CORS policy, causing swap requests to fail.
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;

    try {
      // 1. Handle Request object as first argument
      if (resource instanceof Request) {
        if (resource.headers.has('x-user-agent')) {
          const headers = new Headers(resource.headers);
          headers.delete('x-user-agent');
          resource = new Request(resource, { headers });
        }
      }

      // 2. Handle headers in config object
      if (config && config.headers) {
        if (config.headers instanceof Headers) {
          if (config.headers.has('x-user-agent')) {
            config.headers.delete('x-user-agent');
          }
        } else if (typeof config.headers === 'object' && !Array.isArray(config.headers)) {
          const uaKey = Object.keys(config.headers).find(k => k.toLowerCase() === 'x-user-agent');
          if (uaKey) {
            config.headers = { ...config.headers };
            delete config.headers[uaKey];
          }
        }
      }
    } catch (err) {
      // Silent fallback to avoid breaking requests if logic fails
    }

    return originalFetch(resource, config);
  };
}

export {};