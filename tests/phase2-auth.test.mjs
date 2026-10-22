/**
 * NexusAuth Phase 2: Automated Verification & Security Test Suite
 * Tests authentication errors, profile isolation invariants, recovery codes, and key safety.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local without exposing values
function loadEnv() {
  const env = {};
  if (fs.existsSync('.env.local')) {
    fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    });
  }
  return env;
}

const env = loadEnv();
let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${detail ? '- ' + detail : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('NexusAuth Phase 2: Security & Authentication Test Suite');
  console.log('======================================================\n');

  // Test 1: Key Safety & Environment Isolation
  console.log('Test Group 1: Environment & Secret Key Safety');
  assert(!!env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL is configured');
  assert(!!env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is configured');
  assert(
    !Object.keys(env).some(k => k.startsWith('NEXT_PUBLIC_') && k.includes('SERVICE_ROLE')),
    'No service-role secret key is exposed in NEXT_PUBLIC_* variables'
  );

  // Scan src/app and src/components to ensure SUPABASE_SERVICE_ROLE_KEY is never imported
  const clientFiles = ['src/app', 'src/components', 'src/lib/supabase'];
  let serviceKeyLeakedInClient = false;
  function scanDir(itemPath) {
    if (!fs.existsSync(itemPath)) return;
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      for (const item of items) {
        scanDir(path.join(itemPath, item));
      }
    } else if (itemPath.endsWith('.ts') || itemPath.endsWith('.tsx') || itemPath.endsWith('.js')) {
      const content = fs.readFileSync(itemPath, 'utf8');
      if (content.includes('SUPABASE_SERVICE_ROLE_KEY') || content.includes('service_role')) {
        serviceKeyLeakedInClient = true;
      }
    }
  }
  clientFiles.forEach(scanDir);
  assert(!serviceKeyLeakedInClient, 'Client-side code contains zero references to privileged service keys');

  // Test 2: SQL Migration Invariants & Schema Checks
  console.log('\nTest Group 2: SQL Migration & Row Level Security Invariants');
  const migrationPath = 'supabase/migrations/20261022000000_create_profiles.sql';
  assert(fs.existsSync(migrationPath), 'SQL migration file exists at ' + migrationPath);

  if (fs.existsSync(migrationPath)) {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    assert(sql.includes('ENABLE ROW LEVEL SECURITY'), 'Row Level Security is enabled on public.profiles');
    assert(
      sql.includes('auth.uid() = id') || sql.includes('(SELECT auth.uid()) = id'),
      'Profiles table enforces auth.uid() = id for profile isolation'
    );
    assert(
      /email\s*=\s*(pg_catalog\.)?lower\(email\)/i.test(sql),
      'Profiles table contains lowercase email check constraint'
    );
    // Check that CREATE TABLE public.profiles does not define password or otp columns
    const tableDefMatch = sql.match(/CREATE TABLE[^(]+\(([\s\S]+?)\);/i);
    const tableCols = tableDefMatch ? tableDefMatch[1] : '';
    const hasPasswordCol = /^\s*(password|hash|otp|token)\s+/im.test(tableCols);
    assert(!hasPasswordCol, 'Profiles table schema does NOT declare password or OTP columns');
    assert(sql.includes('CREATE TRIGGER on_auth_user_created'), 'Automatic profile provisioning trigger on auth.users is defined');
  }

  // Test 3: Live Supabase Auth Error Handling
  console.log('\nTest Group 3: Live Supabase Auth API & Security Handshakes');
  const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // 3a. Invalid Login Credentials
  try {
    const { error: loginErr } = await anonClient.auth.signInWithPassword({
      email: 'nonexistent-user-test@nexusauth.internal',
      password: 'WrongPassword123!',
    });
    assert(
      !!loginErr && (loginErr.message.toLowerCase().includes('invalid login credentials') || loginErr.status === 400),
      'Invalid login credentials securely rejected with expected auth error'
    );
  } catch (e) {
    assert(false, 'Invalid login credentials test', e.message);
  }

  // 3b. Invalid Recovery OTP
  try {
    const { error: otpErr } = await anonClient.auth.verifyOtp({
      email: 'nonexistent-user-test@nexusauth.internal',
      token: '000000',
      type: 'recovery',
    });
    assert(
      !!otpErr && (otpErr.message.toLowerCase().includes('expired') || otpErr.message.toLowerCase().includes('invalid') || otpErr.status === 400),
      'Invalid recovery OTP token securely rejected with error'
    );
  } catch (e) {
    assert(false, 'Invalid recovery OTP test', e.message);
  }

  // 3c. OAuth Provider Status Detection
  try {
    const { data: oAuthData } = await anonClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/auth/callback' },
    });
    assert(!!oAuthData?.url, 'Google OAuth signInWithOAuth generates valid authorization URL');

    if (oAuthData?.url) {
      const res = await fetch(oAuthData.url);
      const text = await res.text();
      assert(
        res.status === 400 && (text.includes('not enabled') || text.includes('validation_failed')),
        'Unconfigured Google OAuth correctly identified as pending dashboard configuration'
      );
    }
  } catch (e) {
    assert(false, 'Google OAuth status check', e.message);
  }

  // Test 4: Next.js 16 Proxy Convention & Route Handlers
  console.log('\nTest Group 4: Next.js 16 Architecture & Route Handlers');
  assert(fs.existsSync('src/proxy.ts'), 'src/proxy.ts file convention implemented (Next.js 16 standard)');
  assert(!fs.existsSync('src/middleware.ts'), 'src/middleware.ts removed (no deprecated middleware warning)');
  assert(fs.existsSync('src/app/auth/callback/route.ts'), 'src/app/auth/callback/route.ts implemented for PKCE code exchange');
  assert(fs.existsSync('src/app/auth/signout/route.ts'), 'src/app/auth/signout/route.ts implemented for secure session sign-out');
  assert(fs.existsSync('src/app/profile/page.tsx'), 'src/app/profile/page.tsx protected route implemented');

  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
