import assert from "node:assert/strict";
import {
  WEEK_RESOURCE_MAX_FILE_SIZE_BYTES,
  WEEK_RESOURCE_ALLOWED_MIME_TYPES,
} from "../src/types/types";
import { validateGoogleDriveUrl } from "../src/lib/weeks/validate-drive-url";
import {
  getResourceSubmissionState,
  hasValidResourceSubmission,
  isResourceAccepted,
  isRewardHalvedForResource,
  hasValidTaskSubmissionContent,
} from "../src/lib/weeks/resource-eligibility";

console.log("=================================================");
console.log("RUNNING NST WEEK RESOURCE OVERHAUL TEST SUITE");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// 1. FILE UPLOAD 1 MiB LIMIT & MIME TYPE CHECKS
// -----------------------------------------------------------------------------
console.log("--- Group 1: File Upload Limit & Constants ---");

test("Case 1 & 2: Exact 1 MiB limit boundary (1,048,576 bytes)", () => {
  assert.equal(WEEK_RESOURCE_MAX_FILE_SIZE_BYTES, 1024 * 1024);
  assert.equal(WEEK_RESOURCE_MAX_FILE_SIZE_BYTES, 1048576);

  const fileUnderLimit = { size: 1048575 };
  const fileExactLimit = { size: 1048576 };
  const fileOverLimit = { size: 1048577 };

  assert.equal(fileUnderLimit.size <= WEEK_RESOURCE_MAX_FILE_SIZE_BYTES, true);
  assert.equal(fileExactLimit.size <= WEEK_RESOURCE_MAX_FILE_SIZE_BYTES, true);
  assert.equal(fileOverLimit.size <= WEEK_RESOURCE_MAX_FILE_SIZE_BYTES, false);
});

test("Case 3 & 4: Rejects files larger than 1 MiB", () => {
  const hugeFile = { size: 2 * 1024 * 1024 }; // 2 MiB
  assert.equal(hugeFile.size <= WEEK_RESOURCE_MAX_FILE_SIZE_BYTES, false);
});

test("Allowed MIME types whitelist contains expected document/archive formats", () => {
  const allowed = new Set(WEEK_RESOURCE_ALLOWED_MIME_TYPES as readonly string[]);
  assert.ok(allowed.has("application/pdf"));
  assert.ok(allowed.has("application/zip"));
  assert.ok(allowed.has("application/x-zip-compressed"));
  assert.equal(allowed.has("application/x-msdownload"), false);
});

// -----------------------------------------------------------------------------
// 2. GOOGLE DRIVE LINK VALIDATION & SECURITY
// -----------------------------------------------------------------------------
console.log("\n--- Group 2: Google Drive Link Validation ---");

test("Case 10: Valid Google Drive sharing URL formats are accepted", () => {
  const validUrls = [
    "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing",
    "https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0",
    "https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    "https://docs.google.com/forms/d/e/1FAIpQLSc_Example/viewform",
  ];

  for (const url of validUrls) {
    const res = validateGoogleDriveUrl(url);
    assert.equal(res.valid, true, `Expected valid for: ${url}`);
    assert.ok(res.normalizedUrl);
    assert.ok(res.normalizedUrl.startsWith("https://"));
  }
});

test("Case 11: Empty, whitespace, or non-string input is rejected", () => {
  assert.equal(validateGoogleDriveUrl("").valid, false);
  assert.equal(validateGoogleDriveUrl("   ").valid, false);
  assert.equal(validateGoogleDriveUrl(null as any).valid, false);
  assert.equal(validateGoogleDriveUrl(undefined as any).valid, false);
});

test("Case 12: Malformed URL strings are safely rejected", () => {
  const malformed = ["not-a-url", "htp://broken", "https://", "https:///foo/bar"];
  for (const str of malformed) {
    const res = validateGoogleDriveUrl(str);
    assert.equal(res.valid, false, `Expected invalid for: ${str}`);
  }
});

test("Case 13: Unrelated domains/hosts are rejected", () => {
  const wrongHosts = [
    "https://dropbox.com/s/12345/file.zip",
    "https://onedrive.live.com/?id=123",
    "https://github.com/Ahmed-Youssef-404/nst-platform",
    "https://example.com/drive.google.com",
    "https://malicious-drive.google.com/file/d/123",
    "https://drive.google.com.attacker.com/file/d/123",
  ];

  for (const url of wrongHosts) {
    const res = validateGoogleDriveUrl(url);
    assert.equal(res.valid, false, `Expected reject for wrong host: ${url}`);
  }
});

