---
name: thoven-email-system
description: Use when writing, changing, converting or checking a Thoven email, either a Rails mailer and its views or a Loops journey email.
---

# Thoven email system

Every Thoven email is one design, whoever sends it: the intro-call confirmation email (Paper file
"Thoven Music Passport", page "08 Hand-off screens", frame "Cell · Confirmation email"). A view holds
only its words and calls components. A design change is one edit in the layer, never in a view.

Paths below are in the backend repo. Read the file a step names; it holds the values.

## The layer

| File | Holds |
|---|---|
| `app/helpers/email_tokens.rb` | every colour, font, radius, width, logo, mascot, support address and postal address |
| `app/helpers/email_helper.rb` | the components and their arguments: heading, paragraph, strong, link, support link, button, callout, card, detail, rows, mascot, image |
| `app/views/layouts/thoven_email.html.erb`, `_thoven_email_card.html.erb` | the document, fonts, logo, card and footer, with the `:title`, `:preheader`, `:footer` and `:unsubscribe` slots |
| `app/views/layouts/thoven_email.text.erb` | the plain-text footer |
| `app/views/layouts/thoven_email_mjml.html.erb` | the same card wrapped as MJML for Loops, filling `:unsubscribe` with Loops' link |
| `app/views/renewal_mailer/email.html.erb` | the worked example of a Rails view |
| `app/views/loops_emails/post_intro_day0.html.erb` | the worked example of a Loops view |

A component or token the email needs and the layer lacks gets added to `email_helper.rb` or
`email_tokens.rb`, so every email can use it.

## 1. Pick the sender

Decisions L2 and L16 in Linear Project P-THV-8 send through both.

- **Rails (SendGrid)** sends mail tied to app state: bookings, payments, reminders, consent, alerts.
- **Loops** sends lifecycle journeys: the post-intro purchase nudges now, onboarding journeys later.

Both render the same components, so the sender changes only steps 3 and 5.

## 2. Write the words

Run the `thoven-branding` skill on every line a reader sees (it reads `BRANDING.md`). The email
helps the reader take the next step; it explains what happens and what to do. Support is
`thovie@thoven.co` through `email_support_link`.

For Loops, two content rules bind:

- **L4.** Loops receives no child data: no child's name, age or anything about the learner. The kid
  version says "your kid".
- **L15.** Each journey email has a kid version and an adult version. The view branches on the `kid`
  local.

Done when every line passed `thoven-branding` and, for Loops, both versions read correctly.

## 3. Build the view

**Rails.**

1. `ApplicationMailer` sets the thoven_email layout, so a new mailer gets it by inheriting. Opt an
   action out only for a plain personal letter, as `TeacherApplicationMailer#application_approved`
   does.
2. Write `<action>.html.erb` the way `renewal_mailer/email.html.erb` does: set `:title` and
   `:preheader`, put the reason the reader gets this email and the support line in `:footer`, then
   the body from `EmailHelper` calls only.
3. Write `<action>.text.erb` with the same words in plain text. The text layout adds the footer.
4. In the mailer method, call `set_sendgrid_category` with `transactional`, `nurture` or
   `promotional` before `mail` (`app/mailers/application_mailer.rb`). The category also turns
   SendGrid click tracking off, because SendGrid's tracking domain serves an invalid certificate and
   every rewritten link fails.
5. Build frontend links from `ENV["FRONTEND_URL"]`; a link to the Rails host 404s.
6. Format times in the recipient's zone: `formatted_time_range_in_timezone(profile.timezone_or_inferred)`.
   `formatted_time_range_with_timezone` uses the slot's or teacher's zone and shows a parent the
   teacher's clock.

**Loops.**

1. Add `app/views/loops_emails/<view>.html.erb`, shaped like `post_intro_day0.html.erb`. Every
   dynamic value is a Loops merge tag from the constants in `app/services/loops/emails.rb`; add a
   constant there for a new event property. There is no text view: Loops writes the plain text.
2. Register the Loops node names in `Loops::Emails::ALL`, one kid row and one adult row.
3. `bin/rails loops:emails OUT=<dir>` writes `<node>/index.mjml` and `<node>.zip` for each email.
   Andres uploads the zip in Loops.

Done when the view holds no markup of its own beyond component calls and slots.

## 4. Check it

Name the pane's own `DATABASE_URL` and `TEST_DATABASE_URL` on every command.

1. **Mailer spec.** Assert the words, links, recipients and subject on the mail ActionMailer renders
   (`mail.html_part.body.decoded`, `mail.text_part.body.decoded`), as
   `spec/mailers/renewal_mailer_spec.rb` does. Read decoded parts: the footer's `©` makes every part
   quoted-printable, so `body.encoded` wraps long lines and links. Leave colours, fonts, logo and
   footer to the layer spec and the scan; a mailer spec that repeats them goes stale on the next
   design change. Loops emails are checked in `spec/services/loops/emails_spec.rb`.
2. **Scan spec.** `bundle exec rspec spec/mailers/email_view_scan_spec.rb` reads every email view and
   names any that carries a full document, a colour literal or a font.
3. **Layer spec.** After a change to `email_helper.rb`, `email_tokens.rb` or a layout, run
   `bundle exec rspec spec/mailers/thoven_email_layer_spec.rb`.
4. **Look at it.** Write the rendered HTML to `tmp/<name>.html`. For Rails, write
   `mail.html_part.body.decoded`. For Loops, render
   `Loops::Emails::Renderer.render(template: "loops_emails/<view>", layout: "thoven_email", locals: { kid: true })`
   through `bin/rails runner` and replace the merge tags with sample values. Then run
   `scripts/shoot-email.sh tmp/<name>.html` from this skill's folder, read both PNGs (640 and 390)
   beside the design frame, and delete the scratch files.

Done when each spec run is green, both PNGs match the frame, and the report pastes each command with
its pass line.

## Pitfalls

- Colour comes from the components. Amber appears only on the filled button and the logo (THV-1396);
  text uses the app grays. A colour the components cannot draw is a new token in `email_tokens.rb`.
- The footer address, logo and company line come from the layout. A view that types them drifts.
- A view pasted from an old email or another tool brings its own `<!DOCTYPE>`, `<head>` and inline
  styles, and the email then carries two documents. The scan refuses it; keep only the words and
  rebuild them from components.
- The mailer's `from` and `reply_to` use `thovie@thoven.co`.
