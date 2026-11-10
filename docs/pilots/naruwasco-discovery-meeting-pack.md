# NARUWASCO Water-Service Reliability — Discovery Meeting Pack

**Document status:** Internal preparation for first institutional discovery  
**Prospect:** Nakuru Rural Water and Sanitation Company Ltd (NARUWASCO)  
**Meeting status:** Not requested / not scheduled  
**Atlas relationship status:** No partnership, endorsement, pilot approval or data access confirmed  
**Target discovery area:** Operator-selected service scheme in the Western operating area, if NARUWASCO confirms fit  
**Owner:** Atlas Sanctum

---

## 1. Meeting objective

Secure a 30-minute operational discovery conversation with the person responsible for a defined service area's incident reporting, maintenance coordination or service continuity.

The purpose is to understand the operator's existing workflow and determine whether a small, useful and permissioned pilot could improve visibility from service interruption to restoration review.

**The meeting is not a product pitch or a request for bulk data.**

### One question to test

> Is there a recurring service interruption or maintenance coordination workflow where better traceability between report, triage, assignment, restoration and review would create measurable operational value?

If the answer is no, or the relevant information already works well in an existing system, Atlas should not force a pilot.

## 2. Prospect verification and geographic fit

NARUWASCO's official website describes it as a Nakuru County-owned Water Service Provider. Its published service-area page lists five operating areas and includes Rongai under the Western area, alongside Salgaa, Sachangwan, Mangu and Kampi ya Moto.

