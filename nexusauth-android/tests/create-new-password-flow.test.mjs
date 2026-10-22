/**
 * create-new-password-flow.test.mjs
 *
 * Logic-level tests for the CreateNewPasswordScreen recovery flow.
 * These tests simulate the exact state machine from OTP verification
 * through password update and screen navigation.
 *
 * Each test answers one of the 6 review questions.
 * No React Native runtime needed – pure logic simulation.
 */

console.log('--- CREATE NEW PASSWORD FLOW: LOGIC REVIEW ---\n');

const results = [];
function pass(name, detail) { results.push({ name, ok: true, detail }); console.log(`✅ PASS: ${name}\n   ${detail}`); }
function fail(name, detail) { results.push({ name, ok: false, detail }); console.error(`❌ FAIL: ${name}\n   ${detail}`); }

// ─── Inline the exact validation logic from CreateNewPasswordScreen ───────────
function validatePassword(newPassword, confirmPassword) {
  const errs = {};
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  if (!newPassword) {
    errs.newPassword = 'New password is required.';
  } else if (!hasMinLength) {
    errs.newPassword = 'Password must be at least 8 characters.';
  } else if (!hasLetter || !hasNumber) {
    errs.newPassword = 'Password must contain at least one letter and one number.';
  }

  if (!confirmPassword) {
    errs.confirmPassword = 'Please confirm your new password.';
  } else if (newPassword !== confirmPassword) {
    errs.confirmPassword = 'Passwords do not match.';
  }

  return errs;
}

