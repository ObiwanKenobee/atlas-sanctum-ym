# Nakuru Water-Service Reliability Pilot
## Institutional discovery and implementation brief

**Status:** Prospecting concept — not an approved institutional pilot  
**Geography:** Nakuru County, Kenya; one operator-defined service area to be selected jointly  
**Proposed first discovery prospect:** Nakuru Rural Water and Sanitation Company (NARUWASCO)  
**Alternative urban prospect:** Nakuru Water and Sanitation Services Company (NAWASSCO)  
**Institutional owner:** Not yet identified  
**Data access:** Not yet granted  
**Supabase:** Not connected; no production tenant migration or database change is authorized by this brief

---

## 1. The proposal

Atlas Sanctum proposes a bounded water-service reliability workflow with one water service provider (WSP) or county programme team.

The operational question:

> When a water service point experiences an interruption, can the responsible team see a traceable report, assess it, assign a response, record restoration evidence and review whether service was actually restored?

Atlas is not proposing to operate the water network, dispatch crews, certify water quality, replace the utility's billing or work-order platform, or make regulatory determinations. The operator retains authority over assets, customer service, maintenance and service restoration.

**The first value proposition is better visibility and accountability across the incident-to-restoration workflow.**

## 2. Why this is a credible problem area

The Water Services Regulatory Board (WASREB) describes its IMPACT report as a public accountability and performance tool. Its sector indicators include hours of supply, water quality, coverage, non-revenue water, metering, revenue collection efficiency, operating-cost coverage and staff productivity. These provide a credible sector context for a service-reliability workflow, but Atlas should not claim to calculate or improve regulated indicators without the relevant definitions and validated operator data. See the [WASREB Impact Reports](https://wasreb.go.ke/impact-reports/).

The Ministry of Water's published investment-planning description identifies coordination of water-infrastructure investment, project planning and last-mile connectivity as sector concerns. See [Water Sector Investment Planning](https://www.water.go.ke/water-sector-investment-planning).

The County Government of Nakuru hosts its 2023–2027 CIDP and associated public-participation report in its [official CIDP document repository](https://www.nakuru.go.ke/ova_doc/cidp/). These documents should be reviewed with the prospective partner to align a pilot to an actual county priority rather than assume one.

## 3. First prospect shortlist

These are research-based prospects, not existing Atlas partners or confirmed customers.

### Priority 1 — NARUWASCO (rural water-service operations)

NARUWASCO describes itself as a Nakuru County-owned water service provider. Its published service-area description covers Nakuru County except Nakuru and Naivasha urban centres, and it describes five operating regions/areas. It also states that its mandate includes provision of water services in its licensed area and development of county water-service assets. See its [About Us page](https://www.naruwasco.co.ke/about-us/).

**Why approach:** It is the most relevant first discovery prospect for a rural service-reliability workflow, subject to confirming current service boundaries, the right management contact and a suitable local service area.

**Proposed entry point:** Managing Director's office or the operational/technical manager responsible for a single area. Ask to be directed to the person accountable for customer complaints, network operations, maintenance/work orders and service continuity.

**Do not assume:** that NARUWASCO has agreed to participate, that its internal incident records are available, or that its current systems have the gaps Atlas hopes to address.

### Priority 2 — NAWASSCO (urban water-service operations)

NAWASSCO describes its mission as providing climate-resilient and sustainable water and sanitation solutions. Its published contact page lists the Managing Director's office at Nawassco Plaza, Government Road, Nakuru; toll-free line 0800-720036; technical hotline 0110842285; and emails `infor@nakuruwater.co.ke` and `custcare@nakuruwater.co.ke`. See [About NAWASSCO](https://nakuruwater.co.ke/about-us/) and [Contact NAWASSCO](https://nakuruwater.co.ke/contact-us/).

**Why approach:** It is the appropriate urban alternative if the first operating question concerns town distribution, supply interruptions or response coordination.

**Proposed entry point:** Managing Director's office or technical/customer-care operations lead. Request the right owner for one clearly bounded service area.

### Priority 3 — County Government of Nakuru, water department

The County is an appropriate coordination prospect where the issue concerns county water investments, community schemes or cross-provider coordination. Its official CIDP repository provides public planning context. The County's public contact page lists `info@nakuru.go.ke` and switchboard numbers; see the [CIDP and County contact page](https://www.nakuru.go.ke/ova_doc/cidp/).

**Why approach:** to understand county priorities and identify the proper asset/programme owner, not to assume the County should operate a WSP workflow.

### Technical and standards stakeholders

- **WASREB:** use its public performance indicators and standards as reference material; it is the regulator, not the default day-to-day pilot operator.
- **Central Rift Valley Water Works Development Agency:** explore only if the eventual use case concerns an applicable national public water works asset or development programme.
- **Water Sector Trust Fund:** consider as a later financing or programme-alignment prospect if the proposed intervention and eligibility fit its actual funding windows.

---

## 4. The bounded pilot design

### Proposed boundary

- One WSP or county programme owner.
- One operator-selected service area or scheme.
- A small asset sample, provisionally 10–20 service points if the operator's register and operational capacity support it.
- Approximately 4–6 weeks after data permissions and scope are agreed.
- No new sensors, hardware purchase, automated dispatch or large-scale network mapping in the first increment.

The sample size and duration are planning assumptions, not commitments. The operator should determine the service area and appropriate sample after reviewing data availability.

### The single workflow

1. **Register:** identify an approved service point/asset and its operator reference.
2. **Report:** record an interruption or service incident with the event time, reporting time, issue category, location and source.
3. **Triage:** show the incident, known history and evidence quality to an authorized operator.
4. **Decide:** the operator determines priority and response; Atlas preserves the rationale and authorizing actor.
5. **Assign:** record the responsible team or role, assignment time and target response.
6. **Record completion:** the operator records the work performed and restoration time.
7. **Verify:** a designated reviewer, distinct from the reporter where practical, checks the restoration evidence and records a verification decision.
8. **Review:** compare baseline and pilot-period workflow performance and document limitations.

Atlas recommendations, if any, are advisory. Rules and decision logic must be visible and agreed with the operator.

## 5. Measurement plan

Start with process measures that can be derived from records the operator already maintains.

| Measure | Definition | Minimum data required |
|---|---|---|
| Report-to-triage time | Triage timestamp minus reported timestamp | Reported and triaged times |
| Report-to-assignment time | Assignment timestamp minus reported timestamp | Reported and assigned times |
| Report-to-restoration time | Restoration timestamp minus reported timestamp | Reported and restored times |
| Verified closure rate | Closed incidents with an authorized verification event divided by all closed incidents | Incident status and verification records |
| Evidence completeness | Incidents with required source, times, location, category and notes divided by incidents reviewed | Required fields and review result |
| Repeat incident rate | Service points with a repeated same-category incident within an agreed window | Stable asset ID, category and incident times |

Do not set numerical improvement targets before the baseline is measured. Agree targets with the operator after reviewing historical records and the practical control the pilot team has over each interval.

**Primary candidate outcome:** change in median report-to-restoration time for the agreed incident classes and sample, interpreted against a baseline and clearly documented external factors.

**Supporting indicators:** report-to-assignment time, evidence completeness and authorized verified closure rate.

WASREB's broader indicators, such as hours of supply and water quality, should only be reported where the partner supplies validated measurements and the method is agreed. An incident-tracking pilot is not itself a water-quality test.

## 6. Minimum data dictionary

### Service point / asset
- Operator asset ID (preserve; do not replace).
- Display name and asset type.
- Scheme, service area and administrative location.
- Optional coordinates with coordinate reference system and capture method.
- Active/inactive status and effective date.
- Data source and date last confirmed.

### Incident
- Atlas incident ID and operator incident/reference ID.
- Asset ID.
- Issue category and concise description.
- Event/observed time, report received time and record-created time.
- Reporter role (not unnecessary personal details).
- Source/evidence reference and attachment permissions.
- Priority/severity as selected by authorized operator.
- Data quality, uncertainty and missing fields.
- Status and status-change history.

### Action / work item
- Linked incident ID.
- Action description and authorized priority.
- Responsible team/role and assignment time.
- Planned due time, start time and completion time.
- Operator work-order reference if one exists.
- Work performed and parts/material notes where the operator permits.

### Outcome / verification
- Linked action and incident IDs.
- Reported restoration time.
- Restoration evidence and source.
- Verification status: pending, verified, rejected or not verifiable.
- Verifier identity/role and verification time.
- Verification method and limitations.
- Reopened/repeat-incident link where applicable.

**Privacy:** Do not collect household names, telephone numbers, customer account numbers, precise household coordinates or beneficiary-level data in the first pilot. Use service-point or aggregated geography identifiers.

## 7. Data access and governance requirements

Before importing any operational data, agree a short data-sharing and pilot memorandum covering:

- Each party's role and authority.
- The purpose and exact dataset scope.
- Who owns source records and who may correct them.
- Permitted use, access roles and export permissions.
- Whether attachments or coordinates may include restricted information.
- Retention period and deletion/return procedure.
- Security incident notification and contact points.
- Whether any result may be publicly referenced or attributed.
- Approval of names, logos, case studies and public communications.

The operator remains the source of truth for authoritative asset, incident and work-order records. Atlas provides a controlled working layer and must never imply regulatory certification or independent verification it has not performed.

## 8. What Atlas should demonstrate

The first demonstration should use only synthetic fixtures labelled **DEMO DATA — NOT FIELD VERIFIED**.

Demonstrate:
- A small service-point register.
- Two or three synthetic incident records.
- Source and timestamp visibility.
- Clear status transitions.
- Recommendation rationale and limitations.
- A separate approval event.
- Action assignment.
- Outcome evidence with verification pending until a designated reviewer acts.
- Export of a decision/incident summary with source attribution.

Do not show synthetic counts as actual Nakuru service performance or display invented utility partners, field teams or customer outcomes.

## 9. Current product gaps to close before an institutional trial

The repository's current water pilot is user-scoped rather than organization/project-scoped. The current API:
- creates an incident and then creates a templated proposed action as a separate database write;
- allows a user to approve an action they own;
- records an outcome through the same user-scoped workflow and displays the outcome as verified;
- does not provide a separate verifier identity/role in the checked water-pilot schema;
- does not enforce an organization/project relationship;
- stores a free-text evidence description and optional source reference rather than a complete provenance record.

These are observations about the checked code and migration, not an assessment of a live production database.

### Required technical changes after Supabase inspection

1. Fix the incident/action write so related records are atomic (for example, a carefully permissioned database function or an application transaction pattern supported by the actual stack).
2. Introduce project/organization ownership only after the existing tenant schema and RLS are verified.
3. Separate `outcome recorded` from `outcome verified`; add a distinct verification event, actor and timestamp.
4. Require role-based approval/verification at database and server layers, not only via UI state.
5. Preserve operator references and append history for status changes.
6. Validate linked asset/incident/action ownership to prevent cross-owner parent-child references.
7. Improve API error handling so failed reads/writes are visible and do not silently appear as empty data.
8. Make timestamps, coordinate reference, source and status definitions consistent across imports and exports.

No production migrations should be applied before the live schema and policies are inspected.

## 10. First discovery conversation

Aim for a 30-minute operational conversation with the person responsible for water service operations, maintenance or customer complaints.

### Questions

1. Which team owns service interruption reporting and response for the area?
2. How are reports received today: call centre, WhatsApp, paper log, staff, SCADA or another system?
3. What is the authoritative service-point/asset register?
4. Is there an incident log with event, report, assignment and restoration timestamps?
5. How are incidents prioritized and assigned?
6. What evidence is required before an incident is closed?
7. Who is authorized to approve work and who independently confirms restoration?
8. What is the most frequent or costly interruption category in the proposed area?
9. Which operational decision would benefit from better visibility in the next 30–60 days?
10. What data may be shared for a controlled pilot, and what must remain within the operator's systems?

### Discovery success criteria

Do not count a polite meeting as pilot validation. A successful discovery step requires:
- A named operational owner.
- A specific, bounded service area or scheme.
- A real decision or recurring workflow problem.
- Confirmation that a suitable incident/asset dataset exists.
- Agreement on the next technical scoping session.
- A clear procurement, partnership or paid-pilot route.

## 11. Proposed engagement path

1. **Introductory discovery:** 30-minute discussion; no data transfer.
2. **Evidence & Decision Sprint:** assess one defined service-reliability question with client-authorized records; deliver a source register, gaps, workflow map and recommended pilot scope.
3. **Place-based pilot:** implement the agreed workflow in one area after data-sharing, role and security requirements are signed.
4. **Evaluation:** review process and service metrics with the operator; decide whether to stop, adjust or extend.

Commercial pricing should be finalized only after the dataset, number of assets, integration needs, security review, fieldwork and procurement route are understood. Existing website price ranges are indicative planning figures, not a validated quotation.

## 12. Outreach message

**Subject:** Exploratory discussion: water-service incident and restoration tracking pilot

Dear Managing Director / Operations Team,

I am reaching out from Atlas Sanctum, a Kenya-rooted technology initiative exploring practical ways to improve how institutions connect operational evidence, decisions and measurable outcomes.

We are developing a bounded water-service reliability workflow to help an operator trace a service interruption from its initial report through triage, assignment, restoration and review. The intention is not to replace existing utility systems or make operational decisions on the provider's behalf. The provider would retain control of its assets, work orders, priorities and approvals.

We would value a short introductory conversation with the person responsible for operations, maintenance or customer complaints to understand your current process, the records already available and whether one service area could be suitable for a small, jointly scoped discovery exercise.

At this stage, we are not assuming access to your operational data or proposing any public claims about your service performance. Any later data use would be subject to your authorization and agreed safeguards.

Would your team be open to a 30-minute discovery conversation, or could you direct us to the appropriate operational contact?

Kind regards,

Atlas Sanctum  
hello@atlasanctum.org  
https://atlassanctum.me

---

## 13. Immediate actions

| Owner | Action | Evidence of completion |
|---|---|---|
| Atlas | Confirm the first prospect and identify a named operational contact | Contact and role recorded in private pipeline |
| Atlas | Send the exploratory message and request a discovery call | Sent message and response, without claiming a relationship |
| Atlas | Prepare a 5-minute synthetic demo | Demo visibly labelled as synthetic |
| Prospective operator | Explain incident workflow and nominate process owner | Discovery notes approved by the participant |
| Joint | Select one service area and incident category | Written pilot boundary |
| Joint | Review dataset and permission constraints | Approved data inventory and data-sharing terms |
| Atlas engineering | Inspect Supabase schema and fix verification/tenant gaps | Reviewed migration plan and passing security tests |

**Current status:** No institutional owner, data-sharing agreement, pilot approval or field validation is in place. The next measurable achievement is a discovery conversation with an accountable water-service operator.


## 14. Local discovery refinement — Rongai / Mosop

The operator's published coverage page lists Rongai among its Western operating areas. The user's broad location context is Mosop, Nakuru County; this makes a Rongai-area discovery conversation geographically relevant, but it does **not** establish that any particular water point, community or household is within NARUWASCO's licensed service boundary. Confirm the exact scheme, operator and service-point ownership with NARUWASCO before choosing a pilot site. See the operator's [coverage and maps](https://www.naruwasco.co.ke/home/) and [contact page](https://www.naruwasco.co.ke/contact-us/).

**Recommended first question:** Does the Western Area team have one service scheme in or near Rongai with a recurring, documented interruption/maintenance workflow that could be reviewed using existing non-personal records?

**Published NARUWASCO contact details (verify before sending):**
- Email: info@naruwasco.co.ke
- Customer care: +254 774 389 372 / +254 791 389 372
- Headquarters: Stanley Mathenge Road, Industrial Area, Nakuru
- [Official contact page](https://www.naruwasco.co.ke/contact-us/)

The first contact should request routing to the operational owner. Customer-care channels are published for customer complaints and should not be treated as a confirmed partnership or procurement contact.
