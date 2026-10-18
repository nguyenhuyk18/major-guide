# Accounting and AI changes

Frontend: `../major-guide-fe-main` (React web). Mobile is unchanged.

## Accounting

Open `/admin/accounting` as an administrator. API routes under `/api/v2/accounting` are protected by both authentication and the admin role.

- Create income/expense entries in VND, with date, category, counterparty, description and optional reference.
- Entries persist in the booking service database in `accounting_entries`. Client-generated request IDs prevent duplicate submissions; changed payloads cannot reuse an ID.
- Generate one internal invoice per income entry; repeated/concurrent requests return the same invoice. Invoices persist in `accounting_invoices`.
- Filter by inclusive calendar dates, export UTF-8 CSV, print an invoice or save it as PDF using the browser.
- Paid bookings are written to the ledger automatically when Stripe confirms payment (`requestId = booking-payment:<bookingId>`, idempotent). Late payments that Stripe refunds are recorded as a payment plus a refund expense (`booking-refund:<bookingId>`). A ledger failure never blocks a payment; `POST /api/v2/accounting/sync-bookings` (button "Đồng bộ booking") imports any paid booking that is missing, including bookings paid before this change.
- Each booking entry stores the split: `platformFee` (MajorGuide revenue) and `expertAmount` (owed to the expert). Bookings snapshot `amount_paid` and `platform_fee` at payment time; older bookings fall back to the current `STRIPE_CONFIG.PLATFORM_FEE`.
- The summary reports cash (income, expense, balance) and the booking view: gross collected, refunds, platform revenue, expert earnings, expert payouts (expenses with category "Chi trả chuyên gia") and expert payable, plus profit = platform revenue + other income − operating expenses (refunds and payouts are pass-through, not costs).
- The admin dashboard "Tổng tiền thu" is cash collected (expert fee + platform fee) with the platform fee shown separately; experts still see only their own earnings. Previously it summed only `price_support`, i.e. the experts' share.
- Internal invoices are not tax e-invoices. No tax calculations are assumed.
- Lists are limited to 1,000 rows; when exceeded, the UI asks for a narrower date range and disables exports to prevent silently incomplete reports. Summary totals cover the entire selected period.

Restart BFF and booking service to load the new module. Collections and unique indexes are created by Mongoose; existing booking data is untouched.

## AI / RAG

- Bind tool methods before creating LangChain schemas, removing the erroneous required `self` field.
- Forward the caller's authorization to business APIs; internal AI endpoints also require `AGENTIC_INTERNAL_TOKEN`.
- Keep that token identical in the backend `.env` and `agentic-ai/apps/.env`. The local values were synchronized without printing secrets.
- Qdrant calls run outside the async event loop. Retrieval supports optional `QDRANT_API_KEY` and `QDRANT_VECTOR_NAME`.
- Embedding failures return a clear unavailable response; authentication errors retain 401/503 instead of becoming a misleading 502.
- The admin agent can read accounting totals through `accounting_summary`. Email tools only draft and still require the existing application confirmation flow.
- Restart the Python AI service and BFF after configuration changes.

The live Qdrant collection `ilo_jobs` was verified with 199 points and 1,024-dimensional cosine vectors. Both configured Groq models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`) returned `model_permission_blocked_org` during verification. An organization administrator must enable those models or supply permitted values for `GROQ_MODEL` / `GROQ_FAST_MODEL`. Retrieval and the existing source-backed fallback work; full model generation remains dependent on this external permission.

## Checks

- TypeScript: BFF and booking `tsc --noEmit`.
- Python: `python -B -m unittest discover -s tests -v` from `agentic-ai`.
- Booking: targeted accounting unit tests and opt-in MongoDB integration test (set `ACCOUNTING_TEST_MONGO_URI`). Integration creates and removes a uniquely named test database, never the application database.
- Frontend: production build and CSV escaping test.
- Browser: visual checks of accounting, entry form and video pre-join with mocked APIs. A real two-party media call was not exercised.
