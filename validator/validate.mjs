// AREC (Agent Recording) 1.3 reference reader and validator.
// SPDX-License-Identifier: MIT. Copyright (c) 2026 Clipy.
//
// Zero dependencies and no build step: run it with any Node 18+ without
// installing anything.
//
// Reading is lenient by design: `readArec` and the default `validateArec`
// never refuse text, and report what they could not use as warnings. The
// optional 'conform' mode is a stricter check a producer can run on what it
// writes; nothing a reader does depends on it.
//
// The JSON Schema beside this file describes the machine-readable parts of a
// document; its patterns are generated from the constants below. Rules that
// need the Markdown itself (the identity comment comes first, missing capture
// is stated) are checked here.
//
// Usage:
//   import { readArec, validateArec } from './validate.mjs';
//   const { document, warnings } = readArec(text);
//   const check = validateArec(text, { mode: 'conform' }); // optional producer check

export const SPEC_VERSION = '1.3';

// Versioning (specification section 7, "Backward compatibility guarantee").
// A 1.x document is checked against every rule here. Every earlier published
// version is a LEGACY document: any 0.x value, with or without a pre-release
// suffix (0.1, 0.2-draft, 0.3, 0.3-draft), and a document written before
// identity comments existed. A legacy document is always accepted: even the
// strict check reports what it misses as warnings. A newer major version (2.x
// and up) is read on a best-effort basis; only the strict check flags it as an
// error, because a 1.x checker cannot know its rules.
//
// MAJOR and MINOR are non-negative integers written without leading zeros, so
// `1.03` is not a version (no producer has ever written one). A pre-release
// suffix never changes which minor a version is: `1.3-rc.1` is 1.3.
const NUMBER = '(?:0|[1-9][0-9]*)';
// End of input. `$` also matches before a final newline in some regular
// expression engines (Python's `re`), so every exported pattern ends with this
// instead, which every engine reads as the very end of the string.
const END = '(?![\\s\\S])';
const SUFFIX = '(?:-[0-9A-Za-z.-]+)?';
export const CURRENT_VERSION_PATTERN = `^1\\.${NUMBER}${SUFFIX}${END}`;
export const LEGACY_VERSION_PATTERN = `^0\\.${NUMBER}${SUFFIX}${END}`;

/** True for every version this validator reads: 1.x, and every legacy 0.x. */
export function isCompatibleVersion(version) {
  return new RegExp(CURRENT_VERSION_PATTERN).test(version || '') || new RegExp(LEGACY_VERSION_PATTERN).test(version || '');
}

// A version read without a version warning: any 1.x minor (newer minors are
// forward compatible by design) and every legacy version.
function isKnownVersion(version) {
  return new RegExp(`^1\\.${NUMBER}$`).test(version) || new RegExp(LEGACY_VERSION_PATTERN).test(version);
}

// A 1.x minor newer than this validator may add profiles and pointer sources,
// so values this validator does not know are reported as warnings there. The
// minor is compared as a number (4 and up), whatever suffix follows it.
export const NEWER_MINOR_PATTERN = `^1\\.(?:[4-9]|[1-9][0-9]+)${SUFFIX}${END}`;
function isNewerMinor(version) {
  return new RegExp(NEWER_MINOR_PATTERN).test(version || '');
}

/** `spec_version` is MAJOR.MINOR, optionally with a pre-release suffix (0.3-draft). */
export const SPEC_VERSION_PATTERN = `^${NUMBER}\\.${NUMBER}${SUFFIX}${END}`;

export const PROFILES = ['clipy-recording', 'imported-context'];

export const POINTER_SOURCES = [
  'click',
  'fused',
  'hover',
  'draw',
  'flare',
  'motion',
  'narration',
  'deixis',
];

// Headers, bodies, cookies, credentials and raw query values must never appear
// in diagnostics. Checked by key name, at any depth, because the whole point is
// that the producer redacts before writing, so a present key is a leak
// regardless of its value. Names are compared ignoring case, `-`, `_` and
// whitespace (space, tab, CR, LF), so `Set-Cookie`, `set_cookie`, `setCookie`
// and `SETCOOKIE` are the same key. The list holds each name in that compared
// form (specification section 5). It is the minimum a checker enforces; a
// producer redacts every other credential too.
export const FORBIDDEN_DIAGNOSTIC_KEYS = [
  'headers',
  'header',
  'body',
  'requestbody',
  'responsebody',
  'requestheaders',
  'responseheaders',
  'postdata',
  'cookie',
  'cookies',
  'setcookie',
  'authorization',
  'proxyauthorization',
  'bearer',
  'bearertoken',
  'token',
  'authtoken',
  'xauthtoken',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'csrftoken',
  'xsrftoken',
  'xcsrftoken',
  'xxsrftoken',
  'apikey',
  'xapikey',
  'clientsecret',
  'privatekey',
  'password',
  'passwd',
  'pwd',
  'passphrase',
  'secret',
  'credential',
  'credentials',
  'jwt',
  'jsessionid',
  'phpsessid',
  'queryparams',
  'rawquery',
];

// Query parameters that would make a consumer ask a server to extract a frame
// on demand. Matched case-insensitively.
export const DYNAMIC_EXTRACTION_PARAMS = ['t', 'at', 'time', 'seek', 'ts', 'timestamp', 'frame_at'];

/**
 * The same rules as JSON Schema patterns, which have no case-insensitive flag,
 * so each letter becomes a two-case class. The published schema embeds these
 * strings; the conformance suite fails if the two ever differ.
 */
