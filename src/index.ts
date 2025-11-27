/**
 * Cloudflare Worker for proxying requests to Google Gemini API
 * This allows access to Gemini API from regions where it's blocked
 */

import { Env } from './types';
import { CORS_HEADERS } from './constants';
import {
  buildTargetUrl,
  createErrorResponse,
  createProxyResponse,
  createRootResponse,
  getApiKey,
  prepareHeaders,
  requiresBody,
} from './utils';

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }
  return null;
}

/**
 * Main request handler
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Parse the request URL
    const url = new URL(request.url);
    const pathname = url.pathname;

    // If pathname is just "/", provide a helpful message (no API key required)
    if (pathname === '/') {
      return createRootResponse(url.origin);
    }

    // Get API key (required for all other endpoints)
    const apiKey = getApiKey(request, env);
    if (!apiKey) {
      return createErrorResponse(
        'API key is required. Provide it via X-Goog-Api-Key header, ?key= query parameter, or set GEMINI_API_KEY environment variable'
      );
    }

    // Build target URL
    const targetUrl = buildTargetUrl(pathname, url.searchParams, apiKey);

    // Prepare headers
    const headers = prepareHeaders(request, apiKey);

    // Get request body if present
    let body: BodyInit | null = null;
    if (requiresBody(request.method)) {
      body = await request.clone().arrayBuffer();
    }

    // Forward the request to Gemini API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
    });

    // Get response body
    const responseBody = await response.arrayBuffer();

    // Create proxy response with CORS headers
    return createProxyResponse(response, responseBody);
  } catch (error) {
    console.error('Proxy error:', error);

    return createErrorResponse(
      'Proxy error',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * Cloudflare Worker entry point
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return handleRequest(request, env);
  },
};
