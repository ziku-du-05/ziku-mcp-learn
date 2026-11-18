import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { google } from "googleapis";

test("Google account switching", async (t) => {
  const originalDirectory = process.cwd();
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "calendar-account-test-")
  );

  t.after(async () => {
    process.chdir(originalDirectory);
    await fs.rm(directory, { recursive: true, force: true });
  });
  process.chdir(directory);

  const {
    createGoogleAuthorizationUrl,
    exchangeAuthorizationCode,
    saveTokens,
  } = await import("./google-calendar.js");
  const tokenPath = path.join(directory, "token.json");
  const oldTokens = {
    access_token: "old-access",
    refresh_token: "old-refresh",
  };
  const readTokens = async () =>
    JSON.parse(await fs.readFile(tokenPath, "utf8"));

  await t.test("OAuth requests account selection and consent", () => {
    const url = new URL(createGoogleAuthorizationUrl("test-state"));
    assert.equal(url.searchParams.get("prompt"), "select_account consent");
    assert.equal(url.searchParams.get("state"), "test-state");
    assert.equal(url.searchParams.get("access_type"), "offline");
  });

  await t.test("new authorization never inherits old account tokens", async (t) => {
    await fs.writeFile(tokenPath, JSON.stringify(oldTokens));
    const newTokens = { access_token: "new-access" };
    t.mock.method(google.auth.OAuth2.prototype, "getToken", async () => ({
      tokens: newTokens,
    }));

    await exchangeAuthorizationCode("new-account-code");

    assert.deepEqual(await readTokens(), newTokens);
  });

  await t.test("failed authorization preserves the connected account", async (t) => {
    await fs.writeFile(tokenPath, JSON.stringify(oldTokens));
    t.mock.method(google.auth.OAuth2.prototype, "getToken", async () => {
      throw new Error("Authorization failed");
    });

    await assert.rejects(
      exchangeAuthorizationCode("invalid-code"),
      /Authorization failed/
    );
    assert.deepEqual(await readTokens(), oldTokens);
  });

  await t.test("token refresh still preserves the same account refresh token", async () => {
    await fs.writeFile(tokenPath, JSON.stringify(oldTokens));

    await saveTokens({ access_token: "refreshed-access" });

    assert.deepEqual(await readTokens(), {
      access_token: "refreshed-access",
      refresh_token: "old-refresh",
    });
  });
});
