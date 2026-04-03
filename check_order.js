const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://harmsdesigne:x8A7wzU1q2b5XFw9@cluster0.zobv6.mongodb.net/KHD?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(async () => {
    const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const latestOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5).lean();
    console.log("=== LATEST 5 ORDERS ===");
    latestOrders.forEach(o => {
      console.log(`ID: ${o.orderId} | Method: ${o.paymentMethod} | Status: ${o.status} | Tracking: ${o.trackingStatus} | Shiprocket ID: ${o.shiprocketOrderId} | AWB: ${o.awbCode}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
