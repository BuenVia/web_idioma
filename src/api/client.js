// A tiny wrapper around fetch() that every API module uses.
//
// Why it exists:
// - Where the API lives depends on where the app runs:
//   * Locally, REACT_APP_API_URL is unset, so we call *relative* paths
//     ("/es/subject/getall") and the "proxy" field in package.json forwards
//     them to http://localhost:8080. The browser sees one origin, so no CORS
//     is needed.
//   * In production (Render), REACT_APP_API_URL is set to the deployed API,
//     e.g. https://my-api.onrender.com, and we call it directly. The backend
//     must then allow this app's origin via CORS.
//   CRA bakes REACT_APP_* variables into the bundle at *build* time, so
//   changing it requires a rebuild/redeploy.
// - Some endpoints return an empty body (DELETE → 204, and
//   lesson/getbysubject when there is no lesson), so we can't blindly call
//   response.json().
// - Error messages from the backend are sometimes misleading (see
//   docs/API_REFERENCE.md §7), so we turn status codes into friendly text.

// Thrown for any non-2xx response. `status` is the HTTP status code.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// The deployed API's URL, or "" locally (relative URLs). Any trailing slash
// is stripped so API_BASE + "/languages" never produces "//languages".
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

// Friendly messages keyed by HTTP status. We deliberately ignore the
// backend's own `message` field because several of them name the wrong thing.
const FRIENDLY_ERRORS = {
  400: 'The request was not valid.',
  404: 'That item could not be found. It may have been deleted.',
  415: 'The request was sent in the wrong format.',
  500: 'The server hit a problem. Please try again.',
};

/**
 * Send a request to a language-scoped route, e.g. "/es/subject/getall".
 * Nearly every backend route is under a language, so this is the one the API
 * modules normally use.
 *
 * @param {string} language - a language code from GET /languages, e.g. "es".
 *                            Every path is prefixed with it.
 * @param {string} path     - e.g. "/subject/getall"
 * @param {object} [options]
 * @param {string} [options.method="GET"]
 * @param {object} [options.body] - plain object, sent as JSON
 * @returns {Promise<any>} parsed JSON, or null when the body is empty
 */
export function request(language, path, options) {
  return send(`/${language}${path}`, options);
}

/**
 * Send a request to any route, exactly as given. Use this for the few routes
 * that are NOT under a language: GET /languages and GET /levels.
 * Same options and return value as request().
 */
export async function send(url, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(API_BASE + url, {
      method,
      // The backend returns 415 if JSON is sent without this header.
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch() only throws when the server can't be reached at all.
    throw new ApiError(0, 'Could not reach the server. Is the backend running?');
  }

  if (!response.ok) {
    const message =
      FRIENDLY_ERRORS[response.status] ||
      `Something went wrong (error ${response.status}).`;
    throw new ApiError(response.status, message);
  }

  // Read as text first so empty bodies don't crash JSON parsing.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
