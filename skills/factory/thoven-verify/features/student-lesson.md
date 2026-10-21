# Student lesson

Student lesson lets a signed-in student open an assigned lesson from the student home.

## Sub-features

- `student-home` renders the student home after sign-in.
- `student-assigned` lists assigned lessons or the real empty state.
- `student-open` opens one assigned lesson.

## How to get to it (user POV)

- Sign in as a student, then land on `/student`.
- Open a lesson the student already has on staging.

## Driving it with the session browser

Preconditions:

- Sign-in for a seeded staging student succeeded.
- COPPA. Do not create or profile a real child. Use the staging seed only.

- **Open home.** Go to `/student`. Student chrome renders.
- **Read assigned.** Find the assigned-lesson region. Rows or the real empty state appear.
- **Open one lesson.** Activate a lesson. Lesson content or the waiting room appears.
- **Proof.** Screenshot the list (`action.png`) and the opened lesson (`result.png`).

## Gotchas

- Student auth is a different system from parent and teacher auth. Do not mix cookies.
- Factory loop PRs must not change student auth or privacy copy.
- A parent-side preview of a student page is not this feature.
