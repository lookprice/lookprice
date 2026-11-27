import DOMPurify from "dompurify";

const FORBIDDEN_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "textarea",
  "base",
  "meta",
  "link"
];

const FORBIDDEN_ATTR = [
  "onerror",
  "onload",
  "onclick",
  "onmouseover",
  "onmouseout",
  "onmouseenter",
  "onmouseleave",
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onkeydown",
  "onkeyup",
  "onkeypress"
];

/**
 * Sanitizes general rich HTML (product descriptions, blog posts, CMS content).
 * Strips <script>, <style>, <iframe>, event handlers, and javascript: URIs.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(String(dirty), {
    FORBID_TAGS: [...FORBIDDEN_TAGS, "style"],
    FORBID_ATTR: FORBIDDEN_ATTR,
    ADD_ATTR: ["target", "rel", "class", "style"]
  });
}

/**
 * Sanitizes legal contract preview HTML while preserving embedded <style> blocks
 * used by contract templates, and strictly blocking scripts, iframes, and event handlers.
 */
export function sanitizeContractHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(String(dirty), {
    ADD_TAGS: ["style"],
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: FORBIDDEN_ATTR,
    ADD_ATTR: ["target", "rel", "class", "style"],
    FORCE_BODY: true
  });
}
