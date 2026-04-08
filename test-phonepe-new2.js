import crypto from 'crypto';

const runTest = async (merchantId, baseUrl) => {
  const saltKey = "218616d1-9e00-4ebb-b38d-7a10fdec0436";
  const saltIndex = "1";

  const payload = {
    merchantId: merchantId,
    merchantTransactionId: "TEST123456",
    merchantUserId: `MU-TEST123456`,
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
  console.log("Testing:", baseUrl, "with config:", merchantId);
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
    console.log("Result:", data);
  } catch (e) {
    console.error("fetch failed", e);
  }
}

runTest("M22J0RNBB7A8V_2604032335", "https://api-preprod.phonepe.com/apis/hermes")
  .then(() => test2());

function test2() {
  return runTest("M22J0RNBB7A8V_2604032335", "https://api-preprod.phonepe.com/apis/pg-sandbox");
}
