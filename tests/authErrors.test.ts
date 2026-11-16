import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAuthError,
  formatWorkspaceInitError,
  getFirebaseAuthErrorCode,
  isFirestorePermissionError,
} from "../src/utils/authErrors.ts";

test("getFirebaseAuthErrorCode extracts code property or message token", () => {
  assert.equal(getFirebaseAuthErrorCode({ code: "auth/operation-not-allowed" }), "auth/operation-not-allowed");
  assert.equal(
    getFirebaseAuthErrorCode(new Error("Firebase: Error (auth/unauthorized-domain).")),
    "auth/unauthorized-domain",
  );
  assert.equal(getFirebaseAuthErrorCode(new Error("Unknown failure")), "");
});

test("formatAuthError includes domain name for unauthorized-domain", () => {
  const msg = formatAuthError({ code: "auth/unauthorized-domain" }, "app.example.com");
  assert.ok(msg.includes("app.example.com"));
  assert.ok(msg.includes("auth/unauthorized-domain"));
});

test("isFirestorePermissionError detects permission-denied and structured Firestore JSON errors", () => {
  assert.equal(isFirestorePermissionError({ code: "permission-denied" }), true);
  assert.equal(
    isFirestorePermissionError(
      new Error(
        JSON.stringify({
          error: "Missing or insufficient permissions.",
          operationType: "write",
          path: "workspaces/5o2B378J9QbwiGPU8eGZlfLCvo92",
        }),
      ),
    ),
    true,
  );
  assert.equal(isFirestorePermissionError(new Error("Network timeout")), false);
});

test("formatWorkspaceInitError explains Firestore permission denial cleanly", () => {
  const msg = formatWorkspaceInitError(new Error("Missing or insufficient permissions."));
  assert.ok(msg.includes("Firestore"));
  assert.ok(msg.includes("firestore.rules"));
});
