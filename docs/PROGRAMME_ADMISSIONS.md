# Programmes and unified trial application

Owner decision, October 8, 2026: the public site presents six programmes, each with a short explanation; website and WhatsApp use the same English application link; applicants may choose multiple programmes. The removed coordination questions, language question and homework sentence are not in this form.

The public cards mirror `lib/programs/catalog.ts` in `sirajjinstitute/Siraj-LMS`. Detailed existing curriculum roadmaps remain below them. Programme selection is an interest, and Ijazah is preparation subject to assessment and qualification, not a guaranteed certificate.

Canonical ready-to-share link: `https://www.sirajinst.com/apply`. Vercel issues a temporary redirect to `https://siraj-lms.vercel.app/apply`, where the trusted backend and coordinator workflow live. Primary trial CTAs use `/apply`; the floating/footer WhatsApp contact actions remain available. The static site does not collect or persist applicant data.

Release dependency: LMS PR #280 must pass verification, be deployed, and have `trial_journey_version()=1` installed before this redirect goes to Production. Do not publish a primary application CTA that ends in a missing or disabled form.

Assets retain content-addressed immutable filenames. Checks: `.github/scripts/verify_asset_hashes.py` and `.github/scripts/scan_secrets.py`. Mobile/browser inspection is required before release; source checks alone are not visual evidence.

WhatsApp button clicks send an anonymous fixed signal to the LMS endpoint. Active admin/coordinator receive a check-conversations alert; no WhatsApp messages/contact data are read. Recording is nonblocking, omits credentials, and preserves direct WhatsApp links on failure. The server validates official origins and limits notification bursts; a click is never an application or proof of a sent message. Publish tracking only after the LMS endpoint and scoped notification migration are verified.
