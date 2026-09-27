# Alumni Relations Module — Design Document

**EduSaaS Africa**
**Version:** 0.1 (Draft)
**Date:** June 2026
**Authors:** Gaston Jarju, Liberty Mupotsa

---

## 1. Survey Findings Summary

We ran alumni surveys in both pilot markets. These findings directly inform feature prioritization.

### The Gambia — 38 responses

**Pilot school:** St. Peter's Technical Junior & Senior Secondary School, Lamin (~22 of 38 responses came from St. Peter's alumni)

| Metric | Finding |
| :---- | :---- |
| Graduation era | 79% graduated 2010–2019 |
| Want to reconnect | 45% said "No, but I would like to be" in contact — the single largest group |
| Currently in touch | 32% "Yes, occasionally", 11% "Yes, regularly" |
| Not interested | Only 3% (1 respondent) |
| Top channel today | WhatsApp groups (75% of respondents) |
| Second channel | Word of mouth from other alumni (40%) |
| Facebook | 35% |
| School website | Only 10% — almost no one gets info from a school site today |

**What alumni want most on a school website (top 3):**

1. School news and announcements — 85%
2. Information about upcoming events or reunions — 65%
3. A directory to find and connect with other alumni — 55%
4. Exam results and academic updates — 55%
5. Admissions information — 35%
6. Staff directory — 25%

**Preferred channel for updates:**

1. WhatsApp — 58%
2. "I would check a school website myself" — 45%
3. Email — 35%
4. SMS — 10%

**Key qualitative themes from open-ended responses:**

- "Create an Alumni group for the ex student" — repeated demand for formal alumni networks
- "The administration should engage with the alumni by inviting them to career day" — mentorship desire
- "School Portal system" — a teacher who is also an alumnus wants a proper portal
- "Regular updates about opportunities, alumni events, career guidance" — information hunger
- "Yearly gathering with former students" — reunion demand

**Takeaway:** Gambian alumni are hungry to reconnect. WhatsApp is the dominant channel, but there is strong willingness to use a school website if one existed. The alumni directory is a high-demand feature — people want to find each other.

---

### Zimbabwe — 17 responses

**Pilot school:** Kriste Mambo High School (~7 of 17 responses)

| Metric | Finding |
| :---- | :---- |
| Graduation era | 59% graduated 2010–2019, 18% before 2000 |
| Want to reconnect | 35% said "No, but I would like to be" |
| Not interested | 29% (significantly higher than Gambia) |
| Currently in touch | 24% "Yes, occasionally", 6% "Yes, regularly" |
| Top channel today | WhatsApp groups (53%) |
| Word of mouth | 41% |
| Facebook | 41% |
| School website | 12% |

**What alumni want most on a school website (top 3):**

1. A directory to find and connect with other alumni — 65%
2. Information about upcoming events or reunions — 59%
3. Exam results and academic updates — 53%
4. School news and announcements — 47%
5. Admissions information — 47%
6. Staff directory — 24%

**Preferred channel for updates:**

1. "I would check a school website myself" — 53%
2. Email — 47%
3. WhatsApp — 29%

**Key qualitative themes:**

- "Invite us to specific programs or even just career guidance. Introduce Fair Week where we tell them about life after school" — strong mentorship angle
- "A database would be nice" — explicit demand for alumni data
- "Host reunion events every 5 years" — structured reunion cadence
- "Start a website" — multiple respondents echo this

**Takeaway:** Zimbabwean alumni lean more toward self-service (website) and email vs. WhatsApp. There is higher indifference ("not interested" at 29%), which means the product must deliver value immediately or it will be ignored. The alumni directory is the #1 demand — even higher than school news.

---

### Cross-Market Insights

| Insight | Implication |
| :---- | :---- |
| Alumni directory is top-3 in both markets | Build this first. It is the hook. |
| WhatsApp dominates in Gambia; website + email in Zimbabwe | Support both. WhatsApp notification integration + a standalone web portal. |
| "Not interested" is 3% in Gambia vs 29% in Zimbabwe | Gambia is the warmer market for alumni features. Lead pilot engagement there. |
| Events/reunions consistently top-3 | Event management is a core V1 feature, not a nice-to-have. |
| Exam results requested by >50% in both markets | Integrate academic data display into the alumni-facing school profile. |
| Career guidance / mentorship is a qualitative theme in both | Build mentorship matching into V2. |
| Almost nobody currently uses a school website | We are creating a new habit, not replacing one. Onboarding UX is critical. |