test("Case 14: Unsafe schemes (http, javascript, data, file) are rejected", () => {
  const unsafe = [
    "http://drive.google.com/file/d/123",
    "javascript:alert(1)",
    "data:text/html,<html>alert(1)</html>",
    "file:///C:/Users/PoWeR/Documents/file.pdf",
    "vbscript:msgbox",
  ];

  for (const url of unsafe) {
    const res = validateGoogleDriveUrl(url);
    assert.equal(res.valid, false, `Expected reject for unsafe scheme: ${url}`);
  }
});

test("Normalizes URLs by trimming leading/trailing whitespace", () => {
  const raw = "   https://drive.google.com/file/d/12345/view?usp=sharing   ";
  const res = validateGoogleDriveUrl(raw);
  assert.equal(res.valid, true);
  assert.equal(res.normalizedUrl, "https://drive.google.com/file/d/12345/view?usp=sharing");
});

// -----------------------------------------------------------------------------
// 3. MUTUAL EXCLUSION & STATE INVARIANTS
// -----------------------------------------------------------------------------
console.log("\n--- Group 3: Mutual Exclusion & State Invariants ---");

test("Case 17: Valid file submission with no Drive URL resolves to VALID_FILE", () => {
  const fileSubmission = {
    type: "FILE" as const,
    fileUrl: "https://example-supabase.co/storage/v1/object/public/submissions/res.pdf",
    driveUrl: null,
    status: "PENDING" as const,
  };

  assert.equal(getResourceSubmissionState(fileSubmission).state, "VALID_FILE");
  assert.equal(hasValidResourceSubmission(fileSubmission), true);
});

test("Case 18: Valid Drive submission with no file reference resolves to VALID_DRIVE_LINK", () => {
  const driveSubmission = {
    type: "DRIVE_LINK" as const,
    fileUrl: null,
    driveUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
    status: "PENDING" as const,
  };

  assert.equal(getResourceSubmissionState(driveSubmission).state, "VALID_DRIVE_LINK");
  assert.equal(hasValidResourceSubmission(driveSubmission), true);
});

test("Case 22: Both fileUrl and driveUrl present is treated as INVALID", () => {
  const conflictingSubmission = {
    type: "FILE" as const,
    fileUrl: "https://example.com/file.pdf",
    driveUrl: "https://drive.google.com/file/d/123/view",
    status: "PENDING" as const,
  };

  assert.equal(getResourceSubmissionState(conflictingSubmission).state, "INVALID");
  assert.equal(hasValidResourceSubmission(conflictingSubmission), false);
});

test("Neither fileUrl nor driveUrl present is treated as NONE", () => {
  assert.equal(getResourceSubmissionState(null).state, "NONE");
  assert.equal(hasValidResourceSubmission(null), false);

  const emptyRecord = {
    type: "FILE" as const,
    fileUrl: null,
    driveUrl: null,
    status: "PENDING" as const,
  };
  assert.equal(getResourceSubmissionState(emptyRecord).state, "NONE");
  assert.equal(hasValidResourceSubmission(emptyRecord), false);
});

test("Legacy record with fileUrl and type: null is handled safely as VALID_FILE", () => {
  const legacyRecord = {
    type: null,
    fileUrl: "https://supabase.co/storage/v1/object/public/res.zip",
    driveUrl: null,
    status: "ACCEPTED" as const,
  };

  assert.equal(getResourceSubmissionState(legacyRecord).state, "VALID_FILE");
  assert.equal(hasValidResourceSubmission(legacyRecord), true);
});

// -----------------------------------------------------------------------------
// 4. WEEK LOCKING DUAL CONDITIONS
// -----------------------------------------------------------------------------
console.log("\n--- Group 4: Week Locking Dual Condition Enforcement ---");

