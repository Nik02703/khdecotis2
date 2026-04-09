import Razorpay from "razorpay";
import crypto from "crypto";

// CREATE ORDER
export const createRazorpayOrder = async ({ amount, orderId }) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // rupees to paise, must be integer
      currency: "INR",
      receipt: `receipt_${orderId}`, // your internal order ID
      notes: {
        orderId: orderId.toString(),
      },
    };

    console.log("[Razorpay] Creating order:", options);

    const order = await razorpay.orders.create(options);

    console.log("[Razorpay] Order created:", JSON.stringify(order, null, 2));

    return {
      success: true,
      razorpayOrderId: order.id, // e.g. order_XXXXXXXXXX
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error("[Razorpay] ❌ Create order failed:", error);
    throw new Error(error.message || "Razorpay order creation failed");
  }
};

// VERIFY PAYMENT SIGNATURE
// Call this after frontend sends back payment details
export const verifyRazorpayPayment = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  try {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expected === razorpaySignature;

    console.log("[Razorpay] Signature valid:", isValid);
    return isValid;
  } catch (error) {
    console.error("[Razorpay] ❌ Signature verification failed:", error);
    return false;
  }
};