---

## 2. Feature Specification — Alumni Relations V1

### 2.1 Feature Priority (MoSCoW)

#### Must Have (V1 — Pilot Launch)

**A1. Alumni Directory**

- Alumni can create a profile: name, graduation year, class/section, current city, current profession, bio (optional), profile photo (optional)
- Browse and search alumni by: graduation year, name, city, profession
- Filter by class year groups (e.g., "Class of 2015")
- Privacy controls: alumni choose what is visible (name always visible, other fields opt-in)
- Contact: "Send a message" button that opens a WhatsApp deep link or an in-platform message request (no phone numbers exposed publicly)

**A2. Class Year Groups**

- Auto-generated groups based on graduation year
- Each group has a simple feed: text posts, photos, and links
- Any group member can post
- Notifications for new posts (in-app + optional WhatsApp)

**A3. School News Feed (Alumni View)**

- School administrators publish news/announcements from the dashboard
- Alumni see these on their portal and can react (like) or comment
- RSS-style feed, reverse chronological
- Push notification to alumni when school publishes news (via PWA push or WhatsApp)

**A4. Event Management**

- School or alumni committee creates events (reunions, career days, fundraisers)
- Event details: title, description, date/time, location (physical or virtual link), cover image
- RSVP functionality (Going / Maybe / Not Going)
- Attendee list visible to other RSVPs
- Share event via WhatsApp deep link (pre-formatted message with link)

**A5. Basic Alumni Registration Flow**

- Phone-based signup (OTP via WhatsApp or SMS)
- Select school from directory → claim alumni status
- Enter graduation year + some verification question (e.g., "Name one of your teachers" or "What was your house/dorm?") — lightweight verification, not bulletproof
- Profile creation wizard (3 steps max)

#### Should Have (V1.1 — Post-Pilot)

**A6. Donation / Give-Back**

