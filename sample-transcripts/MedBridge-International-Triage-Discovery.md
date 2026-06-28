# Discovery Call Transcript
**Customer:** MedBridge Global Health Systems
**Use Case:** International Patient Triage — Medical Record Analysis & Routing
**Date:** June 27, 2026
**Attendees:**
- Srujan Gaddam (FDE, UiPath)
- Dr. Sarah Chen (Medical Director, International Operations — MedBridge)
- Marcus Webb (VP of IT Infrastructure — MedBridge)
- Priya Nair (Head of Clinical Triage Operations — MedBridge)
- James Okafor (CFO — joined for first 15 minutes)

---

**[00:02]**

**Srujan:** Thanks everyone for making time. Dr. Chen, I know you gave me a quick summary before the call, but for the full group — can you walk me through what actually happens today when a new international patient case lands in your system? Like, one case, start to finish, from the moment it hits your queue.

**Dr. Chen:** Sure. So we receive referrals from partner hospitals — we have about 340 partner institutions across 15 countries, primarily in Southeast Asia, the Gulf states, and West Africa. When a referral comes in, it arrives as a packet. Typically a PDF — sometimes a bundle of scanned documents — containing the patient's medical history, current diagnosis, recent labs, imaging reports, and a referral letter from the treating physician.

**Priya:** And those packets are... inconsistent, to put it diplomatically. We get records in English, Arabic, Bahasa, sometimes handwritten Tamil notes attached to typed summaries.

**Dr. Chen:** Right. So a triage nurse receives the packet in our queue system — we use a custom-built portal called MedTrack — and their job is to read through everything, extract the key clinical indicators, determine the urgency classification — we have five levels, from Level 1 which is immediate life-threatening to Level 5 which is elective — assign it to the right specialist team, and flag any missing information we need from the referring hospital before we can proceed.

**Srujan:** And roughly how long does that take per case?

**Priya:** For a straightforward case — clean records, English language, clear diagnosis — maybe 25 to 35 minutes. For a complex case with missing labs, multiple comorbidities, records in another language — we've seen cases take two, two and a half hours. Average across all cases is probably 55 minutes.

**Srujan:** And what's your weekly volume?

**Priya:** Right now we're processing between 180 and 220 referrals per week. It spikes around our Gulf hospital partnership renewals — we'll hit 280, 300 in a big week. We're projecting to hit 400 per week by Q1 next year based on three new partnership agreements we're finalizing.

**James Okafor:** And that's where the economics break. We can't hire our way to 400 cases a week. Our triage nurses are licensed RNs — fully loaded cost is around $95 to $110 per hour. At 55 minutes a case, that's roughly $87 to $100 per case in labor alone, before any overhead.

**Srujan:** That's a meaningful number. James, before you drop off — is this initiative funded? Is there a budget allocated?

**James:** There's a $2.1 million budget approved for clinical AI initiatives this fiscal year. This triage automation is the anchor project. Sarah and I have already signed off on it internally. The board knows about it. So yes — it's funded, it's a priority.

**Srujan:** Perfect. And who's the executive sponsor day to day — who's accountable for this project succeeding?

**James:** Sarah is the clinical sponsor. I'm the financial sponsor. Marcus owns the technical execution. That's our triad. Sarah, you want to take it from here — I need to jump to another call.

**Dr. Chen:** Of course. Thanks James.

**[00:18]**

**Srujan:** Dr. Chen — let me push on the decision logic a bit, because that's really where I want to understand if this is right for an agentic approach. When a triage nurse looks at a packet, what is the actual decision they're making? Like, what are the possible outputs of their work?

**Dr. Chen:** There are really three outputs. First, urgency classification — Level 1 through 5. Second, specialist routing — we have 11 specialist teams, oncology, cardiology, neurology, orthopedic, and so on. Third, a status decision — either "accepted and routed," "pending — missing information," or "declined — outside scope of care."

**Srujan:** And is that urgency classification rules-based, or is it judgment?

**Dr. Chen:** Both, and that's the honest answer. We have a clinical protocol document — it's about 60 pages — that lays out the criteria. For example, any patient with a MEWS score above 5 is automatically Level 1. Certain cancer staging criteria map directly to Level 2. But then you get a case where someone has three moderate-severity conditions simultaneously and the protocol doesn't tell you how to weigh them against each other. That's where the nurse's clinical judgment comes in.

**Priya:** The easy majority — I'd say 65, maybe 70 percent of cases — are fairly deterministic. The nurse is essentially following a protocol. But the remaining 30 percent require genuine clinical reasoning.

**Srujan:** That's an important number. Can you show me that protocol document?

**Dr. Chen:** Yes, I'll send it to you after this call. It's been through three revision cycles in the last 18 months, most recently in March when we updated our oncology criteria based on new WHO staging guidelines.