test("hasValidTaskSubmissionContent correctly verifies non-empty student work across modes", () => {
  assert.equal(hasValidTaskSubmissionContent(null), false);
  assert.equal(hasValidTaskSubmissionContent(undefined), false);
  assert.equal(hasValidTaskSubmissionContent({ mode: "TEXT", textContent: "" }), false);
  assert.equal(hasValidTaskSubmissionContent({ mode: "TEXT", textContent: "   \n\t  " }), false);
  assert.equal(hasValidTaskSubmissionContent({ mode: "TEXT", textContent: "Solved via binary search algorithm." }), true);
  assert.equal(hasValidTaskSubmissionContent({ mode: "LINK", externalLink: "https://github.com/my-solution" }), true);
  assert.equal(hasValidTaskSubmissionContent({ mode: "LINK", externalLink: "" }), false);
  assert.equal(hasValidTaskSubmissionContent({ mode: "FILE", fileUrl: "https://storage.co/task.pdf" }), true);
  assert.equal(hasValidTaskSubmissionContent({ mode: "FILE", fileUrl: null }), false);
});

test("Case 23: No resource + all tasks solved -> BLOCKED", () => {
  const resource = null;
  const tasks = [{ id: "t1" }, { id: "t2" }];
  const submissions = [
    { taskId: "t1", mode: "TEXT", textContent: "code 1" },
    { taskId: "t2", mode: "LINK", externalLink: "https://github.com/solution" },
  ];

  const hasResource = hasValidResourceSubmission(resource);
  const allTasksSolved = tasks.every((t) => {
    const sub = submissions.find((s) => s.taskId === t.id);
    return hasValidTaskSubmissionContent(sub);
  });

  const canLock = hasResource && allTasksSolved;
  assert.equal(hasResource, false);
  assert.equal(allTasksSolved, true);
  assert.equal(canLock, false, "Should block lock when resource is missing");
});

test("Case 24: Valid resource + one unsolved task -> BLOCKED", () => {
  const resource = {
    type: "FILE" as const,
    fileUrl: "https://supabase.co/file.pdf",
    driveUrl: null,
    status: "PENDING" as const,
  };
  const tasks = [{ id: "t1" }, { id: "t2" }];
  const submissions = [
    { taskId: "t1", mode: "TEXT", textContent: "code 1" },
    // t2 missing
  ];

  const hasResource = hasValidResourceSubmission(resource);
  const allTasksSolved = tasks.every((t) => {
    const sub = submissions.find((s) => s.taskId === t.id);
    return hasValidTaskSubmissionContent(sub);
  });

  const canLock = hasResource && allTasksSolved;
  assert.equal(hasResource, true);
  assert.equal(allTasksSolved, false);
  assert.equal(canLock, false, "Should block lock when any task is unsolved");
});

test("Case 25: Valid file + all tasks solved -> ELIGIBLE", () => {
  const resource = {
    type: "FILE" as const,
    fileUrl: "https://supabase.co/file.pdf",
    driveUrl: null,
    status: "PENDING" as const,
  };
  const tasks = [{ id: "t1" }, { id: "t2" }];
  const submissions = [
    { taskId: "t1", mode: "TEXT", textContent: "code 1" },
    { taskId: "t2", mode: "LINK", externalLink: "https://github.com/my-code" },
  ];

  const hasResource = hasValidResourceSubmission(resource);
  const allTasksSolved = tasks.every((t) => {
    const sub = submissions.find((s) => s.taskId === t.id);
    return hasValidTaskSubmissionContent(sub);
  });

  const canLock = hasResource && allTasksSolved;
  assert.equal(canLock, true);
});

test("Case 26: Valid Drive link + all tasks solved -> ELIGIBLE", () => {
  const resource = {
    type: "DRIVE_LINK" as const,
    fileUrl: null,
    driveUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
    status: "PENDING" as const,
  };
  const tasks = [{ id: "t1" }, { id: "t2" }];
  const submissions = [
    { taskId: "t1", mode: "TEXT", textContent: "code 1" },
    { taskId: "t2", mode: "FILE", fileUrl: "https://storage.co/task2.pdf" },
  ];

  const hasResource = hasValidResourceSubmission(resource);
  const allTasksSolved = tasks.every((t) => {
    const sub = submissions.find((s) => s.taskId === t.id);
    return hasValidTaskSubmissionContent(sub);
  });

  const canLock = hasResource && allTasksSolved;
  assert.equal(canLock, true);
});