export function caseInsensitivePattern(word) {
  return [...word]
    .map((ch) => (/[a-z]/i.test(ch) ? `[${ch.toLowerCase()}${ch.toUpperCase()}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('');
}
export const DYNAMIC_EXTRACTION_PATTERN = `[?&](?:${DYNAMIC_EXTRACTION_PARAMS.map(caseInsensitivePattern).join('|')})=`;
// Each letter of a name may be separated from the next, and the name may be
// preceded and followed, by `-`, `_` or whitespace (`_token`, `__secret__`).
// Whitespace is spelled out as space, tab, CR and LF rather than `\s`, whose
// meaning differs between regular expression engines.
export const FORBIDDEN_DIAGNOSTIC_KEY_PATTERN = `^[-_ \\t\\r\\n]*(?:${FORBIDDEN_DIAGNOSTIC_KEYS.map((key) =>
  [...key].map(caseInsensitivePattern).join('[-_ \\t\\r\\n]*'),
).join('|')})[-_ \\t\\r\\n]*${END}`;

// A string that begins with a URL carrying a parameter value in its query or
// fragment (`?id=42`, `&token=abc`, `#access_token=abc`), which diagnostics
// must never hold (section 5). Producers keep the key names and drop the values
// (`?format&id`); an empty value (`?id=`) is not a value. After optional
// leading whitespace, the URL starts with a scheme and `://`, or with `/`, and
// ends at the first whitespace (space, tab, CR or LF). Written with explicit
// character sets only, so every regular expression engine reads it alike.
export const RAW_QUERY_VALUE_PATTERN =
  '^[ \\t\\r\\n]*(?:[A-Za-z][A-Za-z0-9+.-]*://|/)[^ \\t\\r\\n?#]*[?#](?:[^ \\t\\r\\n]*[&#?])?[^ \\t\\r\\n=&#?]*=[^ \\t\\r\\n&#?]';

// An absolute https URL with no whitespace: the rule for `watch_url`, and the
// hosted form of an evidence reference. An empty value means absent.
export const HTTPS_URL_PATTERN = `^https://\\S+${END}`;
export const WATCH_URL_PATTERN = `^(?:https://\\S+)?${END}`;

// The specification requires evidence references to point at PRECOMPUTED
// artifacts. It does not require them to be absolute: a portable bundle
// legitimately ships `./moments/foo.jpg` beside the document. A reference is an
// absolute https URL, or a path inside the bundle: no scheme (so no
// `javascript:`, `data:`, `file:`, `ftp:` or `http:`), not starting with `/`,
// no `..` segment, and no whitespace. What it also forbids is a reference that
// makes the consumer ask a server to extract a frame on demand
// (DYNAMIC_EXTRACTION_PATTERN).
export const ARTIFACT_REF_PATTERN =
  `^(?:https://\\S+|(?![A-Za-z][A-Za-z0-9+.-]*:)(?!/)(?!(?:[^/]*/)*\\.\\.(?:/|${END}))\\S+)${END}`;

// Built from the same pattern strings the schema carries, so the two cannot disagree.
const HTTPS_URL_RE = new RegExp(HTTPS_URL_PATTERN);
const ARTIFACT_REF_RE = new RegExp(ARTIFACT_REF_PATTERN);
const DYNAMIC_EXTRACTION_RE = new RegExp(DYNAMIC_EXTRACTION_PATTERN);
const FORBIDDEN_DIAGNOSTIC_KEY_RE = new RegExp(FORBIDDEN_DIAGNOSTIC_KEY_PATTERN);
const RAW_QUERY_VALUE_RE = new RegExp(RAW_QUERY_VALUE_PATTERN);

function isHttpsUrl(value) {
  return typeof value === 'string' && HTTPS_URL_RE.test(value);
}

function isPrecomputedArtifactRef(value) {
  return typeof value === 'string' && ARTIFACT_REF_RE.test(value) && !DYNAMIC_EXTRACTION_RE.test(value);
}

function isUnitInterval(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function withoutNulls(value) {
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null));
}

// Windows tools save CRLF, and old Mac tools CR. Every rule below is written
// for LF, so text is normalised once, on the way in.
function normaliseNewlines(text) {
  return text.replace(/\r\n?/g, '\n');
}

const IDENTITY_RE = /^﻿?\s*<!--\s*arec\s*\n([\s\S]*?)-->/;

/** @returns {Record<string, string> | null} */
function parseIdentity(text) {
  const match = text.match(IDENTITY_RE);
  if (!match) return null;
  /** @type {Record<string, string>} */
  const header = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const sep = trimmed.indexOf(':');
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim();
    if (key) header[key] = value;
  }
  return header;
}

// --- Markdown structure ------------------------------------------------------
//
// One pass over the lines, written as plain string handling rather than
// regular expressions, so no input can make it slower than linear. It follows
// CommonMark for the two constructs AREC relies on: ATX headings and fenced
// code blocks (backticks or tildes, three or more, an optional info string, up
// to three spaces of indent; an unterminated fence runs to the end).

function leadingSpaces(line) {
  let i = 0;
  while (i < line.length && i < 4 && line[i] === ' ') i += 1;
  return i;
}

function fenceOpener(line) {
  const indent = leadingSpaces(line);
  if (indent > 3) return null;
  const char = line[indent];
  if (char !== '`' && char !== '~') return null;
  let end = indent;
  while (end < line.length && line[end] === char) end += 1;
  const length = end - indent;
  if (length < 3) return null;
  const info = line.slice(end).trim();
  if (char === '`' && info.includes('`')) return null;
  const lang = (info.split(/[ \t]/)[0] || '').replace(/^\{?\.?/, '').replace(/\}$/, '').toLowerCase();
  return { char, length, info, lang };
}

function closesFence(line, fence) {
  const indent = leadingSpaces(line);
  if (indent > 3) return false;
  let end = indent;
  while (end < line.length && line[end] === fence.char) end += 1;
  // Only spaces and tabs may follow a closing fence (CommonMark). Anything
  // else, a no-break space included, leaves the block open.
  return end - indent >= fence.length && /^[ \t]*$/.test(line.slice(end));
}

function atxHeading(line) {
  const indent = leadingSpaces(line);
  if (indent > 3) return null;
  let end = indent;
  while (end < line.length && line[end] === '#') end += 1;
  const level = end - indent;
  if (level < 1 || level > 6) return null;
  if (end < line.length && line[end] !== ' ' && line[end] !== '\t') return null;
  // Spaces and tabs only, as CommonMark strips them.
  let title = line.slice(end).replace(/^[ \t]+|[ \t]+$/g, '');
  // An optional closing sequence of '#' characters, preceded by a space.
  let cut = title.length;
  while (cut > 0 && title[cut - 1] === '#') cut -= 1;
  if (cut === 0) title = '';
  else if (cut < title.length && (title[cut - 1] === ' ' || title[cut - 1] === '\t')) title = title.slice(0, cut).replace(/[ \t]+$/, '');
  return { level, title };
}

/**
 * @returns {{
 *   lines: string[],
 *   headings: Array<{ line: number, level: number, title: string }>,
 *   fences: Array<{ open: number, close: number, terminated: boolean, char: string, length: number, lang: string, heading: string, path: string[], body: string }>,
 *   sections: string[][],
 * }}
 */
function scanMarkdown(text) {
  const lines = text.split('\n');
  const headings = [];
  const fences = [];
  let fence = null;
  let heading = '';
  // The open sections, outermost first, and the titles of the sections each
  // line is in (arrays are shared between lines, never changed in place).
  let stack = [];
  let titles = [];
  const sections = new Array(lines.length);
  const sectionStacks = new Array(lines.length);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    sections[i] = titles;
    sectionStacks[i] = stack;
    if (fence) {
      if (closesFence(line, fence)) {
        fences.push({ ...fence, close: i, terminated: true, body: lines.slice(fence.open + 1, i).join('\n') });
        fence = null;
      }
      continue;
    }
    const opener = fenceOpener(line);
    if (opener) {
      fence = { ...opener, open: i, heading, path: titles };
      continue;
    }
    const found = atxHeading(line);
    if (found) {
      headings.push({ line: i, level: found.level, title: found.title });
      heading = found.title;
      stack = nextSections(stack, found);
      titles = stack.map((h) => h.title);
    }
  }
  if (fence) {
    fences.push({ ...fence, close: lines.length, terminated: false, body: lines.slice(fence.open + 1).join('\n') });
  }
  return { lines, headings, fences, sections, sectionStacks };
}