Sources to verify before outreach:
- [NARUWASCO — About Us](https://www.naruwasco.co.ke/about-us/)
- [NARUWASCO — Coverage and Maps](https://www.naruwasco.co.ke/home/)
- [NARUWASCO — Contact Us](https://www.naruwasco.co.ke/contact-us/)

Published general contact details on the official contact page:
- Email: **info@naruwasco.co.ke**
- Headquarters: Stanley Mathenge Road, Industrial Area, Nakuru
- Postal address: P.O. Box 386-20100, Nakuru
- Customer-care numbers: +254 774 389 372 / +254 791 389 372

Use the published general email to request routing to the appropriate operational contact. The published telephone numbers are customer-care channels; do not assume they are partnership/procurement contacts.

**Geographic caution:** the published area list is not proof that a particular village, asset or scheme is served by NARUWASCO. Ask the company to confirm the exact service boundary, asset owner and operating team before selecting a pilot site.

**Do not repeat undated service-area/population figures from the company's website as current operating performance.** For this discovery, only use the published service-area naming as a routing clue and verify details directly with the operator.

## 3. Who we need in the room

Request the person accountable for the operating workflow, not only a communications contact.

Preferred attendees:
1. **Operational sponsor:** Area Manager or operations/technical manager for the selected scheme.
2. **Process owner:** person responsible for incident intake, service complaints, maintenance or work-order coordination.
3. **Data/system representative:** person who understands the current incident log, asset register or software workflow.
4. **Optional governance participant:** person responsible for data protection, ICT/security or procurement, to be engaged when scope and data needs are clearer.

A managing director or executive sponsor may route the request, but the first discovery needs someone who understands how work is actually performed.

## 4. Thirty-minute agenda

| Time | Topic | Desired understanding |
|---|---|---|
| 0–3 min | Introductions and purpose | Confirm roles and the reason for the conversation |
| 3–10 min | Current incident workflow | How an interruption is reported, triaged, assigned and closed |
| 10–16 min | Records and evidence | Which logs, asset references, timestamps and evidence already exist |
| 16–22 min | Operational pain point | Where delay, duplication, missing context or weak handover genuinely occurs |
| 22–27 min | One bounded use case | Whether one service area and incident category are suitable for closer scoping |
| 27–30 min | Next step | Name the owner, permitted information and follow-up session if there is mutual interest |

### Opening statement (60–90 seconds)

"Thank you for making time. Atlas Sanctum is exploring a practical way to connect operational evidence to decisions and follow-through in place-based programmes. For this conversation, we're focused on water-service reliability. We are not here to replace your customer, asset or work-order systems, and we are not assuming that your current process has a problem. We'd like to understand how one interruption is handled from the first report through response and restoration, what records already support that process, and whether there is a specific coordination gap worth examining. If the existing workflow already handles this well, that is useful to learn too."

## 5. Interview script — ask in this order

### A. Understand the real operating process

1. What is the most common type of service interruption or maintenance issue handled in this area?
2. How does a report enter the system: customer-care channel, field staff, supervisor, telemetry, paper log, messaging platform or another route?
3. What happens after a report is received? Who checks it, who prioritizes it and who assigns a response?
4. What system or register is authoritative for the service point, asset or scheme?
5. Which team is accountable for restoration and who confirms the issue is resolved?
6. What causes the most delay or repeated work, if anything? Could you walk us through a recent anonymized example?

### B. Understand evidence and records

7. Does the existing record capture the event time, time reported, triage time, assignment time and restoration time separately?
8. Is there an operator incident/reference ID that can be used to link records without copying customer details?
9. What evidence is normally available: field inspection, work-order note, operator log, telemetry, photo, water-quality test, customer callback or another source?
10. How are incomplete reports, conflicting reports and repeat incidents handled?
11. Can the team generate an anonymized export or sample schema of the incident and asset records, subject to authorization?

### C. Identify the decision and its value

12. Which decision would benefit most from a clearer shared view: priority setting, crew assignment, escalation, repeat-failure analysis, restoration review or management reporting?
13. How often does that decision occur, and who makes it?
14. What does the team currently measure to tell whether response is improving?
15. Which metric is meaningful and within the team's influence?

### D. Establish permission and next steps

16. Who owns the records, and who can authorize a controlled pilot data review?
17. What information must remain restricted or be excluded entirely?
18. Would a short technical scoping session with the operational and ICT/data owners be useful?
19. What procurement, contracting or partnership path would apply to any later pilot?
20. Who should be the single accountable contact for the next step?

Do not ask every question if the conversation naturally answers them. Prioritize process, records, authority and a real decision.

## 6. What Atlas should demonstrate (five minutes maximum)

Use only synthetic records with a persistent label:

**DEMO DATA — SYNTHETIC EXAMPLE — NOT FIELD VERIFIED — NOT NARUWASCO DATA**

Demonstrate:
1. A fictitious water point with a made-up identifier such as `DEMO-WP-001`.
2. A synthetic interruption report with event time and report time distinguished.
3. Source/evidence reference and explicit missing-information notes.
4. Triage, assignment and restoration status history.
5. A decision note with options, rationale and limitations.
6. A recorded restoration observation that remains **pending verification** until a separate authorized reviewer completes review.

Never show invented operator names, service statistics, partner logos or claims of measured improvement. Never use another water provider's confidential operational data.

The current water module is a prototype; do not present it as an operational deployment or as capable of multi-institution access until the security model has been implemented and tested.

## 7. Data-readiness checklist

Ask only for the minimum dataset needed to test whether the workflow is viable.

### Minimum metadata for an initial, anonymized sample

| Field | Why it is needed |
|---|---|
| Operator asset/service-point ID | Stable join key without customer identity |
| Scheme / service area | Operational boundary |
| Incident reference ID | Link related records |
| Issue category | Compare like-for-like incidents |
| Event/observed date-time | Approximate start of issue |
| Report received date-time | Measure intake-to-response |
| Triage date-time | Measure review latency |
| Assignment date-time | Measure assignment latency |
| Restoration/completion date-time | Measure reported time to restore |
| Current status | Understand open/closed/reopened cases |
| Work-order reference (optional) | Link to existing maintenance process |
| Evidence type/reference (not sensitive content initially) | Traceability |
| Verification status and reviewer role | Distinguish reported completion from verified restoration |

### Do not request in the first discovery

- Customer names, phone numbers, account numbers or billing details.
- Household-level precise coordinates.
- National ID numbers or beneficiary personal data.
- Credentials, access tokens, system passwords or API secrets.
- Bulk raw call-centre recordings or unredacted complaint messages.
- Water-quality laboratory results unless the pilot specifically concerns water quality and the responsible technical method is agreed.

A schema sample, blank template or small redacted export is preferable to live access. Do not accept data until the operator has confirmed authority and a written sharing arrangement.

## 8. Proposed pilot boundary (to be agreed, not assumed)

| Dimension | Initial planning hypothesis |
|---|---|
| Operator | One WSP or county programme owner |
| Geography | One operator-selected scheme/service area |
| Initial records | 10–20 service points only if suitable records exist |
| Incident type | One recurring and measurable interruption/maintenance category |
| Duration | 4–6 weeks after scope, permissions and data readiness |
| Integration | Prefer controlled CSV export/import initially |
| Platform role | Traceable working and review layer; operator remains source of truth |
| Decision authority | Operator-designated staff |
| Verification | Separate authorized reviewer where practicable |
| Deliverables | Workflow map, evidence register, prototype workspace, process baseline and evaluation brief |

These are hypotheses to test. Do not promise an asset count, duration, integration or price until the partner confirms data volume, constraints and procurement requirements.

### Candidate measures

- Report-to-triage time.
- Report-to-assignment time.
- Report-to-reported-restoration time.
- Percentage of closed incidents with a distinct verification event.
- Completeness of the minimum evidence fields.
- Repeat incidents by the same asset and issue category within a jointly agreed window.

Do not set improvement targets before baseline review. Do not label these candidate process metrics as WASREB regulatory indicators. WASREB's current Impact reporting describes sector indicators including water coverage, sanitation coverage, unaccounted-for water, water quality, hours of supply, metering, revenue collection efficiency, O&M cost coverage and staff productivity. See [WASREB Impact Reports](https://wasreb.go.ke/impact-reports/).

## 9. Discovery decision scorecard

Score each item **0 = unknown/no**, **1 = partial**, **2 = confirmed**. Record the evidence for the score; do not score based on optimism.

| Qualification item | Score | Evidence / notes |
|---|---:|---|
| Named operational sponsor | 0 / 1 / 2 | |
| Named process owner | 0 / 1 / 2 | |
| Specific service area and asset owner | 0 / 1 / 2 | |
| Recurring workflow problem confirmed | 0 / 1 / 2 | |
| Existing asset and incident records exist | 0 / 1 / 2 | |
| Timestamps allow process baseline | 0 / 1 / 2 | |
| Decision and response authority identified | 0 / 1 / 2 | |
| Restoration evidence/review process understood | 0 / 1 / 2 | |
| Data-sharing approval route identified | 0 / 1 / 2 | |
| Procurement/paid-pilot path understood | 0 / 1 / 2 | |

**Maximum:** 20 points.

Suggested interpretation:
- **16–20:** proceed to technical scoping if no critical blocker exists.
- **10–15:** conduct targeted follow-up; do not promise a pilot yet.
- **0–9:** nurture or stop; the problem, owner or evidence is not sufficiently qualified.

Regardless of score, do not proceed without a named operational sponsor, clear record authority, a genuine use case and an approved data-sharing route.

## 10. Next-step decision record

Complete immediately after the meeting.

- Date / format:
- Organization and department:
- Attendees and roles:
- Operational sponsor:
- Process owner:
- Scheme / service area to verify:
- Incident category:
- Current workflow summary:
- Systems and authoritative records:
- Available timestamp fields:
- Evidence sources and limitations:
- Existing measures:
- Confirmed pain point (quote or paraphrase):
- Data controller / authorized data approver:
- Restricted data / exclusions:
- Procurement or partnership route:
- Agreed next action:
- Action owner:
- Due date:
- Permission to follow up:
- Permission to cite organization or meeting publicly: **No, unless separately and explicitly granted.**

## 11. Follow-up email after a discovery meeting

**Subject:** Thank you — water-service reliability discovery and next steps

Dear [Name],

Thank you for taking the time to explain your team's current process for handling [agreed issue/workflow] in [service area].

Our understanding is that the key operational question is [one-sentence summary], and that the relevant records/process owners are [roles or systems, as agreed]. Please correct anything we have misunderstood.

As discussed, the next useful step would be [specific action, e.g. a technical scoping session or review of a redacted sample schema]. We will not request or process operational data until the appropriate authorization and sharing arrangements are in place.

We will prepare [agreed deliverable] for [date/next checkpoint]. Please let us know who should be included from your operations and ICT/data teams.

Thank you again.

Kind regards,

Atlas Sanctum  
hello@atlasanctum.org

## 12. Pre-meeting outreach email

**To:** info@naruwasco.co.ke  
**Subject:** Request for operational discovery conversation — water-service reliability

Dear Managing Director / Operations Team,

I am writing on behalf of Atlas Sanctum, a Kenya-rooted technology initiative exploring practical ways to connect operational evidence, decisions and measurable outcomes.

We are seeking a short introductory conversation with the person responsible for operations, maintenance coordination or service continuity in one of NARUWASCO's operating areas.

We would like to understand how a water-service interruption is currently reported, assessed, assigned and reviewed after restoration. We are not assuming that your current processes have a gap, and we are not seeking access to customer or operational data at this stage.

Our objective is to learn whether a small, jointly scoped discovery exercise could improve traceability around one real workflow, while leaving operational authority and existing systems with NARUWASCO.

Would you be able to direct us to the appropriate operational contact for a 30-minute conversation?

Kind regards,

Atlas Sanctum  
hello@atlasanctum.org  
https://atlassanctum.me

## 13. Red lines for the Atlas team

- Do not claim NARUWASCO is a partner, customer, pilot host or endorser.
- Do not describe a meeting as scheduled until the organization confirms it.
- Do not claim a pilot has started until scope and authority are documented.
- Do not request live customer data, credentials or unrestricted system access.
- Do not claim to reduce outage duration or improve service before measuring it.
- Do not turn an operator report into a verified outcome without a separate verification event.
- Do not describe a synthetic demo as actual county, utility or community data.
- Do not promise AI, blockchain, digital-twin or real-time integration features that are not implemented and tested.

## 14. Milestone exit criteria

The discovery-readiness milestone is complete when:
1. The initial prospect and correct operational contact route have been confirmed.
2. The outreach email has been reviewed internally and actually sent by an authorized person.
3. The organization has responded or an honest follow-up attempt is logged.
4. A discovery meeting has occurred, or the prospect has declined / referred the request.
5. The meeting notes and qualification scorecard are completed.
6. A named owner, real issue, suitable evidence source and data authorization pathway are either established or recorded as missing.
7. A decision is made to proceed to technical scoping, continue discovery, nurture or stop.

**Current truth:** this pack is prepared for outreach. No email has been sent, no meeting has been scheduled, no operational data has been received and no pilot has been approved.
