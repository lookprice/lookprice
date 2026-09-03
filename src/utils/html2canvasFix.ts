/**
 * Utility to convert modern CSS color functions like oklch(...) or oklab(...) into standard rgb()/rgba() format.
 * html2canvas does not natively parse oklch() or oklab(), causing export errors when Tailwind CSS v4 or modern color functions are present.
 */

import html2canvas, { Options } from 'html2canvas';

let canvas2dCtx: CanvasRenderingContext2D | null = null;

function get2dContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!canvas2dCtx) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      canvas2dCtx = canvas.getContext('2d', { willReadFrequently: true });
    } catch (e) {
      canvas2dCtx = null;
    }
  }
  return canvas2dCtx;
}

/**
 * Mathematical OKLCH -> RGB/RGBA converter.
 */
export function oklchToRgb(oklchStr: string): string {
  if (!oklchStr) return oklchStr;
  
  const regex = /oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([-\d.]+)(?:deg)?(?:\s*\/\s*([\d.%]+))?\s*\)/i;
  const match = oklchStr.match(regex);
  if (!match) return 'rgb(30, 41, 59)'; // Safe slate-800 default
  
  let L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
  let C = match[2].endsWith('%') ? (parseFloat(match[2]) / 100) * 0.4 : parseFloat(match[2]);
  let H = parseFloat(match[3]);
  let A = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

  if (isNaN(L)) L = 0.5;
  if (isNaN(C)) C = 0;
  if (isNaN(H)) H = 0;

  const hRad = (H * Math.PI) / 180;
  const oklabA = C * Math.cos(hRad);
  const oklabB = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * oklabA + 0.2158037573 * oklabB;
  const m_ = L - 0.1055613458 * oklabA - 0.0638541728 * oklabB;
  const s_ = L - 0.0894841775 * oklabA - 0.1291980554 * oklabB;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLinVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgb = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    const v = x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
    return Math.round(Math.min(255, Math.max(0, v * 255)));
  };

  const r = toSrgb(rLin);
  const g = toSrgb(gLin);
  const b = toSrgb(bLinVal);

  if (A < 1) {
    return `rgba(${r}, ${g}, ${b}, ${A.toFixed(3)})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Mathematical OKLAB -> RGB/RGBA converter.
 */
export function oklabToRgb(oklabStr: string): string {
  if (!oklabStr) return oklabStr;

  const regex = /oklab\(\s*([\d.%]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i;
  const match = oklabStr.match(regex);
  if (!match) return 'rgb(51, 65, 85)'; // Safe default slate-700

  let L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
  let a = parseFloat(match[2]);
  let b = parseFloat(match[3]);
  let A = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

  if (isNaN(L)) L = 0.5;
  if (isNaN(a)) a = 0;
  if (isNaN(b)) b = 0;

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 0.1291980554 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLinVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgb = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    const v = x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
    return Math.round(Math.min(255, Math.max(0, v * 255)));
  };

  const r = toSrgb(rLin);
  const g = toSrgb(gLin);
  const bVal = toSrgb(bLinVal);

  if (A < 1) {
    return `rgba(${r}, ${g}, ${bVal}, ${A.toFixed(3)})`;
  }
  return `rgb(${r}, ${g}, ${bVal})`;
}

/**
 * Converts a single color string token (e.g. "oklch(...)" or "oklab(...)") to sRGB.
 */
export function convertSingleColorToRgb(singleColorStr: string): string {
  if (!singleColorStr) return singleColorStr;
  const trimmed = singleColorStr.trim();

  // 1. Try browser canvas context first (native browser Color 4 engine)
  const ctx = get2dContext();
  if (ctx) {
    try {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillStyle = trimmed;
      const normalized = ctx.fillStyle;
      if (normalized && !normalized.includes('oklch') && !normalized.includes('oklab') && !normalized.includes('color(')) {
        return normalized;
      }
    } catch (e) {}
  }

  // 2. Math fallback
  if (trimmed.startsWith('oklab(')) {
    return oklabToRgb(trimmed);
  }
  if (trimmed.startsWith('oklch(')) {
    return oklchToRgb(trimmed);
  }
  return trimmed;
}

/**
 * Replaces all modern color tokens in any CSS string with standard sRGB.
 */
export function parseAndConvertColorToRgb(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  
  if (!colorStr.includes('oklch') && !colorStr.includes('oklab') && !colorStr.includes('color(')) {
    return colorStr;
  }

  let result = colorStr;
  result = result.replace(/oklab\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi, (m) => convertSingleColorToRgb(m));
  result = result.replace(/oklch\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi, (m) => convertSingleColorToRgb(m));
  result = result.replace(/color\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi, (m) => convertSingleColorToRgb(m));

  return result;
}

/**
 * Sanitizes a string containing CSS rules by replacing oklch/oklab occurrences with converted RGB/HEX
 */
export function sanitizeCssString(cssText: string): string {
  if (!cssText || (!cssText.includes('oklch') && !cssText.includes('oklab') && !cssText.includes('color('))) {
    return cssText;
  }
  return parseAndConvertColorToRgb(cssText);
}

/**
 * Sanitizes a cloned Document before html2canvas parses its colors and styles.
 * Preserves Tailwind CSS rules while stripping all oklch/oklab color calls and locking computed styles.
 */
export function sanitizeClonedDocForHtml2Canvas(
  clonedDoc: Document, 
  clonedTargetElement?: HTMLElement, 
  originalTargetElement?: HTMLElement
) {
  if (!clonedDoc) return;

  // 1. Lock exact canonical dimensions on the cloned poster container
  if (clonedTargetElement) {
    try {
      let isStory = true;
      if (originalTargetElement) {
        const origHeight = originalTargetElement.style.height || '';
        const origRect = originalTargetElement.getBoundingClientRect();
        if (origHeight.includes('340') || (origRect.height > 0 && origRect.width > 0 && Math.abs(origRect.height - origRect.width) < 50)) {
          isStory = false;
        }
      }

      const canonicalWidth = 340;
      const canonicalHeight = isStory ? 604 : 340;

      clonedTargetElement.style.width = `${canonicalWidth}px`;
      clonedTargetElement.style.height = `${canonicalHeight}px`;
      clonedTargetElement.style.minWidth = `${canonicalWidth}px`;
      clonedTargetElement.style.minHeight = `${canonicalHeight}px`;
      clonedTargetElement.style.maxWidth = `${canonicalWidth}px`;
      clonedTargetElement.style.maxHeight = `${canonicalHeight}px`;
      clonedTargetElement.style.boxSizing = 'border-box';
      clonedTargetElement.style.transform = 'none';
      clonedTargetElement.style.margin = '0 auto';

      // Ensure no parent container forces squishing
      let parent = clonedTargetElement.parentElement;
      while (parent && parent !== clonedDoc.body) {
        parent.style.width = 'auto';
        parent.style.maxWidth = 'none';
        parent.style.overflow = 'visible';
        parent = parent.parentElement;
      }
    } catch (e) {}
  }

  // 2. Prevent line clipping and text cutoff on all text elements
  try {
    const textNodes = Array.from(clonedDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div')) as HTMLElement[];
    textNodes.forEach((node) => {
      if (node.classList.contains('line-clamp-1') || node.classList.contains('line-clamp-2') || node.classList.contains('line-clamp-3')) {
        node.classList.remove('line-clamp-1', 'line-clamp-2', 'line-clamp-3');
      }
      if (node.style.webkitLineClamp) {
        node.style.webkitLineClamp = 'unset';
      }
      if (node.tagName.startsWith('H') || node.tagName === 'P') {
        node.style.overflow = 'visible';
        node.style.maxHeight = 'none';
      }
    });
  } catch (e) {}

  // 3. Sanitize all existing <style> tags in clonedDoc
  const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = sanitizeCssString(styleTag.textContent);
    }
  });

  // 4. Gather live stylesheet rules, sanitize them, and inject into clonedDoc
  try {
    let globalCssText = '';
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            globalCssText += rule.cssText + '\n';
          }
        }
      } catch (e) {}
    }

    if (globalCssText) {
      const sanitizedGlobalCss = sanitizeCssString(globalCssText);
      const injectedStyle = clonedDoc.createElement('style');
      injectedStyle.setAttribute('id', 'html2canvas-sanitized-tailwind');
      injectedStyle.textContent = sanitizedGlobalCss;
      clonedDoc.head.appendChild(injectedStyle);

      const linkTags = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
      linkTags.forEach((link) => link.remove());
    }
  } catch (e) {}

  // 5. Scan all cloned elements for any remaining inline style attributes with oklch/oklab
  const allClonedElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
  allClonedElements.forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color('))) {
      el.setAttribute('style', sanitizeCssString(styleAttr));
    }
  });
}

/**
 * Bulletproof html2canvas wrapper:
 * 1. Monkey-patches getComputedStyle so modern colors are safely converted to rgb/rgba
 * 2. Injects sanitization into onclone
 * 3. Restores original getComputedStyle after capture
 */
export async function safeHtml2Canvas(
  element: HTMLElement,
  options: Partial<Options> = {}
): Promise<HTMLCanvasElement> {
  const originalGetComputedStyle = window.getComputedStyle;

  const createStyleProxy = (origComputed: CSSStyleDeclaration) => {
    return new Proxy(origComputed, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return (propertyName: string) => {
            const val = target.getPropertyValue(propertyName);
            return parseAndConvertColorToRgb(val);
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('color('))) {
          return parseAndConvertColorToRgb(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  };

  try {
    // Intercept host window getComputedStyle
    window.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
      const computed = originalGetComputedStyle.call(window, el, pseudoElt);
      return createStyleProxy(computed);
    };

    const userOnClone = options.onclone;

    const mergedOptions: Partial<Options> = {
      ...options,
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        // Intercept cloned iframe defaultView getComputedStyle
        if (clonedDoc.defaultView && clonedDoc.defaultView.getComputedStyle) {
          const iframeOrigGetComputed = clonedDoc.defaultView.getComputedStyle;
          clonedDoc.defaultView.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
            const computed = iframeOrigGetComputed.call(clonedDoc.defaultView, el, pseudoElt);
            return createStyleProxy(computed);
          };
        }

        sanitizeClonedDocForHtml2Canvas(clonedDoc, clonedElement, element);

        if (userOnClone) {
          userOnClone(clonedDoc, clonedElement);
        }
      }
    };

    return await html2canvas(element, mergedOptions);
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
}
