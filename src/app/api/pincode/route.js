import { NextResponse } from 'next/server';

/**
 * Normalizes state and district names for accurate fuzzy matching.
 * Handles common variations (e.g. "Bengaluru Urban" vs "Bangalore", "Vadodara" vs "Baroda", "Gurugram" vs "Gurgaon").
 */
function normalizeName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\b(district|city|urban|rural|division|suburban|metro)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Helper to check if user entered district/state matches API results.
 */
function isMatchingLocation(userLoc, apiLocs) {
  if (!userLoc) return true; // Skip check if user hasn't selected yet
  const normUser = normalizeName(userLoc);
  if (!normUser) return true;

  for (const loc of apiLocs) {
    const normApi = normalizeName(loc);
    if (normApi === normUser || normApi.includes(normUser) || normUser.includes(normApi)) {
      return true;
    }
  }

  // Handle known aliases
  const aliases = {
    'bengaluru': ['bangalore', 'bengaluruurban', 'bengalururural'],
    'bangalore': ['bengaluru', 'bengaluruurban', 'bengalururural'],
    'gurugram': ['gurgaon'],
    'gurgaon': ['gurugram'],
    'mumbai': ['mumbaicity', 'mumbaisuburban', 'bombay'],
    'bombay': ['mumbai', 'mumbaicity', 'mumbaisuburban'],
    'vadodara': ['baroda'],
    'baroda': ['vadodara'],
    'prayagraj': ['allahabad'],
    'allahabad': ['prayagraj'],
    'ayodhya': ['faizabad'],
    'faizabad': ['ayodhya'],
    'kolkata': ['calcutta'],
    'calcutta': ['kolkata'],
    'chennai': ['madras'],
    'madras': ['chennai']
  };

  for (const [key, aliasList] of Object.entries(aliases)) {
    if (normUser === key || aliasList.includes(normUser)) {
      for (const loc of apiLocs) {
        const normApi = normalizeName(loc);
        if (normApi === key || aliasList.includes(normApi)) {
          return true;
        }
      }
    }
  }

  return false;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userState = searchParams.get('state') || '';
    const userDistrict = searchParams.get('district') || '';

    // 1. PIN code must be exactly 6 numeric digits
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { valid: false, reason: 'INVALID_FORMAT', message: 'PIN code must be exactly 6 numeric digits.' },
        { status: 400 }
      );
    }

    // 2. Fetch official India Post API with 6-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let res;
    try {
      res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'KHD-Store-PIN-Verifier/1.0' }
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.error('India Post API error:', fetchErr);
      return NextResponse.json(
        { valid: false, reason: 'API_TIMEOUT', message: 'PIN code verification service timed out. Please try again.' },
        { status: 504 }
      );
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { valid: false, reason: 'API_ERROR', message: 'Failed to connect to PIN code verification service.' },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || data[0].Status !== 'Success' || !Array.isArray(data[0].PostOffice) || data[0].PostOffice.length === 0) {
      return NextResponse.json({
        valid: false,
        reason: 'NOT_FOUND',
        message: 'Invalid PIN code.'
      });
    }

    const postOffices = data[0].PostOffice;
    const apiDistricts = Array.from(new Set(postOffices.map(po => po.District).filter(Boolean)));
    const apiStates = Array.from(new Set(postOffices.map(po => po.State).filter(Boolean)));

    const primaryDistrict = apiDistricts[0] || '';
    const primaryState = apiStates[0] || '';

    // 3. Verify State match if user selected a state
    if (userState) {
      const stateMatches = isMatchingLocation(userState, apiStates);
      if (!stateMatches) {
        return NextResponse.json({
          valid: false,
          reason: 'STATE_MISMATCH',
          apiState: primaryState,
          apiDistrict: primaryDistrict,
          message: `PIN code ${code} belongs to ${primaryState} state, not ${userState}.`
        });
      }
    }

    // 4. Verify District match if user selected a district
    if (userDistrict) {
      const districtMatches = isMatchingLocation(userDistrict, apiDistricts);
      if (!districtMatches) {
        return NextResponse.json({
          valid: false,
          reason: 'DISTRICT_MISMATCH',
          apiState: primaryState,
          apiDistrict: primaryDistrict,
          message: `PIN code ${code} belongs to ${primaryDistrict} district, not ${userDistrict}.`
        });
      }
    }

    // 5. Everything matches cleanly!
    return NextResponse.json({
      valid: true,
      reason: 'VERIFIED',
      code,
      apiState: primaryState,
      apiDistrict: primaryDistrict,
      allDistricts: apiDistricts,
      allStates: apiStates,
      message: '✓ PIN code verified'
    });

  } catch (err) {
    console.error('Pincode route error:', err);
    return NextResponse.json(
      { valid: false, reason: 'SERVER_ERROR', message: 'Error verifying PIN code.' },
      { status: 500 }
    );
  }
}
