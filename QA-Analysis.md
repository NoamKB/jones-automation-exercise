# QA Analysis — Billing Form Mock-up

A review of the "Account Information" billing/payment screen, based on the static mock-up.
Because this is a static image, I've separated what can be seen directly in the UI from
the validation behavior that would have to be checked in the real implementation.

## Problems found in the mock-up

| # | Issue | Severity |
|---|-------|----------|
| 1 | Payment handling risk (see below) | High |
| 2 | No CVV / security code field | High |
| 3 | Currency not shown on the amount | Medium |
| 4 | No Country field for a global billing address | Medium |
| 5 | Billing street address fields are ambiguous | Low |
| 6 | Formatting rules pushed onto the user | Low |
| 7 | Continue / Cancel sit close together | Low |

**1. Security / payment handling.** The mock-up gives no visible indication that
hosted/tokenized payment fields are used. If raw card data reaches the company's servers,
that creates serious compliance and breach-risk concerns. I'm not saying the form is
insecure — I can't tell that from a static image — but the absence of any visible
hosted-field indication is worth raising as the most important question.
On top of that, the screen shows no security or trust messaging at all — well-designed
billing forms usually reassure the user at this step (for example, "card details are sent
securely over SSL and are not stored on our servers"). That absence is visible in the
mock-up, and it both undermines user confidence and leaves the data-handling story unstated.

**2. Missing CVV.** The card section shows card number, expiry month/year, and cardholder
name, but no CVV / security code field. A CVV is typically required for card-not-present
payments, so it should either be added or its absence explained.

**3. Currency ambiguity.** The Payment Amount shows "30.00" with no currency. For a global
SaaS company this is unclear — the user should see something like "$30.00" or "USD 30.00".

**4. Global billing address.** There's a "State or Province" field but no Country field.
Since the company is described as global, the address should support non-US customers, and
the state/province options should adapt to the selected country.

**5. Ambiguous street address fields.** The billing address has two fields — the first
required, the second optional — but it isn't clear what each is for. If they're meant as
address lines, labelling them "Address Line 1 *" and "Address Line 2 (apartment, suite,
unit, building — optional)" would remove the ambiguity. If they mean street name and
number, that should be explicit too.

**6. Formatting pushed onto the user.** Labels like "Card Number (No dashes or spaces)" and
"Postal Code (no dashes)" make the user format the data manually. It's friendlier to accept
common formatting, strip spaces/dashes automatically, and validate the normalized value.

**7. Continue / Cancel proximity.** The primary action and the cancel action sit close
together. This is a usability risk rather than a severe defect — in a payment flow it can
increase accidental clicks. More spacing and a clearer primary/secondary hierarchy would
help, and if Cancel discards entered data it should confirm before doing so.

## Suggestions for improvement

These aren't defects — the form isn't broken without them — but they would make the screen
clearer and more trustworthy.

- **Offer more payment options.** Adding PayPal, Apple Pay and Google Pay alongside the
  card form gives users a faster, familiar path and can improve conversion. (These wallets
  also keep card data off our side entirely.)
- **Add a short trust/security note** near the card fields, like the SSL/"we don't store
  your card details" reassurance many billing forms show. It's a small line that addresses
  the user's main worry at exactly the right moment.
- **Group the form into clear sections.** Right now the fields read as one long list.
  Splitting it into "Card Details" and "Billing Address" with headings makes it much
  easier to scan.
- **Combine the expiry into one field.** A single "MM / YY" input is quicker than two
  separate Month and Year dropdowns and avoids the awkward dropdown hunting.

## Functional validation to verify

Because this is a static mock-up, the actual validation behavior isn't visible. In the real
implementation I would verify that:

- Card number validation handles invalid length, non-numeric input, and numbers that fail
  the Luhn check.
- Invalid card numbers are rejected with a clear inline error before any payment attempt.
- Expiry date validation prevents or rejects expired month/year combinations.
- Required fields can't be submitted empty, and show clear inline errors next to the
  relevant field when left empty or filled with invalid data.
- Postal code validation matches the selected country rather than assuming one format.
- Unsafe text input (e.g. script tags in name/address fields) is escaped and never executed.

## Sample test cases

| ID | Title | Type | Steps | Expected result |
|----|-------|------|-------|-----------------|
| TC-01 | Valid payment details | Positive | Fill all required fields with valid data — including CVV, a valid future expiry, a complete billing address and a selected country — then click Continue. | User can continue; the amount and currency are shown clearly; no raw card data appears in logs or app requests. |
| TC-02 | Missing required card number | Negative | Leave Card Number empty, fill everything else validly, click Continue. | Submission is blocked, an inline error appears next to Card Number, and no payment is attempted. |
| TC-03 | Invalid card / unsafe input | Negative | Enter a card number with an invalid length or a failed Luhn check, and a script-like string in a name or address field, then click Continue. | The card is rejected with a clear inline error; the text input is treated as plain text and never executed. |

A separate boundary test should verify that a past expiry date is rejected.

## Product solution for the most severe issue

The most severe issue is the payment handling: the mock-up gives no visible indication
that hosted/tokenized payment fields are used. If raw card data reaches the company's
servers, that creates serious compliance and breach-risk concerns.

Recommended solution: move card entry to a PCI-compliant hosted-fields / tokenization
provider (Stripe Elements, Braintree Hosted Fields, Adyen Components, or similar). The raw
card number and CVV are entered inside the provider's secure fields/iframes, and Jones
receives only a token / payment-method ID, not the raw card number. This can significantly
reduce PCI-DSS scope depending on the final integration, while also reducing breach risk.

Pair it with the related fixes that the mock-up points to:

- Add a CVV / security code field.
- Add a Country field with country-aware state and postal-code behavior.
- Show the currency next to the amount.
- Clarify the address labels.
- Normalize spaces/dashes in the card number and postal code.
- Improve the spacing and hierarchy of the Continue / Cancel buttons.
