/**
 * Test script for Gemini API proxy
 *
 * Usage:
 *   npm run test:gemini
 *   or
 *   PROXY_URL=http://localhost:8787 API_KEY=your_key tsx scripts/test-gemini.ts
 */

const PROXY_URL = process.env.PROXY_URL || 'http://localhost:8787';
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Error: API_KEY or GEMINI_API_KEY environment variable is required');
  console.error('   Usage: API_KEY=your_key tsx test-gemini.ts');
  process.exit(1);
}

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  error?: string;
  data?: any;
}

/**
 * Test helper function
 */
async function test(
  name: string,
  url: string,
  options: RequestInit = {}
): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, options);

    // Handle empty responses (like 204 No Content for OPTIONS)
    let data: any = null;
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (contentLength !== '0' && contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        // If JSON parsing fails but status is OK (like 204), that's fine
        if (response.ok && response.status === 204) {
          data = null;
        } else {
          throw e;
        }
      }
    }

    if (response.ok) {
      console.log(`   ✅ Success (${response.status})`);
      return {
        name,
        success: true,
        status: response.status,
        data,
      };
    } else {
      console.log(`   ❌ Failed (${response.status})`);
      if (data) {
        console.log(`   Error:`, JSON.stringify(data, null, 2));
      }
      return {
        name,
        success: false,
        status: response.status,
        error: data ? JSON.stringify(data) : `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error instanceof Error ? error.message : String(error));
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Gemini API Proxy Tests');
  console.log(`   Proxy URL: ${PROXY_URL}`);
  console.log(`   API Key: ${API_KEY.substring(0, 10)}...`);

  const results: TestResult[] = [];

  // Test 1: List models using query parameter
  results.push(
    await test(
      'List Models (query parameter)',
      `${PROXY_URL}/v1/models?key=${API_KEY}`
    )
  );

  // Test 2: List models using header
  results.push(
    await test('List Models (header)', `${PROXY_URL}/v1/models`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
      },
    })
  );

  // Test 3: Get specific model info (use v1beta as gemini-flash-latest may not be in v1)
  results.push(
    await test(
      'Get Model Info',
      `${PROXY_URL}/v1beta/models/gemini-flash-latest?key=${API_KEY}`
    )
  );

  // Test 4: Generate content (chat completion)
  results.push(
    await test(
      'Generate Content',
      `${PROXY_URL}/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Hello! Please respond with a short greeting.',
                },
              ],
            },
          ],
        }),
      }
    )
  );

  // Test 5: Generate content with header API key
  results.push(
    await test(
      'Generate Content (header API key)',
      `${PROXY_URL}/v1beta/models/gemini-flash-latest:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'What is 2+2? Answer in one word.',
                },
              ],
            },
          ],
        }),
      }
    )
  );

  // Test 6: Test root endpoint
  results.push(await test('Root Endpoint', `${PROXY_URL}/`));

  // Test 7: Test CORS preflight
  results.push(
    await test('CORS Preflight', `${PROXY_URL}/v1/models`, {
      method: 'OPTIONS',
    })
  );

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.status ? ` (${result.status})` : '';
    console.log(`${icon} ${result.name}${status}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error.substring(0, 100)}...`);
    }
  });

  console.log('='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

