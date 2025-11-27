/**
 * Utility functions for the Gemini API proxy
 */

import { Env, ErrorResponse, RootResponse } from './types';
import {
  API_KEY_HEADER,
  API_KEY_QUERY_PARAM,
  ALLOWED_FORWARD_HEADERS,
  CORS_HEADERS,
  GEMINI_API_BASE,
  HTTP_METHODS_WITHOUT_BODY,
} from './constants';

/**
 * Get API key from request
 * Priority: X-Goog-Api-Key header > ?key= query parameter > environment variable
 */
export function getApiKey(request: Request, env: Env): string | null {
  // Check header first
  const headerKey = request.headers.get(API_KEY_HEADER);
  if (headerKey) {
    return headerKey;
  }

  // Check query parameter
  const url = new URL(request.url);
  const queryKey = url.searchParams.get(API_KEY_QUERY_PARAM);
  if (queryKey) {
    return queryKey;
  }

  // Check environment variable (fallback)
  if (env.GEMINI_API_KEY) {
    return env.GEMINI_API_KEY;
  }

  return null;
}

/**
 * Build the target URL for Gemini API
 */
export function buildTargetUrl(
  pathname: string,
  searchParams: URLSearchParams,
  apiKey: string
): string {
  // Remove the key from search params as we'll add it to the URL
  searchParams.delete(API_KEY_QUERY_PARAM);

  // Build the full URL
  const queryString = searchParams.toString();
  const separator = queryString ? '&' : '?';
  const url = `${GEMINI_API_BASE}${pathname}${queryString ? `?${queryString}` : ''}${separator}key=${apiKey}`;

  return url;
}

/**
 * Prepare headers for forwarding to Gemini API
 */
export function prepareHeaders(request: Request, apiKey: string): Headers {
  const headers = new Headers();

  // Copy relevant headers from original request
  for (const headerName of ALLOWED_FORWARD_HEADERS) {
    const value = request.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  // Set API key header
  headers.set(API_KEY_HEADER, apiKey);

  return headers;
}

/**
 * Check if request method requires a body
 */
export function requiresBody(method: string): boolean {
  return !HTTP_METHODS_WITHOUT_BODY.includes(method as any);
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  message?: string,
  status: number = 400
): Response {
  const body: ErrorResponse = { error };
  if (message) {
    body.message = message;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function createJsonResponse(
  data: unknown,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Create root endpoint response
 */
export function createRootResponse(origin: string): Response {
  const data: RootResponse = {
    message: 'Gemini API Proxy',
    usage: 'Use paths like /v1/models or /v1beta/models/gemini-flash-latest:generateContent',
    example: `${origin}/v1/models?key=YOUR_API_KEY`,
  };

  return createJsonResponse(data);
}

/**
 * Create proxy response with CORS headers
 */
export function createProxyResponse(
  response: Response,
  body: ArrayBuffer
): Response {
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    },
  });
}

