# Roster

Thoven's users, by the shape production holds: a platform built for under-13 learners, so most accounts are a parent with one or more children, beside teens, adult learners and their teachers. A persona is a person with a goal and a device, not a role in the code.

| Persona | Who | Device | Shape their data needs |
|---|---|---|---|
| Parent of one under 13 | Books and pays for a child of 6 to 12; the child never signs in alone | Phone, 390 | Child with a real date of birth in the under-13 consent band, a teacher, upcoming and past Sessions |
| Under-13 learner | Plays, practises and sees homework on the student login (username and passcode) beside the parent | Tablet or laptop | Same household as the parent; homework, practice history |
| Parent of several | Two or three children, different ages, sometimes different teachers or instruments | Phone, 390 | Siblings in different consent bands, one teacher shared and one not, credits spread across them |
| Teen learner | 13 to 17, signs in on their own, a parent still pays | Phone, 390 | Teen consent band from a real date of birth, a linked parent, own Sessions |
| Adult learner | Signs up as "Myself", pays for their own lessons | Phone or laptop | No guardian; adult date of birth; the adult path everywhere a child path exists (THV-2003) |
| Younger teacher | A few students, works from a phone between commitments, moves fast | Phone, 390 | Small roster, open availability, recent bookings |
| Older teacher | Teaches many families from a desk, reads every screen, slower with new controls | 1280×720 window | Large roster across households, long history, notes, recurring Lessons |
| Prospective family | Arrives from the public site, has no account yet | Phone, 390 | None: walks sign-up from the public route |

Names are real length: the snapshot scrubber cuts every name to 17 characters, which hides layout bugs, so a seed gives some people long names.

## Seeds

Staging households, from `~/thoven/.secrets/staging.env` (load in the shell that logs in; never print a value):

| Persona | Household prefix |
|---|---|
| Adult learner | `STAGING_QA_ADULT_*` |
| Teen learner | `STAGING_QA_TEEN_*`, `STAGING_SWEEP_TEEN_*`, `STAGING_SWEEP_TEEN2_*` (with a student login) |
| Parent of several | `STAGING_QA_MANY_*` |
| Paying family | `STAGING_QA_PAID_*` |
| Families with a teacher and student login | `STAGING_TOP1_*` to `STAGING_TOP5_*`, `STAGING_KERI_*` |
| Families mid-onboarding | `STAGING_WALK_FAMILY_A_*` to `STAGING_WALK_FAMILY_D_UNASKED_*`, `STAGING_WALK_TEACHER_*` |

Read a household's rows before the walk: a household whose shape does not match its persona is a bad seed, fixed before walking. A persona with no household gets a seed built for the run and named in `JOURNEYS.md`. A real production case to reproduce takes `qa-product`'s `references/prod-snapshot.md`.

## Refreshing the roster

When a persona's shape is in doubt, count it on production read-only from the laptop (Neon project in `debug`'s `references/vendor-access.md`): students by consent band, households by number of children, adults with no guardian, teachers by roster size. Change the table above to match and name the date of the count in the commit.
