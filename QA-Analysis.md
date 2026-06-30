# QA Analysis — Billing Form Mock-up

My review of the "Account Information" payment screen.

## Problems found

**Security**

The biggest issue is that card details are typed straight into ordinary form fields, with nothing suggesting a tokenization provider behind them (no Stripe Elements, Braintree, or similar). If the raw card number reaches the company's own servers, the whole system falls into a much heavier PCI-DSS compliance scope, and any breach exposes real card data. This is the most serious thing on the screen.

There's also no CVV / security code field anywhere. Most gateways require the CVV for online (card-not-present) payments, so either these transactions will fail or the integration is doing something non-standard. Either way it points to an incomplete form.

I'd also want to confirm the page is served over HTTPS and shows some trust signal. A payment screen with no secure-context cue both worries users and, if it really isn't HTTPS, is a genuine vulnerability.

**Usability**

A few of the field labels push work onto the user that the system should handle. "Card Number (No dashes or spaces)" and "Postal Code (no dashes)" are good examples — the form should accept whatever the user types and strip the formatting itself, rather than rejecting valid input and causing failed checkouts.

The address section looks US-only: there's a "State or Province" dropdown but no Country field, even though the company is described as global. A customer outside the US can't really enter a valid billing address here, which blocks international billing for a product that's meant to serve a worldwide market.

The Payment Amount ("30.00") has no currency next to it. For a global company that's ambiguous — is it dollars, euros, something else? The user should know exactly what they'll be charged.

Smaller things: nothing in the mock shows inline validation or error messages, so a user won't know why a submission was rejected; and the middle-initial box and the split month/year expiry selects add friction for little benefit.

**Functional**

The expiry is two separate dropdowns with nothing stopping you from picking a date that's already passed — that should be caught on the form, not later at the gateway. Similarly, there's no sign of basic card-number validation (length / Luhn check) to catch obvious typos before submitting.

**Accessibility / performance**

Hard to judge fully from a static image, but worth checking that every field has a real label, the tab order is sensible, focus states are visible, and errors are announced to screen readers. Performance isn't observable here, but a payment step in particular should load quickly and not block on heavy scripts.

## Sample test cases

| ID | Title | Type | Steps | Expected result |
|----|-------|------|-------|-----------------|
| TC-01 | Valid payment goes through | Positive | Select VISA, enter a valid test card number, a future expiry and CVV, fill the cardholder name and a complete billing address, click Continue. | Form is accepted and moves to the next step. The amount and currency are shown clearly, and no card data is exposed in the page or logs. |
| TC-02 | Missing required field is blocked | Negative | Leave Card Number empty, fill everything else validly, click Continue. | Submission is blocked with a clear error on the Card Number field. No payment is attempted. |
| TC-03 | Bad / malicious input is rejected | Negative | Enter a card number with letters (or one that fails the Luhn check), and type `<script>alert(1)</script>` into the first-name field, then click Continue. | The card number is rejected with a clear message. The script text is treated as plain text and never runs, and is escaped anywhere it's later displayed. |

A boundary case worth adding: selecting an expiry month/year in the past should be rejected on the form straight away, not at the gateway.

## Product solution for the most severe issue

The most severe issue is the raw card data being collected in first-party fields. The fix is to stop handling card data directly and move to a PCI-compliant hosted-fields / tokenization integration (Stripe Elements, Braintree Hosted Fields, or similar).

With that approach, the card number, expiry and CVV are entered inside fields hosted by the payment provider (embedded as secure iframes), so the raw card number never touches the company's servers — the provider hands back a token that's used to charge the card. That alone shrinks PCI-DSS scope dramatically (typically from the heavy SAQ-D down to the much lighter SAQ-A), cutting both compliance cost and breach risk. As a bonus, these libraries also handle the formatting and validation gaps above: they normalize input automatically, detect the card type, and run real-time Luhn and expiry checks.

I'd pair that with the related fixes that block correct billing: add the missing CVV field, add a Country field with a state/province list that adapts to the country, and show the currency next to the amount with clear inline validation.

The payoff is lower security and compliance risk first, then fewer failed checkouts and the ability to actually bill the global customer base the product is meant to serve.