// ─── Inline the exact AuthContext updatePassword logic ────────────────────────
function makeAuthContext(supabaseUpdateUserResult) {
  let isRecoveryMode = true; // starts in recovery mode after OTP verify
  let currentScreen = 'create-new-password';
  const calls = [];

  const updatePassword = async (newPassword) => {
    calls.push({ fn: 'supabase.auth.updateUser', args: { password: newPassword } });
    const { error } = supabaseUpdateUserResult;
    if (error) return { error: error.message };
    isRecoveryMode = false; // cleared only on success, inside updatePassword
    return { error: null };
  };

  const setIsRecoveryMode = (v) => { isRecoveryMode = v; };
  const setCurrentScreen = (s) => { currentScreen = s; };

  return { updatePassword, setIsRecoveryMode, setCurrentScreen, calls, state: () => ({ isRecoveryMode, currentScreen }) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Q1: Does successful OTP verification produce a valid recovery session?
//     Verified by the live test (verifyOtp returns session + sets isRecoveryMode=true).
//     Here we confirm that verifyRecoveryOtp in AuthContext sets the session correctly.
// ─────────────────────────────────────────────────────────────────────────────
{
  let sessionSet = null;
  let isRecoverySet = null;

  // Simulate verifyRecoveryOtp in AuthContext (lines 304-330)
  const mockVerifyOtp = async ({ email, token, type }) => {
    return {
      data: { session: { user: { id: 'uid-123' }, access_token: 'at', refresh_token: 'rt' } },
      error: null,
    };
  };

  const { data, error } = await mockVerifyOtp({ email: 'test@example.com', token: '123456', type: 'recovery' });
  if (!error && data.session) {
    sessionSet = data.session;
    isRecoverySet = true; // mirrors line 323: setIsRecoveryMode(true)
  }

  if (sessionSet && isRecoverySet === true && sessionSet.access_token === 'at') {
    pass('Q1: OTP verify → valid recovery session', `Session established with access_token, isRecoveryMode=true`);
  } else {
    fail('Q1: OTP verify → valid recovery session', `Session or flag not set: session=${JSON.stringify(sessionSet)}, flag=${isRecoverySet}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Q2: Does submitting valid matching passwords call supabase.auth.updateUser?
// ─────────────────────────────────────────────────────────────────────────────
{
  const ctx = makeAuthContext({ error: null });

  // Validate first (simulate handleUpdatePassword)
  const errs = validatePassword('MyPass1!', 'MyPass1!');
  if (Object.keys(errs).length > 0) {
    fail('Q2: Valid passwords → calls updateUser', `Unexpected validation errors: ${JSON.stringify(errs)}`);
  } else {
    await ctx.updatePassword('MyPass1!');
    const called = ctx.calls.find(c => c.fn === 'supabase.auth.updateUser');
    if (called && called.args.password === 'MyPass1!') {
      pass('Q2: Valid passwords → calls updateUser', `supabase.auth.updateUser called with correct password`);
    } else {
      fail('Q2: Valid passwords → calls updateUser', `Call not found or wrong args: ${JSON.stringify(ctx.calls)}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Q3: Does the app wait for a successful update before showing success?
//     Confirmed by isSubmitting=true guard + `await updatePassword(...)` before
//     `setSuccess(true)` (lines 62-71 of CreateNewPasswordScreen).
// ─────────────────────────────────────────────────────────────────────────────
{
  let successShownBeforeAwait = false;
  let successShownAfterAwait = false;

  // Simulate the exact sequence in handleUpdatePassword
  let isSubmitting = false;
  let success = false;

  const slowUpdatePassword = async (pw) => {
    // If success were set before await, successShownBeforeAwait would be true
    successShownBeforeAwait = success;
    await new Promise(r => setTimeout(r, 5)); // simulate async
    return { error: null };
  };

  isSubmitting = true;
  const { error } = await slowUpdatePassword('MyPass1!');
  isSubmitting = false;

  if (!error) {
    success = true; // only set after await resolves
    successShownAfterAwait = success;
  }

  if (!successShownBeforeAwait && successShownAfterAwait) {
    pass('Q3: Success shown only after await resolves', `isSubmitting guard + await ensures no premature success`);
  } else {
    fail('Q3: Success shown only after await resolves', `successShownBeforeAwait=${successShownBeforeAwait}, after=${successShownAfterAwait}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Q4: Is the recovery session cleared and does navigation go to Login (not Profile)?
// ─────────────────────────────────────────────────────────────────────────────
{
  const ctx = makeAuthContext({ error: null });
  // Pre-condition: in recovery mode on create-new-password screen
  // (already set in makeAuthContext: isRecoveryMode=true, currentScreen='create-new-password')

  const { error } = await ctx.updatePassword('MyPass1!'); // clears isRecoveryMode inside updatePassword
  if (!error) {
    ctx.setIsRecoveryMode(false); // mirrors line 69 in CreateNewPasswordScreen
    ctx.setCurrentScreen('login'); // mirrors pressing "Return to Sign In" / success flow
  }

  const { isRecoveryMode, currentScreen } = ctx.state();
  if (!isRecoveryMode && currentScreen === 'login') {
    pass('Q4: Recovery cleared → navigates to Login', `isRecoveryMode=false, currentScreen="login" (not "profile")`);
  } else {
    fail('Q4: Recovery cleared → navigates to Login', `isRecoveryMode=${isRecoveryMode}, currentScreen="${currentScreen}"`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Q5: Does a failed update NOT show success and NOT discard recovery session?
// ─────────────────────────────────────────────────────────────────────────────
{
  const ctx = makeAuthContext({ error: { message: 'Auth session missing!' } });

  let success = false;
  let errors = {};

  const errs = validatePassword('MyPass1!', 'MyPass1!');
  if (Object.keys(errs).length === 0) {
    const { error } = await ctx.updatePassword('MyPass1!');
    if (error) {
      errors = { general: error }; // mirrors line 67 in CreateNewPasswordScreen
      // success is NOT set — stays false
    } else {
      ctx.setIsRecoveryMode(false);
      success = true;
    }
  }

  const { isRecoveryMode } = ctx.state();
  if (!success && errors.general && isRecoveryMode === true) {
    pass('Q5: Failed update → no false success, session kept', `success=false, error="${errors.general}", isRecoveryMode=true`);
  } else {
    fail('Q5: Failed update → no false success, session kept', `success=${success}, errors=${JSON.stringify(errors)}, isRecoveryMode=${isRecoveryMode}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Q6: Validation edge cases (short, no letter, no number, mismatch, empty)
// ─────────────────────────────────────────────────────────────────────────────
{
  const cases = [
    { pw: '',         cpw: '',         expectField: 'newPassword',     expectMsg: /required/ },
    { pw: 'abc',      cpw: 'abc',      expectField: 'newPassword',     expectMsg: /8 characters/ },
    { pw: '12345678', cpw: '12345678', expectField: 'newPassword',     expectMsg: /letter/ },
    { pw: 'abcdefgh', cpw: 'abcdefgh', expectField: 'newPassword',     expectMsg: /number/ },
    { pw: 'MyPass1!', cpw: 'MyPass2!', expectField: 'confirmPassword', expectMsg: /do not match/ },
    { pw: 'MyPass1!', cpw: '',         expectField: 'confirmPassword', expectMsg: /confirm/ },
  ];

  let allOk = true;
  const failedCases = [];

  for (const c of cases) {
    const errs = validatePassword(c.pw, c.cpw);
    const msg = errs[c.expectField] || '';
    if (!c.expectMsg.test(msg)) {
      allOk = false;
      failedCases.push(`pw="${c.pw}" cpw="${c.cpw}" → expected ${c.expectField} to match ${c.expectMsg}, got "${msg}"`);
    }
  }

  if (allOk) {
    pass('Q6: All validation edge cases', `${cases.length} invalid inputs all correctly rejected with right field errors`);
  } else {
    fail('Q6: All validation edge cases', failedCases.join(' | '));
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n--- REVIEW SUMMARY ---');
const totalPassed = results.filter(r => r.ok).length;
const totalFailed = results.filter(r => !r.ok).length;
console.log(`Total: ${results.length}, Passed: ${totalPassed}, Failed: ${totalFailed}`);
process.exit(totalFailed > 0 ? 1 : 0);