**Srujan:** March — so relatively recent. Has the data you have from before March become unreliable as a training baseline?

**Dr. Chen:** That's a good question. The March changes affected about 15 percent of case types. Cases before that date would be classified differently under the new protocol in those categories.

**Marcus:** Which means if we're training anything on historical data, we need to filter by case type post-March. I've already flagged this to our data team.

**[00:31]**

**Srujan:** Let's talk data. Where do the records physically live today?

**Marcus:** The referral packets land in an S3 bucket — encrypted at rest, AES-256. MedTrack pulls from there. We have roughly 34,000 historical cases going back four years. About 28,000 have a completed triage decision attached, which is your labeled set.

**Srujan:** 28,000 labeled cases — that's actually a strong starting point. How were they labeled? By the triage nurse who processed the case?

**Priya:** Yes. The nurse selects the classification, the routing, and the status directly in MedTrack. So every historical case has a machine-readable outcome attached.

**Srujan:** And the quality — is there variance in how different nurses apply the criteria?

**Dr. Chen:** *(pause)* Yes. We have 14 triage nurses. I'd say 4 of them are senior enough that their classifications are consistently reliable. The others — there's meaningful inter-rater variability, particularly on the borderline Level 2 / Level 3 cases. We did an internal audit last year. On a blind re-classification of 200 cases, our senior nurses agreed with each other 91 percent of the time. When we included all nurses, it dropped to 78 percent.

**Srujan:** That's important to know. It means your ground truth is imperfect. We'd want to build the training set from senior nurse classifications, not the full pool.

**Dr. Chen:** Agreed. And we have those flagged in the system — nurse seniority level is recorded per case.

**Srujan:** What about the actual medical records — the PDF packets? What's the quality like?

**Priya:** Honestly, it's the biggest challenge. Some partner hospitals send beautifully structured HL7-compliant documents. Others — and I'm thinking of some of our West African partners — send handwritten notes, sometimes photographs of paper records. We have one partner that sends everything as a single 40-megabyte scanned PDF with no OCR layer. We basically read those by eye.

**Marcus:** We've experimented with Textract and a couple of IDP vendors on those. Accuracy on the handwritten content is around 60 to 65 percent. Structured PDFs we can hit 94, 95 percent with existing tools.

**[00:44]**

**Srujan:** Let me ask about errors, because in healthcare this is where I need to be really direct with you. If the AI makes a wrong classification — specifically if it under-classifies an urgent case — what actually happens?

**Dr. Chen:** *(long pause)* In the worst case, a Level 1 patient gets treated as a Level 3 and doesn't get fast-tracked to an ICU bed reservation or specialist availability check. We've never had a patient death we could attribute directly to a triage delay — but there have been cases where delayed routing extended time-to-treatment. Our SLA with partner hospitals is 4 hours for Level 1 cases, 24 hours for Level 2, 72 hours for Level 3 through 5.

**Srujan:** So under-classification of a Level 1 is catastrophically worse than over-classification.

**Dr. Chen:** Yes. An over-classified case wastes specialist time and resource allocation. An under-classified urgent case is a patient safety event. They are not symmetric errors.

**Srujan:** This is a critical input for how we design the system. Any autonomous classification for Level 1 and Level 2 cases would need human-in-the-loop validation before routing. We cannot have the agent autonomously routing those — it surfaces a classification and flags it for a senior nurse to confirm. Does that model work for you operationally?

**Dr. Chen:** That's the only model I'd accept for Level 1. For Level 2 I'd want to see performance data before we decide. For Level 3 through 5, if the accuracy is there, autonomous routing is acceptable.

**Priya:** And honestly, that would still save us significant time. Level 3 through 5 is about 55 percent of our volume.

**[00:57]**

**Srujan:** Marcus, let me shift to infrastructure. If we build this — where does the agent's output need to go? Does it write back into MedTrack, or is there a separate workflow?

**Marcus:** MedTrack has an API. It's documented — I can share the Swagger spec. A classification and routing decision gets posted as a structured JSON payload and MedTrack handles the assignment from there. We've already built webhook integration with two other vendors, so the integration pattern is established.

**Srujan:** Real-time or batch?

**Marcus:** The Level 1 and 2 cases need to be sub-4-hours from receipt to classification. Level 3 through 5 — batch is fine. We could run those every 2 hours and nobody would notice.

**Srujan:** PII and data residency — what's the constraint?

**Marcus:** HIPAA obviously. We have a BAA framework established. We also have a contractual commitment to some Gulf state partners that patient data cannot leave certain geographic regions. Practically, that means the UAE and Saudi patient records cannot be processed on US-based infrastructure. We'd need model inference to run in a regional Azure or AWS deployment.

**Srujan:** That's a significant architectural constraint I want to make sure we scope correctly. It may affect model selection — some of the most capable models aren't available in those regions.

