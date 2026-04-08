const crypto = require('crypto');

const runTest = async (merchantId, saltKey, baseUrl) => {
  const saltIndex = "1";

  const payload = {
    merchantId: merchantId,
    merchantTransactionId: "TESTMERCHANT" + Date.now(),
    merchantUserId: `MU-TEST`,
    amount: 100 * 100,
    redirectUrl: "http://localhost:3000",
    redirectMode: 'POST',
    callbackUrl: "http://localhost:3000",
    mobileNumber: '9999999999',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const stringToHash = base64Payload + '/pg/v1/pay' + saltKey;
  const checksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + saltIndex;

  const fullUrl = `${baseUrl}/pg/v1/pay`;
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({ request: base64Payload })
    });
    const data = await response.json();
    return { url: baseUrl, key: saltKey, data };
  } catch (e) {
    return { url: baseUrl, key: saltKey, error: e.message };
  }
}

async function main() {
  const m = "M22J0RNBB7A8V_2604032335";
  const keys = [
    "MjE4NjE2ZDEtOWUwMC00ZWJiLWIzOGQtN2ExMGZkZWMwNDM2",
    "218616d1-9e00-4ebb-b38d-7a10fdec0436"
  ];
  const urls = [
    "https://api-preprod.phonepe.com/apis/hermes",
    "https://api-preprod.phonepe.com/apis/pg-sandbox"
  ];

  for (const url of urls) {
    for (const key of keys) {
      const res = await runTest(m, key, url);
      console.log(`URL: ${url}`);
      console.log(`KEY: ${key.substring(0, 15)}...`);
      console.log(`RES: ${res.data ? res.data.code : res.error}\n`);
    }
  }
}

main();