// Sections (specification section 5). A heading of level 2 or deeper opens a
// section that runs until the next heading with the same or fewer `#`. A
// level-one heading closes every section; it opens one only when its whole
// text is "Diagnostics" or "Browser diagnostics", so a recording title that
// mentions diagnostics never turns the whole document into a diagnostics
// section.
const LEVEL_ONE_DIAGNOSTICS = /^(?:browser )?diagnostics$/i;
function nextSections(stack, heading) {
  if (heading.level === 1) return LEVEL_ONE_DIAGNOSTICS.test(heading.title) ? [heading] : [];
  return [...stack.filter((h) => h.level < heading.level), heading];
}

function hasHeading(scan, pattern) {
  return scan.headings.some((heading) => pattern.test(heading.title));
}

// Fence tags that announce JSON, or JSON one value per line. Every one of them
// must hold strict JSON: no comments, no trailing commas.
const JSON_LANGS = ['json', 'jsonc', 'json5'];
const JSON_LINES_LANGS = ['ndjson', 'jsonl'];

// A log line that starts with a bracketed label and goes on with text:
// `[HMR] connected`, `[12:00:01] error`. The label holds no bracket, brace or
// quote, and what follows the `]` on that line is not `,`, `]` or `}`.
const LOG_LINE = /^[ \t]*\[[^[\]{}"\r\n]*\][ \t]*[^ \t\r\n,\]}]/;

// A fenced block that holds JSON: tagged as JSON, or untagged with a first
// non-blank character of `{`, or of `[` unless its first line is a log line.
function isJsonLike(fence) {
  if (JSON_LANGS.includes(fence.lang) || JSON_LINES_LANGS.includes(fence.lang)) return true;
  if (fence.lang !== '') return false;
  let i = 0;
  while (i < fence.body.length && ' \t\r\n'.includes(fence.body[i])) i += 1;
  if (fence.body[i] === '{') return true;
  if (fence.body[i] !== '[') return false;
  const lineStart = fence.body.lastIndexOf('\n', i) + 1;
  const lineEnd = fence.body.indexOf('\n', i);
  return !LOG_LINE.test(fence.body.slice(lineStart, lineEnd === -1 ? fence.body.length : lineEnd));
}

// The block's JSON value, or undefined when it does not parse. A JSON-lines
// block becomes an array of its lines.
function parseJsonFence(fence) {
  try {
    if (JSON_LINES_LANGS.includes(fence.lang)) {
      return fence.body
        .split('\n')
        .filter((line) => !/^[ \t\r]*$/.test(line))
        .map((line) => JSON.parse(line));
    }
    return JSON.parse(fence.body);
  } catch {
    return undefined;
  }
}

// True when the fence is in a section whose heading matches, at any depth: a
// `### Network` block under `## Browser diagnostics` counts.
function isUnder(fence, pattern) {
  return fence.path.some((title) => pattern.test(title));
}

// The JSON blocks under a heading, each as { fence, tagged }.
function jsonBlocksUnderHeading(scan, pattern) {
  return scan.fences
    .filter((fence) => isJsonLike(fence) && isUnder(fence, pattern))
    .map((fence) => ({ fence, tagged: fence.lang !== '' }));
}

// A Metadata line of the form `- Label: value`, matched without a regular
// expression that could backtrack on long runs of whitespace.
function metadataValue(lines, label) {
  const wanted = `${label.toLowerCase()}:`;
  for (const line of lines) {
    let rest = line.trim();
    if (rest.startsWith('-') || rest.startsWith('*')) rest = rest.slice(1).trim();
    if (rest.toLowerCase().startsWith(wanted)) return rest.slice(wanted.length).trim();
  }
  return null;
}

// Headings that mark a recording document written before identity comments:
// the hosted recording.md, the CLI's early bundles and the Mac app's local AREC.
function looksLikeRecordingDocument(scan) {
  return scan.headings.some((h) => h.level === 1 && h.title !== '') && hasHeading(scan, /^(metadata|transcript)\b/i);
}

// A document without an identity comment that names a 1.x version in its
// Metadata was written by a 1.x producer, which always writes the comment.
function claimsCurrentVersion(scan) {
  const value = metadataValue(scan.lines, 'spec version');
  return value !== null && new RegExp(CURRENT_VERSION_PATTERN).test(value.split(/[ \t]/)[0]);
}

const DIAGNOSTICS_HEADING = /^browser diagnostics\b/i;
// Where a reader fails closed: any heading that names diagnostics, in any form.
const DIAGNOSTICS_ANYWHERE = /(?:^|[^-A-Za-z0-9_])diagnostics?(?![A-Za-z0-9_])/i;

// Every forbidden key at any depth, as dotted paths. Throws past a sane depth,
// which callers treat as "cannot be checked".
function forbiddenKeyPaths(value, path = '', depth = 0, found = []) {
  if (depth > 256) throw new Error('JSON nested too deeply to check');
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) forbiddenKeyPaths(value[i], `${path}[${i}]`, depth + 1, found);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const at = path ? `${path}.${key}` : key;
      if (FORBIDDEN_DIAGNOSTIC_KEY_RE.test(key)) found.push(at);
      else forbiddenKeyPaths(value[key], at, depth + 1, found);
    }
  }
  return found;
}

