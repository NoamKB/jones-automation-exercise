# Jones — Automation Exercise
Playwright automation for the Automation Engineer exercise. It fills in the
contact form on <https://test.netlify.app/>, submits a call-back request, and checks
that the thank-you page is reached.

## What it does

[`tests/request-callback.spec.js`](tests/request-callback.spec.js) contains two tests:

**1. Happy path** — submitting the form successfully:

1. Opens <https://test.netlify.app/>
2. Fills in Name, Email, Phone, Company and Website
3. Changes Number of Employees from `1-10` to `51-500` (bonus)
4. Screenshots the filled form before submitting → `screenshots/before-submit.png`
5. Clicks "Request a call back"
6. Asserts the thank-you page was reached (URL + the visible "Thank You" heading)
7. Logs a message once on the thank-you page

**2. Negative case** — leaving a required field (Name) empty and clicking submit, then
asserting the form does *not* submit: it stays on the landing page and the empty field
reports as invalid. This checks the form rejects bad input, not just that the happy path
works.

## Running it

Needs [Node.js](https://nodejs.org/) (tested on Node 18).

```bash
npm install                      # install dependencies
npx playwright install chromium  # download the browser Playwright drives
npm test                         # run both tests
```

`npm test` runs the whole file (both tests). To run just one, use `-g`, which filters by
test title:

```bash
# only the happy path
npx playwright test -g "lands on the thank-you page"

# only the negative case (required field empty)
npx playwright test -g "does not submit when a required field"
```

Other useful commands:

```bash
npm run report                   # open the HTML report after a run
npx playwright test --headed     # watch it run in a real browser window
SLOWMO=800 npx playwright test --headed   # ...slowed down so each step is visible
```

## Decisions and reasoning

A few choices I made along the way, and why:

- **Playwright Test over a bare script.** A plain script would have met the brief, but the
  test runner gives me real assertions, automatic waiting, and an HTML report for almost no
  extra code. It also let me assert that the flow actually *succeeded* rather than just
  performing the clicks.

- **Locating fields by label/role, not CSS.** `getByLabel` / `getByRole` find elements the
  way a user does, so the test doesn't break when classes or markup change. The required
  labels carry a trailing `*`, so I matched them with `/^Name\s*\*?$/` instead of a loose
  prefix, so a field can't accidentally match a longer label that starts the same way.

- **How I verify "reached the thank-you page."** While inspecting the site I saw the form is
  plain HTML (`<form action="thank-you.html">`) that submits via GET — so the values come
  back on the URL as a query string and the browser navigates to `/thank-you.html`. I assert
  on both the resulting URL and the visible "Thank You" heading, so a change to either one
  still fails the test loudly.

- **Added a negative test on top of the happy path.** The brief only asks for the happy
  path, but a form is only really "working" if it also *rejects* bad input. I checked the
  page and saw Name/Email/Phone use the HTML `required` attribute, so I added a test that
  submits with Name empty and asserts the browser blocks it (no navigation, and the field
  reports invalid via `checkValidity()`).

- **Kept it deliberately small.** One spec, no page objects, no CI. For a single short flow
  that extra structure would add noise without value; I'd reach for it on a larger suite.
  `// @ts-check` gives me editor type-checking from Playwright's types without a TypeScript
  build.

## Layout

```
package.json
playwright.config.js
tests/request-callback.spec.js
screenshots/before-submit.png   # generated at runtime
QA-Analysis.md                  # answers to the billing mock-up questions
```
