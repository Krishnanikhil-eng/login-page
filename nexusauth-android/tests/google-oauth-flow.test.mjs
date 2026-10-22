import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- TEST SUITE: GOOGLE OAUTH & ANDROID DEEP-LINK VERIFICATION ---');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failedCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failedCount++;
  }
}

// 1. App config scheme & intent-filter checks
runTest('app.json contains scheme nexusauth and matching intent filter', () => {
  const appJsonPath = path.join(rootDir, 'app.json');
  const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  assert.equal(appConfig.expo.scheme, 'nexusauth', 'Top-level scheme must be "nexusauth"');
  assert.equal(appConfig.expo.android.package, 'com.nexusauth.app', 'Android package must be com.nexusauth.app');

  const intentFilters = appConfig.expo.android.intentFilters || [];
  assert.ok(intentFilters.length > 0, 'Intent filters must be defined');

  const hasNexusAuthFilter = intentFilters.some((filter) => {
    return (
      filter.action === 'VIEW' &&
      filter.category?.includes('BROWSABLE') &&
      filter.category?.includes('DEFAULT') &&
      filter.data?.some((d) => d.scheme === 'nexusauth')
    );
  });
  assert.ok(hasNexusAuthFilter, 'Must have a browsable intent-filter matching scheme "nexusauth"');
});

// 2. Secret audit: confirm no Google Client Secret or Service Role key is committed in android codebase
runTest('Security Audit: No client secrets or service-role keys bundled in Android source', () => {
  const srcDir = path.join(rootDir, 'src');
  const files = [];

  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx') || item.name.endsWith('.json'))) {
        files.push(fullPath);
      }
    }
  }
  walk(srcDir);

  const secretKeywords = [
    /client_secret/i,
    /google_secret/i,
    /service_role/i,
    /sb_secret/i,
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of secretKeywords) {
      assert.ok(!pattern.test(content), `Found suspicious secret keyword ${pattern} in ${path.relative(rootDir, file)}`);
    }
  }
});

// 3. Supabase Google OAuth URL generation check
await runAsyncTest('Supabase Google OAuth URL generation follows Google OAuth flow with nexusauth:// redirect', async () => {
  const SUPABASE_URL = 'https://ohkdiqnxfqygbzvjjpve.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_LLsonXrNUrAgnXCEu2C-uw_iVGe4kVO';

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'nexusauth://auth/callback',
      skipBrowserRedirect: true,
    },
  });

  assert.equal(error, null, 'signInWithOAuth should not return an error');
  assert.ok(data?.url, 'signInWithOAuth should return an authorization URL');
  assert.ok(data.url.startsWith(`${SUPABASE_URL}/auth/v1/authorize?provider=google`), 'Must target Supabase authorize endpoint with provider=google');
  assert.ok(data.url.includes('redirect_to=nexusauth%3A%2F%2Fauth%2Fcallback'), 'Must include properly encoded redirectTo nexusauth://auth/callback');
});

// 4. Test URL parameter parsing for both PKCE and Implicit Grant
runTest('Deep link parser handles PKCE authorization code', () => {
  const parseAuthParams = (url) => {
    const params = {};
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const hashIndex = url.indexOf('#');
      const queryString =
        hashIndex > queryIndex
          ? url.substring(queryIndex + 1, hashIndex)
          : url.substring(queryIndex + 1);
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => { params[key] = val; });
    }
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const fragmentString = url.substring(hashIndex + 1);
      const fragmentParams = new URLSearchParams(fragmentString);
      fragmentParams.forEach((val, key) => { params[key] = val; });
    }
    return params;
  };

  const pkceUrl = 'nexusauth://auth/callback?code=e6584c31-97a6-4dc4-b77a-ec4f67bf6322';
  const pkceParams = parseAuthParams(pkceUrl);
  assert.equal(pkceParams.code, 'e6584c31-97a6-4dc4-b77a-ec4f67bf6322');

  const implicitUrl = 'nexusauth://auth/callback#access_token=test_access_jwt&refresh_token=test_refresh_token&expires_in=3600&token_type=bearer&type=bearer';
  const implicitParams = parseAuthParams(implicitUrl);
  assert.equal(implicitParams.access_token, 'test_access_jwt');
  assert.equal(implicitParams.refresh_token, 'test_refresh_token');

  const errorUrl = 'nexusauth://auth/callback?error=access_denied&error_description=User+denied+access';
  const errorParams = parseAuthParams(errorUrl);
  assert.equal(errorParams.error, 'access_denied');
  assert.equal(errorParams.error_description, 'User denied access');
});

// 5. AuthContext verification
runTest('AuthContext exports signInWithGoogle and handles session states', () => {
  const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.tsx');
  const code = fs.readFileSync(authContextPath, 'utf8');

  assert.ok(code.includes('signInWithGoogle'), 'AuthContext must export signInWithGoogle');
  assert.ok(code.includes('exchangeCodeForSession'), 'AuthContext must support PKCE exchangeCodeForSession');
  assert.ok(code.includes('setSession'), 'AuthContext must support setSession for token fragments');
  assert.ok(code.includes('WebBrowser.openAuthSessionAsync'), 'Must use WebBrowser.openAuthSessionAsync');
  assert.ok(code.includes('lastHandledUrlRef'), 'Must deduplicate handling of incoming callback URLs');
  assert.ok(code.includes('signInWithPhone'), 'Preserves phone login');
  assert.ok(code.includes('sendPasswordRecoveryOtp'), 'Preserves recovery OTP');
  assert.ok(code.includes('verifyRecoveryOtp'), 'Preserves verifyRecoveryOtp');
  assert.ok(code.includes('updatePassword'), 'Preserves updatePassword');
});

console.log('\n--- SUMMARY ---');
console.log(`Total: ${passedCount + failedCount}, Passed: ${passedCount}, Failed: ${failedCount}`);
if (failedCount > 0) process.exit(1);
