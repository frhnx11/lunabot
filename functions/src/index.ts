import {onRequest} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import cors from "cors";

initializeApp();

const corsHandler = cors({origin: true});

// Define secrets
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const deepinfraApiKey = defineSecret("DEEPINFRA_API_KEY");
const inworldApiKey = defineSecret("INWORLD_API_KEY");

// Helper to verify Firebase auth token
async function verifyAuthToken(req: {headers: {authorization?: string}}) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }
  const token = authHeader.split("Bearer ")[1];
  return await getAuth().verifyIdToken(token);
}

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

// Chat function - proxies DeepInfra API
export const chat = onRequest(
  {secrets: [deepinfraApiKey]},
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      try {
        // Verify user is authenticated
        await verifyAuthToken(req);

        const {message, history, systemPrompt} = req.body;

        if (!message || !systemPrompt) {
          res.status(400).json({error: "Missing message or systemPrompt"});
          return;
        }

        const messages = [
          {role: "system", content: systemPrompt},
          ...(history || []).map((msg: {role: string; content: string}) => ({
            role: msg.role,
            content: msg.content,
          })),
          {role: "user", content: message},
        ];

        const response = await fetch(
          "https://api.deepinfra.com/v1/openai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${deepinfraApiKey.value()}`,
            },
            body: JSON.stringify({
              model: "cognitivecomputations/dolphin-2.6-mixtral-8x7b",
              messages,
              max_tokens: 150,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`DeepInfra API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";

        res.json({text: text || "Hmm, I'm not sure what to say to that."});
      } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({error: "Failed to get chat response"});
      }
    });
  }
);

// TTS function - proxies Inworld API
export const tts = onRequest(
  {secrets: [inworldApiKey]},
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      try {
        // Verify user is authenticated
        await verifyAuthToken(req);

        const {text, voiceId} = req.body;

        if (!text) {
          res.status(400).json({error: "Missing text"});
          return;
        }

        const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${inworldApiKey.value()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            voiceId: voiceId || "Ashley",
            modelId: "inworld-tts-1",
            timestampType: "CHARACTER",
            outputFormat: "mp3",
            audioConfig: {
              speakingRate: 0.9,
              temperature: 1.1,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Inworld API error: ${response.status}`);
        }

        const data = await response.json();

        res.json({
          audioContent: data.audioContent,
          timestampInfo: data.timestampInfo,
        });
      } catch (error) {
        console.error("TTS error:", error);
        res.status(500).json({error: "Failed to generate speech"});
      }
    });
  }
);