**Marcus:** I know. We've been through this with our existing IDP vendor. It's solvable but it adds complexity.

**[01:08]**

**Srujan:** Let me ask about the competitive landscape. Have you looked at other vendors for this?

**Dr. Chen:** We evaluated three platforms over the last 8 months. One was a healthcare-specific AI vendor — Triage AI, based in Boston — they had strong clinical NLP but their integration story was weak and their pricing was per-case which would be prohibitive at our projected volumes. The second was a large EHR vendor's AI module — it only works with HL7 FHIR-structured data, which rules out probably 35 percent of our inbound records. The third was building in-house with our data science team — we don't have the capacity.

**Srujan:** Why UiPath specifically?

**Dr. Chen:** Combination of things. We already use Orchestrator for some back-office automation. Marcus knows the platform. And frankly, the agent orchestration story — the ability to combine document intelligence, LLM reasoning, and structured workflow in one platform — matched what we need better than anything else we evaluated.

**[01:15]**

**Srujan:** What does "good enough to ship" look like for you? What's the bar for v1?

**Dr. Chen:** On urgency classification: I want to see 95 percent agreement with senior nurse decisions on Level 3 through 5 cases in a blind holdout set. For Level 1 and Level 2, I want to see that the model flags every actual Level 1 case — I'll accept false positives, I will not accept false negatives. Zero missed Level 1s in our validation set.

**Priya:** And for routing — we'd want 90 percent correct specialist assignment. The 10 percent errors are caught by the receiving specialist team anyway, so that's recoverable.

**Srujan:** Who signs off on that validation?

**Dr. Chen:** Me and our Chief Medical Officer. It won't go live without both of us signing off. I want to be explicit about that.

**Srujan:** Understood. When does this need to be live?

**Priya:** The three new partnership agreements go live in Q1 — January 15th is the first one. We need the system operational by December 1st to give ourselves a 6-week parallel run period before we go live at scale.

**Srujan:** December 1st. That's aggressive given we're at end of June. I want to be honest with you — that's 5 months. The build is feasible, but the validation, the regulatory review, the production hardening — we need to start immediately and we can't have any delays on data access.

**Marcus:** Data access is already provisioned. I can give you read access to the anonymized development dataset by Monday.

**[01:24]**

**Srujan:** Post-launch — who owns this in production? My engagement has a 90-day post-go-live support period. After that?

**Marcus:** We have a platform engineering team of 6. Two of them are already UiPath certified. They'd take over monitoring and L1 support. For model retraining and clinical protocol updates, we'd need a process — probably quarterly, driven by Dr. Chen's team when protocols change.

**Dr. Chen:** Every time we update the clinical protocol — which happens roughly twice a year — the model needs to be retrained or at minimum re-validated. That can't be a 6-month waiting period.

**Srujan:** Agreed. We'd build a retraining pipeline into the initial architecture. Protocol changes trigger a validation run, not a full rebuild.

**Priya:** One more thing I want to raise. Our nurses are concerned. Not everyone on my team sees this as a positive development. A few of the more senior nurses have been very vocal — they feel like this is the first step toward replacing them. I want to make sure we address that head-on in how we position the rollout.

**Srujan:** That's one of the most important things you've said in this whole conversation. How that change management story is told is going to make or break adoption. Who owns that?

**Priya:** That's me. HR is aware. We're planning a town hall in September. But I'd want to show the team that the agent handles the mechanical 70 percent so they can focus on the complex 30 percent that actually requires their clinical judgment. That's the framing.

**Srujan:** That's exactly the right framing. And it's true — that 30 percent of hard cases is where their expertise is irreplaceable.

**[01:33]**

**Srujan:** Last question — and this one is a bit political. Who in your organization has had a bad experience with an AI project before, and who might push back on this?

**Dr. Chen:** *(laughs)* Our Chief of Compliance, Dr. Anand Mehta. He shut down a predictive readmission model we piloted in 2023 because the training data had demographic bias and the vendor couldn't explain the model's decisions in terms the clinical team could understand. He's going to want full model explainability and he's going to want to be in the room early.

**Marcus:** He's not wrong to want that. I'd rather have him engaged now than blocking us in November.

**Srujan:** Completely agree. Let's get Dr. Mehta scheduled into the next conversation — I'd rather have that explainability conversation early and design for it than retrofit it at the end.

---

**[01:38 — Call End]**

**Post-call notes from Priya Nair:**
- Need to confirm with Marcus: are the pre-March 2026 cases tagged by case type in MedTrack so we can filter during data prep?
- Legal review of AI-assisted clinical decision support will be required — compliance team owns this — timeline unknown but historically takes 6-8 weeks
- The handwritten records from 3 West African partners may need to be excluded from v1 scope — discuss with Srujan
- Follow up: Srujan requested protocol document (60pp clinical criteria) and MedTrack Swagger spec by EOD Monday
