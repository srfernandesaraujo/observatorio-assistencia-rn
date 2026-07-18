# Security Specification: Firebase Security Rules (TDD)

## 1. Data Invariants

1. **User Settings (`/settings/{userId}`)**:
   - A settings document must only be read and written by the authenticated user whose `uid` matches the `{userId}` path parameter.
   - Users are strictly forbidden from reading or writing other users' settings.

2. **Pharmacovigilance Incident Reports (`/pharmacovigilance/{reportId}`)**:
   - Any authenticated user with a verified email can list/read pharmacovigilance reports.
   - Any authenticated user can create a report, but the `createdBy` field MUST match the authenticated user's `uid`.
   - Modifying a report is restricted: Users can only modify/update their own reports, and only if the `status` is not terminal.
   - No user can delete a report unless they are an admin or the creator, and the status is still "Em Investigação" (not locked).
   - Validation schema checks are mandatory: limits on lengths of strings (`medicamento`, `lote`, `reacaoAdversa`, `unidadeNotificante`) must be strictly verified.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific JSON payloads designed to break the laws of Identity, Integrity, and State, which MUST be rejected (`PERMISSION_DENIED`) by the rules:

### Collection: `/settings/{userId}`
1. **The Settings Identity Spoofing Attack**: Authenticated User `A` attempts to read settings belonging to User `B`.
2. **The Settings Hijack Write Attack**: Authenticated User `A` attempts to write/override settings document `/settings/UserB` with their own settings.
3. **The Unauthenticated Settings Access**: An unauthenticated user attempts to read `/settings/UserA`.
4. **The Settings Schema Overrun**: User `A` attempts to write settings for themselves, but includes an injection payload or an extremely long URL (exceeding 256 chars).

### Collection: `/pharmacovigilance/{reportId}`
5. **The Creator Identity Impersonation**: User `A` attempts to create a report with `createdBy: "UserB"`.
6. **The Unauthenticated Report Submission**: An unauthenticated user attempts to write a new report to `/pharmacovigilance/some-random-id`.
7. **The Blanket Anonymous Read**: Unauthenticated guest attempts to read or query the `/pharmacovigilance` collection.
8. **The Ghost Field Poisoning**: A user attempts to create a report containing an unrequested field like `isApprovedByAdmin: true` or `vulnerabilidades: "nenhuma"`.
9. **The Volumetric Payload Exploit**: A user attempts to save a report where `reacaoAdversa` is a 1MB junk string (exceeding the 1000 character limit).
10. **The Temporal Fraud (Client-Defined Time)**: A user tries to set `data` (createdAt) to a future date instead of matching `request.time`.
11. **The Unauthorized Edit Attack**: User `A` attempts to update/edit a report created by User `B`.
12. **The State Escalation (Terminal Lock Bypass)**: A user attempts to change the `status` of an existing report from "Arquivado" or "Confirmado" to "Em Investigação" or modify text on a completed investigation.

---

## 3. The Test Runner Spec

We describe the test scenarios that our test runner would execute to verify that these "Dirty Dozen" payloads are safely rejected:

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("Observatório Farmacêutico Security Rules Tests", () => {
  // Setup unit testing environment
  // Executing the test cases against our drafted firestore.rules
});
```
