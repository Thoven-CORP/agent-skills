---
name: rspec-map
description: Maps any source file path to its correct RSpec spec file path. Use whenever you need to run, reference, or write a spec for a source file. Knows Thoven's spec directory conventions.
user-invocable: false
---

# RSpec File Path Mapping — Thoven Backend

Use this skill to translate any source file path to its corresponding RSpec spec file path before running, referencing, or writing specs.

## Source → Spec Mapping Table

| Source File | Spec File |
|---|---|
| `app/models/foo.rb` | `spec/models/foo_spec.rb` |
| `app/services/foo_service.rb` | `spec/services/foo_service_spec.rb` |
| `app/controllers/api/v1/foo_controller.rb` | `spec/requests/api/v1/foo_spec.rb` |
| `app/jobs/foo_job.rb` | `spec/jobs/foo_job_spec.rb` |
| `app/mailers/foo_mailer.rb` | `spec/mailers/foo_mailer_spec.rb` |
| `app/serializers/foo_serializer.rb` | `spec/serializers/foo_serializer_spec.rb` |
| `app/channels/foo_channel.rb` | `spec/channels/foo_channel_spec.rb` |
| `app/observers/foo_observer.rb` | `spec/observers/foo_observer_spec.rb` |

## Additional Spec Directories in This Project

Beyond the standard directories above, Thoven's `spec/` also contains:

| Directory | Purpose |
|---|---|
| `spec/analytics/` | Analytics query and materialized view specs |
| `spec/db/` | Database-level specs (constraints, extensions) |
| `spec/factories/` | FactoryBot factory definitions (not runnable specs) |
| `spec/fixtures/` | Test fixture files |
| `spec/helpers/` | View/controller helper specs |
| `spec/integration/` | Cross-layer integration specs |
| `spec/security/` | Security and authorization specs |
| `spec/support/` | Shared examples, helpers, config (not runnable specs) |
| `spec/tasks/` | Rake task specs |

---

## CRITICAL: Controllers Use REQUEST Specs, Not Controller Specs

> This is the most common mapping mistake. Always apply this rule for controller files.

- Source: `app/controllers/api/v1/bookings_controller.rb`
- Spec: `spec/requests/api/v1/bookings_spec.rb`

Three things happen when mapping a controller to its spec:
1. The path prefix changes from `app/controllers/` to `spec/requests/`
2. The `_controller` suffix is **DROPPED** from the filename
3. The spec lives under `spec/requests/`, NOT `spec/controllers/`

**NEVER use `spec/controllers/` — that directory does not exist in this project.**

---

## Run Commands

All commands run from `/Users/andresmartinez/thoven/backend`.

```bash
# Standard — run a full spec file
bundle exec rspec spec/path/to/file_spec.rb

# Line-targeted — run a single example
bundle exec rspec spec/path/to/file_spec.rb:42

# With documentation format — verbose output
bundle exec rspec spec/path --format documentation

# Full suite
bundle exec rspec
```

---

## Check If a Spec Exists Before Referencing

```bash
ls spec/path/to/file_spec.rb
```

If the file is not found, that is a signal to write it — follow a TDD approach and create the spec before implementing the feature or fix.