- School sets up a fundraising campaign (title, goal amount, description, deadline)
- Alumni can contribute via Wave (Gambia), EcoCash/Innbucks (Zimbabwe), or card/Stripe (diaspora)
- Progress bar showing amount raised vs goal
- Donor wall (public or anonymous, donor's choice)
- Transaction receipts via WhatsApp or email

**A7. Mentorship Matching (Simple)**

- Alumni opt in as "Available to mentor"
- Specify areas: career guidance, university applications, subject tutoring, general advice
- Current students or younger alumni can browse mentors and send a connection request
- Connection happens via WhatsApp deep link (V1) or in-platform messaging (V2)

**A8. School Profile (Public)**

- Public-facing school page with: about, history, photos, achievements, contact info
- Current exam results / academic performance summary
- Staff directory (names and roles, no contact details unless school opts in)
- Link to admissions information

#### Could Have (V2)

- **A9. Job Board** — Alumni post job opportunities; other alumni can apply
- **A10. Alumni Chapters** — Location-based groups (e.g., "St. Peter's Alumni — Banjul", "Kriste Mambo Alumni — Diaspora UK")
- **A11. In-Platform Messaging** — Direct messages between alumni without exposing phone numbers
- **A12. Alumni Verification by School Admin** — School can verify/approve alumni claims
- **A13. Analytics Dashboard** — School sees: total alumni registered, engagement rate, donations raised, event attendance
- **A14. SMS/WhatsApp Broadcast** — School sends bulk updates to alumni via SMS or WhatsApp (requires opt-in)

#### Won't Have (V1)

- Native mobile app (PWA only for now)
- Video hosting or streaming
- LMS / academic content delivery
- Integration with government EMIS systems (Phase 2+)
- Multi-language UI (English only for V1; i18n architecture in place for V2)

---

## 3. Data Model (Drizzle Schema — Key Tables)

```
// ─── Core Tables ───

schools
  id              uuid PK
  name            text NOT NULL
  slug            text UNIQUE NOT NULL       // URL-friendly: "st-peters-lamin"
  country         text NOT NULL              // "GM" | "ZW"
  school_type     text                       // government | private | mission | madrassa
  description     text
  logo_url        text
  cover_image_url text
  contact_email   text
  contact_phone   text
  address         text
  city            text
  website_domain  text                       // custom domain if premium
  tier            text DEFAULT 'free'        // free | standard | premium | enterprise
  created_at      timestamp DEFAULT now()
  updated_at      timestamp DEFAULT now()
  deleted_at      timestamp

// ─── Users & Alumni ───

users
  id              uuid PK
  phone           text UNIQUE NOT NULL       // E.164 format: +2203121164
  name            text
  role            text NOT NULL              // alumni | school_admin | super_admin
  avatar_url      text
  created_at      timestamp DEFAULT now()
  updated_at      timestamp DEFAULT now()

alumni_profiles
  id              uuid PK
  user_id         uuid FK → users.id UNIQUE
  school_id       uuid FK → schools.id
  graduation_year integer NOT NULL
  class_section   text                       // "Form 5A", "Upper 6 Arts"
  current_city    text
  current_country text
  profession      text
  employer        text
  bio             text
  linkedin_url    text
  is_verified     boolean DEFAULT false      // verified by school admin
  is_mentor       boolean DEFAULT false      // opted in as mentor
  mentor_areas    text[]                     // ["career", "university", "tutoring"]
  visibility      jsonb DEFAULT '{"city":true,"profession":true,"bio":true,"employer":false}'
  created_at      timestamp DEFAULT now()
  updated_at      timestamp DEFAULT now()

// ─── Class Year Groups ───

class_groups
  id              uuid PK
  school_id       uuid FK → schools.id
  graduation_year integer NOT NULL
  name            text                       // auto: "Class of 2015"
  UNIQUE(school_id, graduation_year)

class_group_posts
  id              uuid PK
  class_group_id  uuid FK → class_groups.id
  author_id       uuid FK → users.id
  content         text NOT NULL
  image_url       text
  created_at      timestamp DEFAULT now()

// ─── Events ───

events
  id              uuid PK
  school_id       uuid FK → schools.id
  created_by      uuid FK → users.id
  title           text NOT NULL
  description     text
  event_date      timestamp NOT NULL
  end_date        timestamp
  location        text
  location_type   text DEFAULT 'physical'    // physical | virtual | hybrid
  virtual_link    text
  cover_image_url text
  is_published    boolean DEFAULT false
  created_at      timestamp DEFAULT now()

event_rsvps
  id              uuid PK
  event_id        uuid FK → events.id
  user_id         uuid FK → users.id
  status          text NOT NULL              // going | maybe | not_going
  created_at      timestamp DEFAULT now()
  UNIQUE(event_id, user_id)

// ─── News / Announcements ───

school_posts
  id              uuid PK
  school_id       uuid FK → schools.id
  author_id       uuid FK → users.id
  title           text NOT NULL
  content         text NOT NULL
  image_url       text
  is_published    boolean DEFAULT true
  created_at      timestamp DEFAULT now()

post_reactions
  id              uuid PK
  post_id         uuid FK → school_posts.id
  user_id         uuid FK → users.id
  type            text DEFAULT 'like'
  UNIQUE(post_id, user_id)

// ─── Donations (V1.1) ───

campaigns
  id              uuid PK
  school_id       uuid FK → schools.id
  title           text NOT NULL
  description     text
  goal_amount     integer                    // in smallest currency unit
  currency        text DEFAULT 'GMD'         // GMD | USD | ZWL
  deadline        timestamp
  is_active       boolean DEFAULT true
  created_at      timestamp DEFAULT now()

donations
  id              uuid PK
  campaign_id     uuid FK → campaigns.id
  donor_id        uuid FK → users.id
  amount          integer NOT NULL
  currency        text NOT NULL
  payment_method  text                       // wave | ecocash | stripe
  payment_ref     text                       // external transaction ID
  is_anonymous    boolean DEFAULT false
  status          text DEFAULT 'pending'     // pending | completed | failed
  created_at      timestamp DEFAULT now()
```

---

## 4. Page Architecture & Routes

```
/ (marketing)
├── /                                  Landing page
├── /about                             About EduSaaS
├── /pricing                           Tier comparison
└── /register-school                   School onboarding wizard

/[schoolSlug] (school public site)
├── /                                  School homepage (template)
├── /about                             About the school
├── /admissions                        Admissions info + application form
├── /news                              School news feed
├── /events                            Upcoming events
├── /gallery                           Photo gallery
├── /staff                             Staff directory
└── /alumni                            Alumni portal entry point
    ├── /                              Alumni directory (browse/search)
    ├── /register                      Alumni registration flow
    ├── /profile/[userId]              Individual alumni profile
    ├── /class/[year]                  Class year group feed
    ├── /events                        Alumni-specific events
    └── /donate                        Donation campaigns

/dashboard (school admin, auth required)
├── /                                  Overview / stats
├── /news                              Manage news posts
├── /events                            Manage events
├── /alumni                            View/verify alumni
├── /site                              Edit school website content
├── /settings                          School settings, branding
└── /campaigns                         Manage donation campaigns
```

---

## 5. UI/UX Design Guidelines

### Design Philosophy

The alumni portal must feel like coming home — warm, familiar, community-oriented. It is NOT an enterprise admin tool. Think social network for a school community, not a CRM.

### Key UX Patterns

**Alumni Directory (the hero feature):**

- Grid layout of alumni cards on desktop; vertical list on mobile
- Each card: photo (or initials avatar), name, graduation year, city, profession
- Tap card → full profile
- Sticky search bar at top with filters: graduation year (dropdown), city (text), name (search)
- "Invite a classmate" button that generates a WhatsApp share link

**Class Year Group Feed:**

- Feels like a simplified WhatsApp group or Facebook group
- Reverse-chronological posts with author name, time, content, optional image
- Simple compose box at top: text input + image upload
- "Share to WhatsApp" on each post for easy external sharing

**Event Cards:**

- Visual card with cover image, title, date, location
- Clear RSVP buttons: "Going" (green), "Maybe" (amber), "Can't Make It" (gray)
- Attendee count and avatars shown
- "Share via WhatsApp" prominent — this is how events spread in both markets

**Registration Flow (3 screens max):**

1. Phone number → OTP verification
2. Select your school → Enter graduation year → Verification question
3. Complete profile (name, city, profession, photo — all optional except name)

### Visual Style

```
Card radius:       12px
Card shadow:       0 1px 3px rgba(0,0,0,0.08)
Spacing unit:      4px base (8, 12, 16, 24, 32, 48)
Button height:     48px minimum (Transsion touch target requirement)
Input height:      48px minimum
Font size body:    16px minimum (prevents iOS zoom on focus AND readable on 720p)
Font size small:   14px (metadata, timestamps only)
```

### WhatsApp Integration Pattern

WhatsApp is the connective tissue between the platform and the real world. Every shareable action should generate a pre-formatted WhatsApp message:

**Share Alumni Profile:**

> Check out [Name]'s alumni profile from [School]! 🎓 [URL]

**Share Event:**

> You're invited! 🎉 [Event Name] at [School] on [Date]. RSVP here: [URL]

**Invite Classmate:**

> Hey! Join the [School] alumni network. Find your old classmates here: [URL] 🏫

Use `https://wa.me/?text=` deep links. These work universally on all Android versions and Transsion overlays.

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────┐
│               Client (Browser/PWA)           │
│  Next.js App Router + React Server Components │
│  Service Worker (offline cache + bg sync)    │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│               Vercel Edge                    │
│  Middleware: auth check, tenant routing      │
│  Edge functions: OTP validation, rate limit  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Next.js Server (Node.js)           │
│  Server Actions: CRUD mutations              │
│  API Routes: webhooks, external integrations │
│  Drizzle ORM → PostgreSQL                    │
└─────┬────────────┬────────────┬─────────────┘
      │            │            │
┌─────▼───┐  ┌─────▼──────┐  ┌──▼───────────┐
│ Neon    │  │ Cloudflare │  │   External   │
│ Postgres│  │ R2 (media) │  │   Services   │
│         │  │            │  │ Twilio, Wave │
│         │  │ CDN (sites)│  │ EcoCash,     │
│         │  │            │  │ Stripe       │
└─────────┘  └────────────┘  └──────────────┘
```

### Performance Budgets

| Metric | Target | Why |
| :---- | :---- | :---- |
| First Contentful Paint | < 2.0s on 3G | Users on Infinix Hot will bounce after 3s |
| Largest Contentful Paint | < 3.5s on 3G | Hero image/directory must load fast |
| Total JS bundle (initial) | < 200KB gzipped | 2GB RAM devices choke on large bundles |
| Time to Interactive | < 4.0s on 3G | Must feel responsive, not frozen |
| PWA install size | < 5MB | Storage pressure on 32GB devices |
| Image max size (uploaded) | 500KB (auto-compressed) | Save data costs for users |

### Image Pipeline

All uploaded images (profile photos, event covers, school gallery) go through:

1. Client-side compression before upload (browser `canvas` API, target 500KB max)
2. Server-side resize to multiple variants: thumbnail (150x150), card (400x300), full (800x600)
3. WebP conversion (85% quality) — supported on all Android Chrome versions
4. Store variants in Cloudflare R2
5. Serve via Cloudflare CDN with aggressive cache headers

---

## 7. Security & Privacy

- **Phone numbers are never exposed publicly.** Alumni contact each other through WhatsApp deep links (which only reveal the phone if the user clicks through) or in-platform requests (V2).
- **Alumni profile visibility is opt-in per field.** Default: name + graduation year visible. Everything else must be explicitly toggled on.
- **School data isolation.** Every database query for alumni data must include `WHERE school_id = :schoolId`. This is enforced via Drizzle query helper wrappers.
- **OTP rate limiting.** Max 5 OTP requests per phone number per hour. Prevents SMS pump abuse.
- **GDPR-lite approach.** Alumni can delete their account and all associated data at any time. Export profile data as JSON on request.

---

## 8. WhatsApp & SMS Notification Strategy

| Event | Channel | Frequency |
| :---- | :---- | :---- |
| OTP verification | WhatsApp (primary), SMS (fallback) | On-demand |
| New school news post | WhatsApp push (if opted in) | Max 2/week |
| Event invitation | WhatsApp push | Per event |
| Event reminder | WhatsApp push | 24hr before |
| Donation campaign launch | WhatsApp push (if opted in) | Per campaign |
| New alumni joined your class year | In-app notification only | Real-time |
| Mentorship request | WhatsApp push | Per request |

**Cost management:** WhatsApp Business API conversation-based pricing. Estimate $0.02–0.05 per conversation. At 500 alumni, budget ~$25–50/month for notifications. Use in-app notifications as primary and WhatsApp as opt-in secondary.

---

## 9. Metrics to Track (V1)

| Metric | Target (3 months post-launch) |
| :---- | :---- |
| Alumni registered per pilot school | 50+ |
| Monthly active users (MAU) | 30% of registered |
| Profile completion rate | 60%+ have city + profession |
| Event RSVP rate | 20%+ of alumni RSVP to at least one event |
| Class group post rate | 5+ posts/month per active class group |
| WhatsApp share rate | 10%+ of users share at least one link |
| NPS (via in-app survey) | 30+ |

---

## 10. Development Phases & Milestones

### Sprint 1 (Week 1–2): Foundation

- Project scaffold: Next.js + Tailwind + Drizzle + Neon
- Database schema: schools, users, alumni_profiles, class_groups
- OTP auth flow (phone → WhatsApp/SMS → verify → session)
- Basic school public page (template with hardcoded pilot school data)

### Sprint 2 (Week 3–4): Alumni Core

- Alumni registration flow (3-step wizard)
- Alumni directory: browse, search, filter by year
- Alumni profile page (view + edit own)
- Class year group auto-creation

### Sprint 3 (Week 5–6): Engagement

- Class year group feeds (post + view)
- Event creation + RSVP
- School news feed (admin publish + alumni view)
- WhatsApp deep link sharing on all shareable content

### Sprint 4 (Week 7–8): Polish & Launch

- PWA manifest + service worker + offline fallback
- Performance optimization (Lighthouse ≥ 80)
- Transsion device testing (real device or emulation)
- Pilot school onboarding (data entry, admin training)
- Soft launch with pilot schools' alumni WhatsApp groups

### Post-V1

- Donation campaigns (V1.1)
- Mentorship matching (V1.1)
- School website template builder (parallel track)
- Admin analytics dashboard

---

## 11. Open Questions

1. **School verification of alumni:** How strict should this be for V1? A simple honor system with optional admin verification seems right for pilot. Full verification adds friction that could kill early adoption.

2. **Cross-school alumni visibility:** Can alumni from one school see alumni from another? Probably not in V1 — each school is a silo. But cross-school features (e.g., "St. Peter's vs Nusrat alumni mixer") could be powerful in V2.

3. **WhatsApp vs. in-app messaging:** Survey data strongly favors WhatsApp. But WhatsApp deep links expose phone numbers. Should we build basic in-app messaging for V1 or defer?

4. **School admin buy-in:** Who at the pilot school will manage the platform? Need to identify a champion at both St. Peter's and Kriste Mambo before launch.

5. **Naming:** Is "EduSaaS" the final brand name? It's descriptive but generic. Consider something with local resonance — a Wolof or Shona word for "reunion" or "homecoming"?
