---
name: verify
description: Use when claiming work is done, before committing, after fixing bugs, or when asked to verify. Run each changed repository's bin/verify and provide its fresh local evidence block.
---

# Verify

1. In every changed repository, run `bin/verify` and let it select the focused checks for the current diff.
2. Include the complete `THOVEN_VERIFY_BEGIN` block, including its single-line JSON and `THOVEN_VERIFY_END`, for each changed repository.
3. If any row fails, fix the cause, rerun `bin/verify`, and replace the old block with the fresh result.