// Names that appear twice in one object of a JSON text. JSON.parse keeps only
// the last, so an earlier value would go unchecked while staying in the text.
// A single pass over the text that tracks the names of each open object.
function repeatedNames(text) {
  const found = new Set();
  const stack = [];
  const STRING = /"(?:[^"\\]|\\.)*"/y;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') stack.push(new Set());
    else if (ch === '[') stack.push(null);
    else if (ch === '}' || ch === ']') stack.pop();
    else if (ch === '"') {
      STRING.lastIndex = i;
      const m = STRING.exec(text);
      if (!m) break;
      i = STRING.lastIndex - 1;
      let j = STRING.lastIndex;
      while (j < text.length && ' \t\r\n'.includes(text[j])) j += 1;
      const names = stack[stack.length - 1];
      if (text[j] === ':' && names) {
        let name;
        try {
          name = JSON.parse(m[0]);
        } catch {
          continue;
        }
        if (names.has(name)) found.add(name);
        names.add(name);
      }
    }
  }
  return [...found];
}

// Every string that is a URL carrying a query value, at any depth, as dotted paths.
function rawQueryValuePaths(value, path = '', depth = 0, found = []) {
  if (depth > 256) throw new Error('JSON nested too deeply to check');
  if (typeof value === 'string') {
    if (RAW_QUERY_VALUE_RE.test(value)) found.push(path || '(value)');
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) rawQueryValuePaths(value[i], `${path}[${i}]`, depth + 1, found);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const at = path ? `${path}.${key}` : key;
      // A name can carry a URL too: `{"https://a/x?token=abc": 401}`.
      if (RAW_QUERY_VALUE_RE.test(key)) found.push(`${at} (as a name)`);
      rawQueryValuePaths(value[key], at, depth + 1, found);
    }
  }
  return found;
}

