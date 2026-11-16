# Security Specification & Hardening Audit — NASQO Pro

## 1. Data Invariants
1. Every document lives under `/workspaces/{workspaceId}` where `workspaceId == request.auth.uid` and `ownerId == request.auth.uid`.
2. Unauthenticated users or users with `email_verified != true` cannot read, list, create, update, or delete any document.
3. No document may introduce unknown fields (`hasAll` + `hasOnly` on create; `affectedKeys().hasOnly(...)` on update).
4. All document IDs (`workspaceId`, `accountId`, `entryId`, `warehouseId`, `itemId`) must pass `isValidId()` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
5. `ownerId` and `createdAt` are immutable after creation; `createdAt` and `updatedAt` are strictly enforced against `request.time`.
6. Every subcollection `get`, `create`, `update`, and `delete` verifies ownership on the parent `/workspaces/{workspaceId}` document via `get()`. Every `allow list` validates `resource.data.ownerId == request.auth.uid` without `get()`/`exists()` calls.
7. All strings enforce explicit `.size()` upper bounds matching `firebase-blueprint.json`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Cross-Tenant Read**: User B (`uid_b`) tries `get` on `/workspaces/uid_a/accounts/acc_1`. Denied (`request.auth.uid == workspaceId` fails).
2. **Identity Spoofing on Create**: User B tries creating `/workspaces/uid_b/accounts/acc_1` with `ownerId: "uid_a"`. Denied (`data.ownerId == request.auth.uid` fails).
3. **Ghost / Shadow Field Injection**: User A creates an account with extra field `isAdmin: true`. Denied (`keys().hasOnly(...)` fails).
4. **Client Timestamp Forgery**: User A creates a ledger entry with `createdAt: "2020-01-01T00:00:00Z"`. Denied (`incoming().createdAt == request.time` fails).
5. **Immutable Field Mutation**: User A updates an account trying to change `createdAt` or `ownerId`. Denied (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`).
6. **Unverified Email Access**: Signed-in user with `email_verified: false` tries reading or writing a workspace. Denied (`isVerified()` fails).
7. **ID Poisoning**: User A tries creating `/workspaces/uid_a/ledger/bad..id$123` or 500-char ID. Denied (`isValidId()` fails).
8. **Unbounded String DoS**: User A submits `details` of 2,000 characters (> 600 limit) in a ledger entry. Denied (`data.details.size() <= 600` fails).
9. **Invalid Enum Injection**: User A submits `category: "superadmin"` or `direction: "other"` on account/ledger create. Denied (`in [...]` enum check fails).
10. **Type Poisoning on Update**: User A updates `creditLimit` on an account with a string `"1000000"` instead of a number. Denied (`isValidAccount(incoming())` runs on update).
11. **Missing Parent Workspace (Orphan Record)**: User A tries creating `/workspaces/uid_a/warehouses/wh_1` before `/workspaces/uid_a` exists. Denied (`isWorkspaceOwner(workspaceId)` `exists()` + `get()` fails).
12. **Blanket Collection Group / Unknown Path Access**: Signed-in user attempts read/write at `/admin/config` or `/users/uid_a`. Denied by global default-deny catch-all rule.
