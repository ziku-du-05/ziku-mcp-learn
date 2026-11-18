import "dotenv/config";

import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import session from "express-session";

import {
  createGoogleAuthorizationUrl,
  exchangeAuthorizationCode,
  isGoogleConnected,
  listCalendarEvents,
} from "./google-calendar.js";

import {
  chatWithCalendarAssistant,
} from "./ai-host.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "lax",

      // Local development-এ false।
      // Production HTTPS-এ true করুন।
      secure: false,
    },
  })
);

/**
 * Health-check route.
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Calendar backend is running",
  });
});

/**
 * Google connection status।
 */
app.get("/api/auth/status", async (req, res) => {
  const connected = await isGoogleConnected();

  res.json({
    connected,
  });
});

/**
 * Google OAuth flow শুরু করে।
 */
app.get("/auth/google", (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");

  // Callback-এর সময় CSRF protection-এর জন্য state compare করব।
  req.session.oauthState = state;

  const authorizationUrl =
    createGoogleAuthorizationUrl(state);

  res.redirect(authorizationUrl);
});

/**
 * Google OAuth callback।
 */
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).send(`Google OAuth error: ${error}`);
    }

    if (!code) {
      return res.status(400).send("Authorization code পাওয়া যায়নি।");
    }

    if (!state || state !== req.session.oauthState) {
      return res
        .status(400)
        .send("OAuth state mismatch. Request rejected.");
    }

    await exchangeAuthorizationCode(code);

    delete req.session.oauthState;

    res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    res.status(500).send("Google authentication failed.");
  }
});

/**
 * আগামী calendar events ফেরত দেয়।
 */
app.get("/api/calendar/events", async (req, res) => {
  try {
    const days = Math.min(
      Math.max(Number(req.query.days) || 30, 1),
      365
    );

    const events = await listCalendarEvents({
      days,
      maxResults: 100,
    });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Calendar events error:", error);

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * React AI chat endpoint।
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, timezone } = req.body;

    if (
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Message প্রয়োজন।",
      });
    }

    // অতিরিক্ত বড় prompt বন্ধ করা।
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message অনেক বড়।",
      });
    }

    const result = await chatWithCalendarAssistant({
      message: message.trim(),
      timezone:
        typeof timezone === "string"
          ? timezone
          : "Asia/Dhaka",
    });

    res.json({
      success: true,
      answer: result.answer,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "AI response failed.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});