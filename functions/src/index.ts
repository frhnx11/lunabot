import {onRequest} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import cors from "cors";

initializeApp();

const corsHandler = cors({origin: true});

// Define secrets
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

// Credit packages configuration
const CREDIT_PACKAGES: Record<string, {credits: number; amount: number}> = {
  mini: {credits: 30, amount: 5000}, // ₹50 in paise
  starter: {credits: 100, amount: 14900}, // ₹149 in paise
  popular: {credits: 250, amount: 34900}, // ₹349 in paise
  best_value: {credits: 450, amount: 59900}, // ₹599 in paise
};

// Create Razorpay order
export const createOrder = onRequest(
  {secrets: [razorpayKeyId, razorpayKeySecret]},
  (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const {packageId, userId} = req.body;

      if (!packageId || !userId) {
        res.status(400).json({error: "Missing packageId or userId"});
        return;
      }

      const packageInfo = CREDIT_PACKAGES[packageId];
      if (!packageInfo) {
        res.status(400).json({error: "Invalid package"});
        return;
      }

      const razorpay = new Razorpay({
        key_id: razorpayKeyId.value(),
        key_secret: razorpayKeySecret.value(),
      });

      const order = await razorpay.orders.create({
        amount: packageInfo.amount,
        currency: "INR",
        receipt: `${userId.slice(0, 20)}_${Date.now()}`,
        notes: {
          userId,
          packageId,
          credits: packageInfo.credits.toString(),
        },
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        credits: packageInfo.credits,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({error: "Failed to create order"});
    }
  });
});

// Verify payment and add credits
export const verifyPayment = onRequest(
  {secrets: [razorpayKeySecret]},
  (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        packageId,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id ||
          !razorpay_signature || !userId || !packageId) {
        res.status(400).json({error: "Missing required fields"});
        return;
      }

      const packageInfo = CREDIT_PACKAGES[packageId];
      if (!packageInfo) {
        res.status(400).json({error: "Invalid package"});
        return;
      }

      // Verify signature
      const generatedSignature = crypto
        .createHmac("sha256", razorpayKeySecret.value())
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        res.status(400).json({error: "Invalid signature"});
        return;
      }

      // Add credits to user
      const db = getFirestore();
      const userRef = db.doc(`users/${userId}`);
      await userRef.update({
        credits: FieldValue.increment(packageInfo.credits),
      });

      // Save transaction
      await db.collection("transactions").add({
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        packageId,
        credits: packageInfo.credits,
        amount: packageInfo.amount,
        status: "completed",
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        credits: packageInfo.credits,
        message: `Successfully added ${packageInfo.credits} credits`,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({error: "Failed to verify payment"});
    }
  });
});
