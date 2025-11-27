/**
 * Type definitions for the Gemini API proxy
 */

export interface Env {
  GEMINI_API_KEY?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

export interface RootResponse {
  message: string;
  usage: string;
  example: string;
}