// -----------------------------------------------------------------------------
// 5. GRADING, HALVING & ST REWARD INVARIANCE
// -----------------------------------------------------------------------------
console.log("\n--- Group 5: Grading, Halving & ST Parity ---");

test("Case 33: ACCEPTED file and ACCEPTED Drive link produce identical reward outcome (no halving)", () => {
  const acceptedFile = {
    type: "FILE" as const,
    fileUrl: "https://supabase.co/file.pdf",
    driveUrl: null,
    status: "ACCEPTED" as const,
  };

  const acceptedDrive = {
    type: "DRIVE_LINK" as const,
    fileUrl: null,
    driveUrl: "https://drive.google.com/file/d/123/view",
    status: "ACCEPTED" as const,
  };

  assert.equal(isResourceAccepted(acceptedFile), true);
  assert.equal(isResourceAccepted(acceptedDrive), true);
  assert.equal(isRewardHalvedForResource(acceptedFile), false);
  assert.equal(isRewardHalvedForResource(acceptedDrive), false);
});

test("Case 34: PENDING file and PENDING Drive link produce identical halving behavior (halved = true)", () => {
  const pendingFile = {
    type: "FILE" as const,
    fileUrl: "https://supabase.co/file.pdf",
    driveUrl: null,
    status: "PENDING" as const,
  };

  const pendingDrive = {
    type: "DRIVE_LINK" as const,
    fileUrl: null,
    driveUrl: "https://drive.google.com/file/d/123/view",
    status: "PENDING" as const,
  };

  assert.equal(isResourceAccepted(pendingFile), false);
  assert.equal(isResourceAccepted(pendingDrive), false);
  assert.equal(isRewardHalvedForResource(pendingFile), true);
  assert.equal(isRewardHalvedForResource(pendingDrive), true);
});

test("Case 35: REJECTED file and REJECTED Drive link produce identical halving behavior (halved = true)", () => {
  const rejectedFile = {
    type: "FILE" as const,
    fileUrl: "https://supabase.co/file.pdf",
    driveUrl: null,
    status: "REJECTED" as const,
  };

  const rejectedDrive = {
    type: "DRIVE_LINK" as const,
    fileUrl: null,
    driveUrl: "https://drive.google.com/file/d/123/view",
    status: "REJECTED" as const,
  };

  assert.equal(isResourceAccepted(rejectedFile), false);
  assert.equal(isResourceAccepted(rejectedDrive), false);
  assert.equal(isRewardHalvedForResource(rejectedFile), true);
  assert.equal(isRewardHalvedForResource(rejectedDrive), true);
});

test("Case 36: Missing resource triggers reward halving (halved = true)", () => {
  assert.equal(isResourceAccepted(null), false);
  assert.equal(isRewardHalvedForResource(null), true);
});

test("Case 37: Positive rewards are halved (floor/round) while task penalties remain intact", () => {
  const basePositiveReward = 100;
  const taskPenalty = 20;

  // With accepted resource
  const isHalvedAccepted = isRewardHalvedForResource({
    type: "DRIVE_LINK" as const,
    fileUrl: null,
    driveUrl: "https://drive.google.com/file/d/123/view",
    status: "ACCEPTED" as const,
  });
  const positiveRewardAccepted = isHalvedAccepted ? Math.floor(basePositiveReward / 2) : basePositiveReward;
  const netRewardAccepted = positiveRewardAccepted - taskPenalty;
  assert.equal(positiveRewardAccepted, 100);
  assert.equal(netRewardAccepted, 80);

  // With unaccepted resource (pending or rejected or missing)
  const isHalvedPending = isRewardHalvedForResource({
    type: "DRIVE_LINK" as const,
    fileUrl: null,
    driveUrl: "https://drive.google.com/file/d/123/view",
    status: "PENDING" as const,
  });
  const positiveRewardPending = isHalvedPending ? Math.floor(basePositiveReward / 2) : basePositiveReward;
  const netRewardPending = positiveRewardPending - taskPenalty;
  assert.equal(positiveRewardPending, 50);
  assert.equal(netRewardPending, 30); // Penalty of 20 was NOT halved, exactly as required
});

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passedTests}/${totalTests} tests passed.`);
console.log("=================================================\n");
if (passedTests !== totalTests) {
  process.exit(1);
}
