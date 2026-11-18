import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

// Single-user demo-এর Google token এখানে রাখা হবে।
const TOKEN_PATH = path.resolve(process.cwd(), "token.json");

const CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

/**
 * নতুন OAuth2 client তৈরি করে।
 */
function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * token.json file read করে।
 */
async function readSavedTokens() {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * নতুন tokens পুরোনো tokens-এর সঙ্গে merge করে save করে।
 *
 * Google সব authorization response-এ refresh_token নাও দিতে পারে।
 * তাই পুরোনো refresh_token preserve করা হচ্ছে।
 */
export async function saveTokens(newTokens) {
  const oldTokens = (await readSavedTokens()) ?? {};

  const mergedTokens = {
    ...oldTokens,
    ...newTokens,
  };

  await fs.writeFile(
    TOKEN_PATH,
    JSON.stringify(mergedTokens, null, 2),
    "utf8"
  );
}

/**
 * Google authorization URL তৈরি করে।
 */
export function createGoogleAuthorizationUrl(state) {
  const oauth2Client = createOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account consent",
    include_granted_scopes: true,
    scope: [CALENDAR_SCOPE],
    state,
  });
}

/**
 * Google callback-এর authorization code token-এ exchange করে।
 */
export async function exchangeAuthorizationCode(code) {
  const oauth2Client = createOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  // A new authorization may belong to a different account.
  await fs.writeFile(
    TOKEN_PATH,
    JSON.stringify(tokens, null, 2),
    "utf8"
  );

  return tokens;
}

/**
 * Saved credentials সহ authorized OAuth client ফেরত দেয়।
 */
async function getAuthorizedClient() {
  const savedTokens = await readSavedTokens();

  if (!savedTokens) {
    throw new Error(
      "Google Calendar connected নয়। প্রথমে Google account connect করুন।"
    );
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(savedTokens);

  // Google client token refresh করলে updated token save করা হবে।
  oauth2Client.on("tokens", async (newTokens) => {
    try {
      await saveTokens(newTokens);
    } catch (error) {
      console.error("Updated Google token save failed:", error);
    }
  });

  return oauth2Client;
}

/**
 * Google account আগে connect করা হয়েছে কি না।
 */
export async function isGoogleConnected() {
  return Boolean(await readSavedTokens());
}

/**
 * Primary calendar-এর events list করে।
 */
export async function listCalendarEvents({
  days = 30,
  maxResults = 50,
} = {}) {
  const auth = await getAuthorizedClient();

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const now = new Date();

  const endDate = new Date(
    now.getTime() + days * 24 * 60 * 60 * 1000
  );

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: endDate.toISOString(),
    showDeleted: false,

    // Recurring events আলাদা instance হিসেবে expand করে।
    singleEvents: true,

    // start time অনুযায়ী ascending order।
    orderBy: "startTime",

    maxResults,
  });

  const events = response.data.items ?? [];

  // Frontend এবং MCP-কে শুধু প্রয়োজনীয় data দেওয়া হচ্ছে।
  return events.map((event) => ({
    id: event.id,
    title: event.summary ?? "Untitled event",
    description: event.description ?? "",
    location: event.location ?? "",
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    htmlLink: event.htmlLink ?? null,
    status: event.status ?? null,
  }));
}