// One parameter and its value inside a URL: `?id=42`, `&token=abc`, `#t=5` or
// `;jsessionid=abc`. The value stops at a delimiter, whitespace, a quote or a
// bracket, so the text around a URL survives.
const URL_PARAMETER = /([?#&;][^=&#?;"'<>()[\]{}\s]*)=[^&#?;"'<>()[\]{}\s]*/g;

// Text with the parameter values dropped from every URL in it: in each run of
// non-whitespace that holds a `/` followed later by `?` or `#`, every
// parameter after that `/` loses its value and keeps its name. So
// `GET /cb?code=abc&next=https://a/x 302` becomes `GET /cb?code&next 302`, and
// `url=/api?token=abc` becomes `url=/api?token`. Linear on any input.
function withoutUrlParameterValues(text) {
  return text.replace(/[^ \t\r\n]+/g, (token) => {
    const slash = token.indexOf('/');
    if (slash === -1) return token;
    const rest = token.slice(slash);
    if (!/[?#]/.test(rest)) return token;
    // A removed value keeps any backticks it held, so cleaning a line can never
    // turn it into a code fence opener (a backtick fence's info string may not
    // contain a backtick).
    return token.slice(0, slash) + rest.replace(URL_PARAMETER, (match, name) => name + match.slice(name.length + 1).replace(/[^`]/g, ''));
  });
}

// A copy with the parameter values removed from every URL in every string, at
// any depth.
function queryValuesRemoved(value, depth = 0) {
  if (depth > 256) throw new Error('JSON nested too deeply to redact');
  if (typeof value === 'string') {
    return withoutUrlParameterValues(value);
  }
  if (Array.isArray(value)) return value.map((item) => queryValuesRemoved(item, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      Object.defineProperty(out, withoutUrlParameterValues(key), {
        value: queryValuesRemoved(value[key], depth + 1),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return out;
  }
  return value;
}

// A copy with every forbidden key removed, at any depth.
function redacted(value, depth = 0) {
  if (depth > 256) throw new Error('JSON nested too deeply to redact');
  if (Array.isArray(value)) return value.map((item) => redacted(item, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_DIAGNOSTIC_KEY_RE.test(key)) continue;
      Object.defineProperty(out, key, { value: redacted(value[key], depth + 1), enumerable: true, writable: true, configurable: true });
    }
    return out;
  }
  return value;
}

// --- Checks --------------------------------------------------------------------

// Runs every check. In 'conform' mode a broken rule is an error; the caller
// turns errors into warnings for 'read' mode.
function checkArec(text, source, mode) {
  const errors = [];
  // Content section 5 forbids: sensitive diagnostic keys, raw query values and
  // evidence that needs on-demand frame extraction. A producer must never
  // write it, so the strict check flags it in a document of any version.
  const forbidden = [];
  const warnings = [];
  const counts = { keyMoments: 0, diagnostics: 0 };

  if (text.trim() === '') {
    return { ok: false, source, header: null, legacy: false, errors: ['Document is empty.'], warnings, counts };
  }

  const scan = scanMarkdown(text);

  // Rule: every AREC document begins with the identity comment. A document
  // written before identity comments existed is read as a legacy document.
  const header = parseIdentity(text);
  let legacy = false;
  if (!header) {
    if (looksLikeRecordingDocument(scan) && !claimsCurrentVersion(scan)) {
      legacy = true;
      warnings.push(
        'No AREC identity comment: read as a legacy document written before identity comments existed. Current producers write `<!-- arec ... -->` first.',
      );
    } else {
      errors.push('Missing the AREC identity comment. An AREC document must begin with `<!-- arec ... -->`.');
    }
  }

  if (header) {
    if (!header.spec_version) {
      errors.push('Identity comment is missing the required field `spec_version`.');
    } else if (!new RegExp(SPEC_VERSION_PATTERN).test(header.spec_version)) {
      errors.push(`\`spec_version\` is not a MAJOR.MINOR version: ${header.spec_version}`);
    } else if (new RegExp(LEGACY_VERSION_PATTERN).test(header.spec_version)) {
      legacy = true;
    } else if (!new RegExp(CURRENT_VERSION_PATTERN).test(header.spec_version)) {
      errors.push(
        `Document declares spec_version ${header.spec_version}, a newer major version than this validator reads (${SPEC_VERSION}).`,
      );
    }

    if (!header.profile) {
      errors.push('Identity comment is missing the required field `profile`.');
    } else if (!PROFILES.includes(header.profile)) {
      (isNewerMinor(header.spec_version) ? warnings : errors).push(
        `Unknown \`profile\`: ${header.profile}. Expected one of ${PROFILES.join(', ')}.`,
      );
    }

    // watch_url is a human-facing address, so it must be resolvable anywhere.
    // An empty value means absent.
    if (header.watch_url && !isHttpsUrl(header.watch_url)) {
      errors.push(`\`watch_url\` must be an absolute https URL. Found: ${header.watch_url}`);
    }
    // canonical_url may be relative in a downloadable bundle, which is a copy of
    // a hosted document rather than the hosted document itself.
    if (header.canonical_url && !isPrecomputedArtifactRef(header.canonical_url)) {
      errors.push(`\`canonical_url\` is not a usable reference. Found: ${header.canonical_url}`);
    } else if (header.canonical_url && !isHttpsUrl(header.canonical_url)) {
      warnings.push(
        '`canonical_url` is relative. That is correct for a portable bundle; a hosted document should advertise its absolute https .arec URL.',
      );
    }
    // canonical_url names this AREC document, never the source video.
    if (header.canonical_url && !/\.(?:arec|md)(?:[?#].*)?$/i.test(header.canonical_url)) {
      warnings.push(
        `\`canonical_url\` should name this AREC document (a .arec URL or path), not a video or page. Found: ${header.canonical_url}`,
      );
    }

    // Public documents must carry both URLs. A local imported bundle may omit
    // them and identify its source in Metadata instead, so this is only
    // enforced when the document declares itself public.
    const access = metadataValue(scan.lines, 'access');
    if (access !== null && access.toLowerCase() === 'public') {
      for (const field of ['canonical_url', 'watch_url']) {
        if (!header[field]) {
          errors.push(`Document declares \`Access: public\` so the identity comment must include \`${field}\`.`);
        }
      }
    }
  }

  // Rule: Metadata is required.
  if (!hasHeading(scan, /^metadata\b/i)) {
    errors.push('Missing the required `Metadata` section.');
  }

  // Rule: a Transcript section, or an explicit statement of why there is none.
  const hasTranscript = hasHeading(scan, /^transcript\b/i);
  const explainsNoTranscript =
    /(no transcript|transcript (is )?(not|unavailable|pending|not ready)|without a transcript|transcript-only by design)/i.test(
      text,
    );
  if (!hasTranscript && !explainsNoTranscript) {
    errors.push(
      'Missing a `Transcript` section. A document without one must state explicitly why no transcript exists or is not ready.',
    );
  }

  // Rule: completeness language, so missing capture is never mistaken for
  // evidence that an event did not happen.
  const hasCompleteness =
    hasHeading(scan, /^(capture gaps|gaps|incomplete|completeness|visual gaps)\b/i) ||
    /(capture gap|no known capture gaps|incomplete capture|transcript-only by design)/i.test(text);
  if (!hasCompleteness) {
    errors.push('Missing `Capture gaps` (or equivalent completeness language). Absent capture must be stated, not implied.');
  }

  // Key moments.
  for (const block of jsonBlocksUnderHeading(scan, /^key moments?\b/i)) {
    const parsed = parseJsonFence(block.fence);
    if (parsed === undefined) {
      if (block.fence.lang === 'json') errors.push('Key moments JSON block does not parse.');
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push('Key moments JSON block must contain an array.');
      continue;
    }
    parsed.forEach((rawMoment, index) => {
      counts.keyMoments += 1;
      const at = `Key moment ${index}`;
      if (!isPlainObject(rawMoment)) {
        errors.push(`${at}: must be an object.`);
        return;
      }
      // A field whose value is null is treated as absent: "not captured".
      const moment = withoutNulls(rawMoment);
      if (!Number.isInteger(moment.t_ms) || moment.t_ms < 0) {
        errors.push(`${at}: \`t_ms\` must be a non-negative integer.`);
      }
      if (typeof moment.caption !== 'string' || moment.caption.trim() === '') {
        errors.push(`${at}: \`caption\` is required.`);
      }
      for (const field of ['frame_url', 'crop_url']) {
        if (moment[field] !== undefined && !isPrecomputedArtifactRef(moment[field])) {
          forbidden.push(
            `${at}: \`${field}\` must reference a precomputed artifact, as an absolute https URL or a path inside the bundle. A document must not require server-side frame extraction. Found: ${moment[field]}`,
          );
        }
      }
      for (const field of ['x', 'y']) {
        if (moment[field] !== undefined && !isUnitInterval(moment[field])) {
          errors.push(`${at}: \`${field}\` must be a frame-relative coordinate between 0 and 1. Found: ${moment[field]}`);
        }
      }
      if ((moment.x === undefined) !== (moment.y === undefined)) {
        errors.push(`${at}: \`x\` and \`y\` must be provided together.`);
      }
      if (moment.source !== undefined && !POINTER_SOURCES.includes(moment.source)) {
        // Consumers ignore sources they do not know, so this is not a failure.
        warnings.push(`${at}: unknown \`source\` ${moment.source}. Expected one of ${POINTER_SOURCES.join(', ')}.`);
      }
      if (moment.confidence !== undefined && !isUnitInterval(moment.confidence)) {
        errors.push(`${at}: \`confidence\` must be between 0 and 1.`);
      }

      // A motion gesture records where the pointer deliberately moved something
      // to. Its destination is evidence like any other, so it obeys the same
      // coordinate and precomputed-artifact rules as the origin.
      if (moment.motion !== undefined) {
        if (!isPlainObject(moment.motion)) {
          errors.push(`${at}: \`motion\` must be an object.`);
        } else {
          for (const field of ['target_x', 'target_y']) {
            if (!isUnitInterval(moment.motion[field])) {
              errors.push(
                `${at}: \`motion.${field}\` must be a frame-relative coordinate between 0 and 1. Found: ${moment.motion[field]}`,
              );
            }
          }
          const target = moment.motion.target_frame_url;
          if (target !== undefined && target !== null && !isPrecomputedArtifactRef(target)) {
            forbidden.push(`${at}: \`motion.target_frame_url\` must reference a precomputed artifact. Found: ${target}`);
          }
        }
      }
    });
  }

  // Browser diagnostics.
  for (const block of jsonBlocksUnderHeading(scan, DIAGNOSTICS_HEADING)) {
    // A block that does not parse is reported below, as a section 5 problem.
    const parsed = parseJsonFence(block.fence);
    if (parsed === undefined) continue;
    if (!Array.isArray(parsed)) {
      errors.push('Browser diagnostics JSON block must contain an array.');
      continue;
    }
    parsed.forEach((entry, index) => {
      counts.diagnostics += 1;
      const at = `Diagnostic ${index}`;
      if (!isPlainObject(entry)) {
        errors.push(`${at}: must be an object.`);
        return;
      }
      if (typeof entry.kind !== 'string' || entry.kind.trim() === '') {
        errors.push(`${at}: \`kind\` is required.`);
      }
    });
  }

  // Section 5 covers every JSON block under a heading that names diagnostics,
  // at any depth below it, not only the Browser diagnostics array. A block
  // there that looks like JSON but does not parse cannot be checked, so it
  // fails: tag other content `text`.
  for (const fence of scan.fences) {
    if (!isJsonLike(fence) || !isUnder(fence, DIAGNOSTICS_ANYWHERE)) continue;
    const at = `JSON block under "${fence.heading}"`;
    const parsed = parseJsonFence(fence);
    if (parsed === undefined) {
      forbidden.push(`${at} does not parse, so it cannot be checked for sensitive content. Tag content that is not JSON as \`text\`.`);
      continue;
    }
    // The whole value, whatever its shape, so a nested or legacy block is
    // checked as thoroughly as a well-formed array.
    checkForbiddenContent(parsed, at, fence.body);
  }

  function checkForbiddenContent(value, at, body) {
    const repeated = body === undefined ? [] : repeatedNames(body);
    for (const name of repeated) {
      forbidden.push(`${at}: the name ${JSON.stringify(name)} appears twice in one object, so a value can hide behind it. Use each name once.`);
    }
    let keys;
    let urls;
    try {
      keys = forbiddenKeyPaths(value);
      urls = rawQueryValuePaths(value);
    } catch (error) {
      forbidden.push(`${at}: could not be checked for sensitive keys (${error.message}).`);
      return;
    }
    for (const key of keys) {
      forbidden.push(
        mode === 'conform'
          ? `${at}: \`${key}\` must not be present. Diagnostics carry no headers, bodies, cookies, credentials or raw query values.`
          : `${at}: \`${key}\` is sensitive and is dropped when read (redacted in readArec output).`,
      );
    }
    for (const url of urls) {
      forbidden.push(
        mode === 'conform'
          ? `${at}: \`${url}\` carries a raw query value. Keep query key names and drop their values.`
          : `${at}: \`${url}\` carries a raw query value, which is dropped when read (readArec keeps the key names).`,
      );
    }
  }

  // Recommended, not required. Warnings never fail a document, because the
  // specification says a consumer must keep reading past what it does not find.
  if (header && header.profile === 'clipy-recording') {
    for (const [pattern, label] of [
      [/^intent\b/i, 'Intent'],
      [/^summary\b/i, 'Summary'],
      [/^key moments?\b/i, 'Key moments'],
    ]) {
      if (!hasHeading(scan, pattern)) {
        warnings.push(`Profile clipy-recording usually contains a \`${label}\` section.`);
      }
    }
  }

  if (
    header &&
    header.spec_version &&
    new RegExp(CURRENT_VERSION_PATTERN).test(header.spec_version) &&
    !isKnownVersion(header.spec_version)
  ) {
    warnings.push(`Document declares spec_version ${header.spec_version}; this validator implements ${SPEC_VERSION}.`);
  }

  // A legacy document is accepted. Whatever it does not meet of the current
  // rules is reported, as warnings, so a reader knows what is missing. Content
  // section 5 forbids stays an error whatever the version (section 7.1).
  if (legacy) {
    const label = header ? `spec_version ${header.spec_version}` : 'no identity comment';
    for (const error of errors.splice(0)) warnings.push(`Legacy document (${label}): ${error}`);
  }
  for (const problem of forbidden) errors.push(problem);

  return { ok: errors.length === 0, source, header, legacy, errors, warnings, counts };
}

/**
 * Checks an AREC document.
 *
 * Reading is lenient by design (specification section 7.1): in the default
 * 'read' mode nothing is an error, so any text is accepted and every problem is
 * reported as a warning. 'conform' is an optional, stricter producer check: it
 * reports what a producer should fix as errors. Readers never need it.
 *
 * Never throws, whatever it is given.
 *
 * @param {unknown} text Raw AREC document text.
 * @param {{source?: string, mode?: 'read' | 'conform'}} [options]
 * @returns {{ok: boolean, mode: 'read' | 'conform', source: string, header: Record<string, string>|null, legacy: boolean, errors: string[], warnings: string[], counts: {keyMoments: number, diagnostics: number}}}
 */
export function validateArec(text, options = {}) {
  const source = (options && options.source) || 'recording.arec';
  const mode = options && options.mode === 'conform' ? 'conform' : 'read';
  const empty = { keyMoments: 0, diagnostics: 0 };
  let result;
  try {
    result =
      typeof text === 'string'
        ? checkArec(normaliseNewlines(text), source, mode)
        : { ok: false, source, header: null, legacy: false, errors: ['Input is not text.'], warnings: [], counts: empty };
  } catch (error) {
    result = {
      ok: false,
      source,
      header: null,
      legacy: false,
      errors: [`Document could not be checked: ${error && error.message ? error.message : String(error)}`],
      warnings: [],
      counts: empty,
    };
  }
  if (mode === 'read') {
    for (const problem of result.errors) result.warnings.push(problem);
    result.errors = [];
    // Any text is readable. Only input that is not text at all is not.
    result.ok = typeof text === 'string';
  }
  return { ...result, mode };
}

// --- Reading -------------------------------------------------------------------

// The usable part of one key moment: fields that break a rule are dropped, so
// a reader treats them as not captured. Unknown fields are kept.
function readableMoment(raw) {
  if (!isPlainObject(raw)) return null;
  const moment = withoutNulls(raw);
  if (!(Number.isInteger(moment.t_ms) && moment.t_ms >= 0)) delete moment.t_ms;
  if (!(typeof moment.caption === 'string' && moment.caption.trim() !== '')) delete moment.caption;
  for (const field of ['frame_url', 'crop_url']) {
    if (moment[field] !== undefined && !isPrecomputedArtifactRef(moment[field])) delete moment[field];
  }
  if (!isUnitInterval(moment.x) || !isUnitInterval(moment.y)) {
    delete moment.x;
    delete moment.y;
  }
  if (moment.confidence !== undefined && !isUnitInterval(moment.confidence)) delete moment.confidence;
  if (moment.motion !== undefined) {
    const motion = isPlainObject(moment.motion) ? withoutNulls(moment.motion) : null;
    if (!motion || !isUnitInterval(motion.target_x) || !isUnitInterval(motion.target_y)) {
      delete moment.motion;
    } else {
      if (motion.target_frame_url !== undefined && !isPrecomputedArtifactRef(motion.target_frame_url)) {
        delete motion.target_frame_url;
      }
      moment.motion = motion;
    }
  }
  return moment;
}

// The identity header with any unsafe link removed: a watch URL that is not
// absolute https, or a canonical URL that is not https or a path in the bundle.
function readableHeader(header) {
  if (!header) return null;
  const out = { ...header };
  if (out.watch_url !== undefined && !isHttpsUrl(out.watch_url)) delete out.watch_url;
  if (out.canonical_url !== undefined && !isPrecomputedArtifactRef(out.canonical_url)) delete out.canonical_url;
  return out;
}

// Indexes of the lines in a diagnostics section that are not inside the body
// of a JSON block. A heading line counts when the section it opens, or one
// around it, is a diagnostics section.
function diagnosticsTextLines(scan) {
  const skip = new Set();
  for (const fence of scan.fences) {
    if (!isJsonLike(fence)) continue;
    for (let i = fence.open + 1; i < Math.min(fence.close, scan.lines.length); i += 1) skip.add(i);
  }
  const headingAt = new Map(scan.headings.map((h) => [h.line, h]));
  const names = (titles) => titles.some((title) => DIAGNOSTICS_ANYWHERE.test(title));
  const out = [];
  for (let i = 0; i < scan.lines.length; i += 1) {
    if (skip.has(i)) continue;
    const heading = headingAt.get(i);
    const opened = heading ? nextSections(scan.sectionStacks[i], heading).map((h) => h.title) : [];
    // A heading belongs to the section it opens, not to the one it closes.
    if (heading ? names(opened) : names(scan.sections[i])) out.push(i);
  }
  return out;
}

const UNCHECKED_PLACEHOLDER = '[removed: this JSON block could not be checked for sensitive keys]';

/**
 * Reads an AREC document the way a consumer should: leniently. Never throws
 * and never refuses text. Whatever breaks a rule is dropped or treated as
 * absent and reported in `warnings`. Sensitive keys are removed at any depth
 * from every fenced JSON block, both in `document.browserDiagnostics` and in
 * `document.markdown`; a diagnostics block that cannot be checked is replaced.
 *
 * @typedef {{
 *   header: Record<string, string> | null,
 *   specVersion: string | null,
 *   profile: string | null,
 *   title: string | null,
 *   sections: Array<{ level: number, title: string }>,
 *   keyMoments: Array<Record<string, any>>,
 *   browserDiagnostics: Array<Record<string, any>>,
 *   markdown: string,
 * }} ArecDocument
 *
 * @param {unknown} input
 * @param {{source?: string}} [options]
 * @returns {{ok: boolean, source: string, legacy: boolean, document: ArecDocument, warnings: string[], counts: {keyMoments: number, diagnostics: number}}}
 */
export function readArec(input, options = {}) {
  const source = (options && options.source) || 'recording.arec';
  const text = typeof input === 'string' ? normaliseNewlines(input) : '';
  const check = validateArec(text, { source, mode: 'read' });
  if (typeof input !== 'string') check.warnings.push('Input is not text.');
  const warnings = check.warnings;
  const header = readableHeader(check.header);
  /** @type {ArecDocument} */
  const document = {
    header,
    specVersion: (header && header.spec_version) || null,
    profile: (header && header.profile) || null,
    title: null,
    sections: [],
    keyMoments: [],
    browserDiagnostics: [],
    markdown: text,
  };
  try {
    const scan = scanMarkdown(text);
    const diagnosticLines = diagnosticsTextLines(scan);
    const inDiagnostics = new Set(diagnosticLines);
    for (const heading of scan.headings) {
      const title = inDiagnostics.has(heading.line) ? withoutUrlParameterValues(heading.title) : heading.title;
      if (heading.level === 1 && document.title === null && title !== '') document.title = title;
      document.sections.push({ level: heading.level, title });
    }

    const lines = [...scan.lines];
    let changed = false;
    // Outside JSON block bodies, every line in a diagnostics section (prose,
    // headings, `text` blocks, tables) loses the parameter values of the URLs
    // in it. Line counts do not change, so the fence positions below stay valid.
    for (const index of diagnosticLines) {
      const clean = withoutUrlParameterValues(lines[index]);
      if (clean !== lines[index]) {
        lines[index] = clean;
        changed = true;
      }
    }
    // Replacement bodies by the line that opens their fence, applied in one
    // pass below so a document with many blocks stays linear.
    const replacements = new Map();
    for (const fence of scan.fences) {
      const underDiagnostics = isUnder(fence, DIAGNOSTICS_ANYWHERE);
      if (!isJsonLike(fence)) continue;
      const parsed = parseJsonFence(fence);
      let replacement = null;
      if (parsed === undefined) {
        // Not JSON. Only a diagnostics block is assumed to hold secrets.
        if (underDiagnostics) replacement = UNCHECKED_PLACEHOLDER;
      } else {
        try {
          const withoutKeys = redacted(parsed);
          const clean = underDiagnostics ? queryValuesRemoved(withoutKeys) : withoutKeys;
          const serialised =
            JSON_LINES_LANGS.includes(fence.lang) && Array.isArray(clean)
              ? clean.map((item) => JSON.stringify(item)).join('\n')
              : JSON.stringify(clean);
          // A diagnostics block is always written back from what was parsed,
          // so text JSON.parse dropped (an earlier duplicate name) cannot
          // survive in the Markdown.
          const original =
            JSON_LINES_LANGS.includes(fence.lang) && Array.isArray(parsed)
              ? parsed.map((item) => JSON.stringify(item)).join('\n')
              : JSON.stringify(parsed);
          // Rewrite only when something is removed, or when a repeated name
          // means the text holds a value JSON.parse dropped, in any block.
          if (serialised !== original || repeatedNames(fence.body).length > 0) {
            replacement = serialised;
          }
          if (isUnder(fence, DIAGNOSTICS_HEADING) && Array.isArray(clean)) {
            for (const entry of clean) if (isPlainObject(entry)) document.browserDiagnostics.push(entry);
          }
        } catch {
          replacement = UNCHECKED_PLACEHOLDER;
        }
      }
      if (replacement === null) continue;
      if (replacement === UNCHECKED_PLACEHOLDER) {
        warnings.push(`A JSON block under "${fence.heading || 'the start'}" could not be checked for sensitive content and was removed.`);
      }
      replacements.set(fence.open, { fence, replacement });
      changed = true;
    }
    if (changed) {
      const out = [];
      for (let i = 0; i < lines.length; i += 1) {
        out.push(lines[i]);
        const found = replacements.get(i);
        if (!found) continue;
        out.push(found.replacement);
        if (found.fence.terminated) {
          out.push(lines[found.fence.close]);
          i = found.fence.close;
        } else {
          out.push(found.fence.char.repeat(found.fence.length));
          i = lines.length;
        }
      }
      document.markdown = out.join('\n');
    }

    for (const fence of scan.fences) {
      if (!isJsonLike(fence) || !isUnder(fence, /^key moments?\b/i)) continue;
      const parsed = parseJsonFence(fence);
      if (!Array.isArray(parsed)) continue;
      for (const raw of parsed) {
        // The same keys come out of a key moment as out of the Markdown.
        let clean;
        try {
          clean = redacted(raw);
        } catch {
          continue;
        }
        const moment = readableMoment(clean);
        if (moment) document.keyMoments.push(moment);
      }
    }
  } catch (error) {
    warnings.push(`Part of the document could not be read: ${error && error.message ? error.message : String(error)}`);
  }
  return { ok: typeof input === 'string', source, legacy: check.legacy, document, warnings, counts: check.counts };
}
