# Teacher schedule

Teacher schedule shows a signed-in teacher their upcoming lessons and lets them open one.

## Sub-features

- `teacher-home` renders the teacher home after sign-in.
- `teacher-upcoming` lists upcoming lessons or the empty state the design ships.
- `teacher-open-lesson` opens one listed lesson.

## How to get to it (user POV)

- Sign in as a teacher, then land on `/teacher`.
- Open the teacher home from the product chrome after a session already exists.

## Driving it with the session browser

Preconditions:

- Sign-in for a seeded staging teacher succeeded.
- Doctor still says the host is staging or preview.

- **Open home.** Go to `/teacher`. A heading or list for the teacher's work is visible.
- **Read upcoming.** Find the upcoming-lessons region. Either one or more lesson rows render, or the real empty state renders.
- **Open one lesson.** Activate a lesson row. The lesson detail or classroom view appears.
- **Proof.** Screenshot the list (`action.png`) and the opened lesson (`result.png`).

## Gotchas

- An empty list is a pass only when the empty state is the product empty state, not a spinner or error toast.
- Do not create a real family's lesson on production to fill the list.
- If staging has no teacher seed, fail and write that here. Do not skip to a `/dev` page.
