// Polyfills for better browser compatibility with RainbowKit and Wagmi

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

// WebCrypto polyfill for older browsers
if (typeof window !== 'undefined' && !window.crypto) {
  window.crypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  };
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

export {};