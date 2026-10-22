export const formatDateToLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDateStringToDate = (dateStr) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return new Date();
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0);
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'Not provided';
  return dateStr;
};

console.log('--- TEST SUITE: DATE OF BIRTH, VALIDATION & DEEP LINK PARSING ---');

const results = [];
function recordResult(testName, passed, details) {
  results.push({ testName, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName} - ${details}`);
}

// 1. Date of Birth Calendar Tests (Explicitly mandated by user: 27/09/2006, 01/01/2000, 31/12/1999)
const testDate1 = new Date(2006, 8, 27); // Month is 0-indexed: 8 is September
const strDate1 = formatDateToLocalDateString(testDate1);
recordResult(
  'DOB Test 1: 27/09/2006',
  strDate1 === '2006-09-27',
  `Expected "2006-09-27", got "${strDate1}"`
);

const testDate2 = new Date(2000, 0, 1); // Month 0 is January
const strDate2 = formatDateToLocalDateString(testDate2);
recordResult(
  'DOB Test 2: 01/01/2000',
  strDate2 === '2000-01-01',
  `Expected "2000-01-01", got "${strDate2}"`
);

const testDate3 = new Date(1999, 11, 31); // Month 11 is December
const strDate3 = formatDateToLocalDateString(testDate3);
recordResult(
  'DOB Test 3: 31/12/1999',
  strDate3 === '1999-12-31',
  `Expected "1999-12-31", got "${strDate3}"`
);

// Roundtrip parse and display
const roundtripDate = parseLocalDateStringToDate('2006-09-27');
const roundtripStr = formatDateToLocalDateString(roundtripDate);
recordResult(
  'DOB Roundtrip Preservation',
  roundtripStr === '2006-09-27',
  `Parsed and reformatted string matches exact input: "${roundtripStr}"`
);

// 2. Email Normalization & Validation Tests
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const validEmails = [
  'test@example.com',
  'user.name+tag@sub.domain.co',
  'maramnikhil456@gmail.com',
];
const allValidPassed = validEmails.every((e) => EMAIL_REGEX.test(e));
recordResult('Valid Email Recognition', allValidPassed, `All ${validEmails.length} valid email samples accepted`);

const invalidEmails = [
  '',
  'plainaddress',
  '@missingusername.com',
  'username@.com',
  'username@domain',
  'username@domain..com',
  'user name@domain.com',
];
const allInvalidRejected = invalidEmails.every((e) => !EMAIL_REGEX.test(e));
recordResult('Invalid Email Rejection', allInvalidRejected, `All ${invalidEmails.length} invalid email samples rejected`);

const rawInput = '  MaramNikhil456@Gmail.COM  ';
const normalized = rawInput.trim().toLowerCase();
recordResult(
  'Email Normalization',
  normalized === 'maramnikhil456@gmail.com',
  `Trimmed and converted to lowercase: "${normalized}"`
);

// 3. Deep link URL Parameter Parsing (Both query and hash fragment)
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
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const fragmentString = url.substring(hashIndex + 1);
    const fragmentParams = new URLSearchParams(fragmentString);
    fragmentParams.forEach((val, key) => {
      params[key] = val;
    });
  }
  return params;
};

const queryUrl = 'nexusauth://auth/callback?access_token=token123&refresh_token=ref456&type=recovery';
const parsedQuery = parseAuthParams(queryUrl);
recordResult(
  'Deep Link Query Parser',
  parsedQuery.type === 'recovery' && parsedQuery.access_token === 'token123',
  `Extracted type: "${parsedQuery.type}", access_token: "${parsedQuery.access_token}"`
);

const hashUrl = 'nexusauth://auth/callback#access_token=tokenABC&refresh_token=refDEF&type=recovery';
const parsedHash = parseAuthParams(hashUrl);
recordResult(
  'Deep Link Hash Fragment Parser',
  parsedHash.type === 'recovery' && parsedHash.access_token === 'tokenABC',
  `Extracted type: "${parsedHash.type}", access_token: "${parsedHash.access_token}"`
);

console.log('\n--- SUMMARY ---');
const allPassed = results.every((r) => r.passed);
console.log(`Total: ${results.length}, Passed: ${results.filter((r) => r.passed).length}, Failed: ${results.filter((r) => !r.passed).length}`);
process.exit(allPassed ? 0 : 1);
