/**
 * Constants for the Gemini API proxy
 */

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Goog-Api-Key',
  'Access-Control-Max-Age': '86400',
} as const;

export const ALLOWED_FORWARD_HEADERS = [
  'content-type',
  'x-goog-api-version',
] as const;

export const API_KEY_HEADER = 'X-Goog-Api-Key' as const;
export const API_KEY_QUERY_PARAM = 'key' as const;

export const HTTP_METHODS_WITHOUT_BODY = ['GET', 'HEAD'] as const;

