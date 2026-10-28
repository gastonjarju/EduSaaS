// Seeds two demo schools with mock alumni, class groups, posts, events and
// RSVPs for local development. Deterministic and idempotent: each run deletes
// the demo schools and every user with a SEED_EMAIL_DOMAIN email, then
// re-inserts.
//
//   npm run db:seed
import { config } from "dotenv";
import { and, inArray, isNotNull, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { deletePhotos } from "../lib/storage";
import * as schema from "./schema";

config({ path: ".env.local", quiet: true });

const SEED_EMAIL_DOMAIN = "seed.edusaas.test";

// mulberry32 — small seeded PRNG so every run produces the same data.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const pick = <T>(rand: Rand, items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)];
const chance = (rand: Rand, p: number) => rand() < p;
const daysAgo = (days: number, hour = 12) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, Math.floor(days * 7) % 60, 0, 0);
  return d;
};

type City = { city: string; country: string };

type FeaturedAlumnus = {
  first: string;
  last: string;
  year: number;
  city: City;
  profession: string;
  employer?: string;
  classSection?: string;
  bio?: string;
  verification?: "unverified" | "pending" | "verified";
  isMentor?: boolean;
  linkedinUrl?: string; // real URL; otherwise featured alumni get a demo one
  activities?: string[];
  memories?: string[];
};

type SchoolSeed = {
  slug: string;
  name: string;
  country: string;
  phonePrefix: string; // country code + fixed digits; index is appended
  phoneDigits: number;
  currency: string;
  utcOffsetHours: number;
  campus: string;
  firstNames: readonly string[];
  lastNames: readonly string[];
  homeCities: readonly City[];
  diasporaCities: readonly City[];
  classSections: readonly string[];
  featured: readonly FeaturedAlumnus[];
  admin: { first: string; last: string };
};

const PROFESSIONS = [
  ["Teacher", "Ministry of Education"],
  ["Nurse", "Regional Hospital"],
  ["Engineer", "National Water Company"],
  ["Analyst", "Standard Chartered"],
  ["Accountant", "PwC"],
  ["Doctor", "Teaching Hospital"],
  ["Software Developer", "Freelance"],
  ["Entrepreneur", "Own business"],
  ["Civil Servant", "Ministry of Finance"],
  ["Lawyer", "Legal Aid"],
  ["Pharmacist", "Community Pharmacy"],
  ["Electrician", "Self-employed"],
  ["Journalist", "National Broadcaster"],
  ["Agronomist", "Farmers' Cooperative"],
  ["Lecturer", "University"],
] as const;

const BIOS = [
  "Happy to mentor anyone thinking about a career in my field.",
  "Proud alumnus — always up for a reunion.",
  "Building my own business and keen to hire fellow alumni.",
  "Back home after studying abroad. Let's reconnect!",
  "Coaching the school football team on weekends.",
];

// Industry for each seeded profession (see INDUSTRIES in lib/alumni/profileFields.ts)
const INDUSTRY_FOR: Record<string, string> = {
  Teacher: "Education",
  Lecturer: "Education",
  Nurse: "Health & Medicine",
  Doctor: "Health & Medicine",
  Pharmacist: "Health & Medicine",
  Engineer: "Engineering",
  "Software Engineer": "Technology",
  "Software Developer": "Technology",
  Analyst: "Finance & Accounting",
  Accountant: "Finance & Accounting",
  Entrepreneur: "Business & Trade",
  "Civil Servant": "Government & Public Service",
  Lawyer: "Law",
  Electrician: "Construction & Trades",
  Journalist: "Arts & Media",
  Agronomist: "Agriculture",
};

const ACTIVITIES = ["Football", "Athletics", "Debate club", "Choir", "Drama", "Science club", "Quiz team", "Scouts", "Prefect", "Netball", "Volleyball", "School newspaper", "Chess"];

const MEMORIES = [
  "Inter-house sports day — our house finally won the relay.",
  "Staying late in the library before exams with the whole class.",
  "The school trip to the national museum.",
  "Morning assembly and the head teacher's long announcements.",
  "Winning the inter-school quiz competition.",
  "Lunch under the big mango tree.",
];

const STUDYING = [
  "BSc Nursing, University of The Gambia",
  "BA Education, University of Zimbabwe",
  "Diploma in IT, Gambia Technical Training Institute",
  "BCom Accounting, Midlands State University",
];

const POSTS = [
  "Anyone up for a reunion this December? 🎉",
  "Found our old class photo while clearing out the house. Who remembers this day?",
  "Shout out to our maths teacher — still the best I've ever had.",
  "Our year should sponsor a prize at this year's prize-giving. Who's in?",
  "If anyone is in London next month, let's meet up.",
  "Just registered — great to see so many familiar names here!",
  "Congratulations to everyone who graduated with me. Ten years already!",
  "Does anyone have contact details for our old head boy?",
  "Career Day is coming up — I'm volunteering to talk about nursing.",
  "Remember when the generator failed during exams? 😂",
];

const SCHOOLS: readonly SchoolSeed[] = [
  {
    slug: "stpeterstechnical",
    name: "St. Peter's Technical Junior & Senior Secondary School",
    country: "GM",
    phonePrefix: "+220300",
    phoneDigits: 4,
    currency: "GMD",
    utcOffsetHours: 0,
    campus: "Lamin campus",
    firstNames: ["Aisha", "Musa", "Fatou", "Omar", "Ndey", "Lamin", "Isatou", "Ebrima", "Mariama", "Modou", "Awa", "Alieu", "Haddy", "Ousman", "Binta", "Sainabou", "Momodou", "Kaddy", "Pa", "Jainaba"],
    lastNames: ["Bojang", "Jallow", "Sowe", "Ceesay", "Jammeh", "Touray", "Darboe", "Sanneh", "Njie", "Camara", "Manneh", "Faye", "Sillah", "Jobe", "Drammeh"],
    homeCities: [
      { city: "Banjul", country: "GM" },
      { city: "Serrekunda", country: "GM" },
      { city: "Brikama", country: "GM" },
      { city: "Lamin", country: "GM" },
      { city: "Bakau", country: "GM" },
    ],
    diasporaCities: [
      { city: "London", country: "GB" },
      { city: "New York", country: "US" },
      { city: "Atlanta", country: "US" },
      { city: "Stockholm", country: "SE" },
      { city: "Dakar", country: "SN" },
    ],
    classSections: ["Grade 12 Science", "Grade 12 Arts", "Grade 12 Technical", "Form 5A", "Form 5B"],
    featured: [
      { first: "Aisha", last: "Bojang", year: 2015, city: { city: "Banjul", country: "GM" }, profession: "Teacher", employer: "Gambia College", classSection: "Form 5A", bio: "Grateful for the foundation St. Peter's gave me. Happy to mentor anyone going into education.", verification: "verified", isMentor: true, activities: ["Debate club", "Netball", "Prefect"], memories: ["Winning the inter-school debate final in 2014.", "Mr Jallow's chemistry lessons — we still quote him."] },
      { first: "Musa", last: "Jallow", year: 2012, city: { city: "New York", country: "US" }, profession: "Engineer", employer: "Con Edison", verification: "verified" },
      { first: "Fatou", last: "Sowe", year: 2018, city: { city: "Serrekunda", country: "GM" }, profession: "Nurse", employer: "Edward Francis Small Teaching Hospital", verification: "verified" },
      { first: "Omar", last: "Ceesay", year: 2015, city: { city: "Brikama", country: "GM" }, profession: "Nurse", verification: "verified" },
      { first: "Ndey", last: "Jallow", year: 2010, city: { city: "London", country: "GB" }, profession: "Analyst", employer: "HSBC", verification: "verified" },
      { first: "Lamin", last: "Ceesay", year: 2015, city: { city: "Lamin", country: "GM" }, profession: "Electrician", verification: "pending" },
    ],
    admin: { first: "Mariama", last: "Touray" },
  },
  {
    slug: "kristemambo",
    name: "Kriste Mambo High School",
    country: "ZW",
    phonePrefix: "+26377100",
    phoneDigits: 4,
    currency: "USD",
    utcOffsetHours: 2,
    campus: "Rusape campus",
    firstNames: ["Tendai", "Chipo", "Tatenda", "Rumbidzai", "Farai", "Nyasha", "Tafadzwa", "Kudzai", "Rutendo", "Tinashe", "Vimbai", "Takudzwa", "Shamiso", "Tapiwa", "Ruvimbo", "Simbarashe", "Fadzai", "Panashe", "Chiedza", "Munashe"],
    lastNames: ["Moyo", "Ncube", "Dube", "Sibanda", "Mpofu", "Chikwanha", "Mutasa", "Marufu", "Chirwa", "Gumbo", "Mhlanga", "Zvobgo", "Makoni", "Nyathi", "Banda"],
    homeCities: [
      { city: "Harare", country: "ZW" },
      { city: "Bulawayo", country: "ZW" },
      { city: "Mutare", country: "ZW" },
      { city: "Rusape", country: "ZW" },
      { city: "Gweru", country: "ZW" },
    ],
    diasporaCities: [
      { city: "London", country: "GB" },
      { city: "Johannesburg", country: "ZA" },
      { city: "Leeds", country: "GB" },
      { city: "Dallas", country: "US" },
      { city: "Auckland", country: "NZ" },
    ],
    classSections: ["Upper 6 Arts", "Upper 6 Sciences", "Upper 6 Commercials", "Form 4A", "Form 4B"],
    featured: [
      { first: "Chipo", last: "Moyo", year: 2014, city: { city: "Harare", country: "ZW" }, profession: "Doctor", employer: "Parirenyatwa Hospital", classSection: "Upper 6 Sciences", bio: "Kriste Mambo taught me discipline. Happy to advise anyone applying to medical school.", verification: "verified", isMentor: true },
      { first: "Tendai", last: "Ncube", year: 2011, city: { city: "Johannesburg", country: "ZA" }, profession: "Accountant", employer: "Deloitte", verification: "verified" },
      { first: "Rumbidzai", last: "Mutasa", year: 2019, city: { city: "Mutare", country: "ZW" }, profession: "Teacher", verification: "pending" },
      { first: "Liberty", last: "Mupotsa", year: 2017, city: { city: "Harare", country: "ZW" }, profession: "Software Engineer", employer: "EduSaaS", classSection: "Upper 6 Sciences", bio: "Co-founder of EduSaaS. Always happy to talk tech careers with fellow Kriste Mambo alumni.", verification: "verified", isMentor: true, linkedinUrl: "https://www.linkedin.com/in/liberty-mupotsa-56b43616b" },
    ],
    admin: { first: "Tafadzwa", last: "Makoni" },
  },
];

// Graduation years weighted toward 2010–2019, matching the alumni surveys.
function gradYear(rand: Rand): number {
  const r = rand();
  if (r < 0.15) return 1995 + Math.floor(rand() * 15); // 1995–2009
  if (r < 0.85) return 2010 + Math.floor(rand() * 10); // 2010–2019
  return 2020 + Math.floor(rand() * 5); // 2020–2024
}

async function main() {
  const url = process.env.POSTGRES_URL_NON_POOLING;
  if (!url) throw new Error("POSTGRES_URL_NON_POOLING is not set (.env.local)");
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });

  // Photos of the seed users deleted below would otherwise stay in Storage
  const seedPhotos = (
    await db
      .select({ path: schema.users.avatarUrl })
      .from(schema.users)
      .where(and(like(schema.users.email, `%@${SEED_EMAIL_DOMAIN}`), isNotNull(schema.users.avatarUrl)))
  ).map((r) => r.path!);

  await db.transaction(async (tx) => {
    // Deleting a school cascades to its profiles, groups, posts, events and
    // RSVPs. Alumni users have no school_id, so they are removed by email.
    await tx
      .delete(schema.schools)
      .where(inArray(schema.schools.slug, SCHOOLS.map((s) => s.slug)));
    await tx
      .delete(schema.users)
      .where(like(schema.users.email, `%@${SEED_EMAIL_DOMAIN}`));

    for (const [schoolIndex, s] of SCHOOLS.entries()) {
      const rand = rng(1000 + schoolIndex);
      const phone = (i: number) =>
        `${s.phonePrefix}${String(i).padStart(s.phoneDigits, "0")}`;
      const email = (first: string, last: string, i: number) =>
        `${first}.${last}.${i}@${SEED_EMAIL_DOMAIN}`.toLowerCase();

      const [school] = await tx
        .insert(schema.schools)
        .values({ name: s.name, slug: s.slug, country: s.country })
        .returning();

      await tx
        .insert(schema.schoolSiteSettings)
        .values({ schoolId: school.id, primaryColor: "#1d9e75" });

      const [admin] = await tx
        .insert(schema.users)
        .values({
          name: `${s.admin.first} ${s.admin.last}`,
          phone: phone(0),
          email: `admin.${s.slug}@${SEED_EMAIL_DOMAIN}`,
          role: "school_admin",
          schoolId: school.id,
        })
        .returning();

      // Featured alumni (match the wireframes) first, then generated ones.
      const alumni: FeaturedAlumnus[] = [...s.featured];
      while (alumni.length < 60) {
        const [profession, employer] = pick(rand, PROFESSIONS);
        const abroad = chance(rand, 0.25);
        alumni.push({
          first: pick(rand, s.firstNames),
          last: pick(rand, s.lastNames),
          year: gradYear(rand),
          city: pick(rand, abroad ? s.diasporaCities : s.homeCities),
          profession,
          employer: chance(rand, 0.6) ? employer : undefined,
          classSection: chance(rand, 0.7) ? pick(rand, s.classSections) : undefined,
          bio: chance(rand, 0.3) ? pick(rand, BIOS) : undefined,
          verification: pick(rand, ["verified", "verified", "verified", "pending", "unverified"] as const),
          isMentor: chance(rand, 0.15),
        });
      }

      const users = await tx
        .insert(schema.users)
        .values(
          alumni.map((a, i) => ({
            name: `${a.first} ${a.last}`,
            phone: phone(i + 1),
            email: email(a.first, a.last, i + 1),
            role: "alumni",
          }))
        )
        .returning({ id: schema.users.id });

      const profiles = await tx
        .insert(schema.alumniProfiles)
        .values(
          alumni.map((a, i) => ({
            userId: users[i].id,
            schoolId: school.id,
            graduationYear: a.year,
            classSection: a.classSection,
            currentCity: a.city.city,
            currentCountry: a.city.country,
            profession: a.profession,
            employer: a.employer,
            bio: a.bio,
            industry: INDUSTRY_FOR[a.profession] ?? null,
            // Featured alumni use their own lists (or none); others get a few
            schoolActivities:
              a.activities ?? (i >= s.featured.length ? ACTIVITIES.filter(() => chance(rand, 0.15)).slice(0, 4) : []),
            schoolMemories:
              a.memories ?? (i >= s.featured.length && chance(rand, 0.35) ? [pick(rand, MEMORIES)] : []),
            studying: i >= s.featured.length && a.year >= 2021 && chance(rand, 0.5) ? pick(rand, STUDYING) : null,
            // Obviously fake handles so demo links never hit a real person's page
            linkedinUrl:
              a.linkedinUrl ??
              (i < s.featured.length || chance(rand, 0.4)
                ? `https://www.linkedin.com/in/edusaas-demo-${a.first}-${a.last}-${i + 1}`.toLowerCase()
                : undefined),
            verificationStatus: a.verification ?? "unverified",
            isMentor: a.isMentor ?? false,
            mentorAreas: a.isMentor ? ["career", "university"] : [],
            // Featured alumni keep the default visibility; ~1 in 5 generated
            // ones hide their city or profession, to exercise privacy rules.
            ...(i >= s.featured.length && chance(rand, 0.2)
              ? {
                  visibility: {
                    city: chance(rand, 0.5),
                    profession: chance(rand, 0.5),
                    bio: true,
                    employer: false,
                    linkedin: true,
                  },
                }
              : {}),
          }))
        )
        .returning({
          id: schema.alumniProfiles.id,
          graduationYear: schema.alumniProfiles.graduationYear,
          userId: schema.alumniProfiles.userId,
        });

      const years = [...new Set(alumni.map((a) => a.year))].sort();
      const groups = await tx
        .insert(schema.classGroups)
        .values(
          years.map((year) => ({
            schoolId: school.id,
            graduationYear: year,
            name: `Class of ${year}`,
          }))
        )
        .returning();

      // Posts: concentrate on the featured alumnus's year so one feed is busy.
      const busyYear = s.featured[0].year;
      const posts = [];
      for (let i = 0; i < 16; i++) {
        const year = i < 10 ? busyYear : pick(rand, years);
        const members = profiles.filter((p) => p.graduationYear === year);
        const group = groups.find((g) => g.graduationYear === year)!;
        const createdAt = daysAgo(i * 2 + Math.floor(rand() * 2), 8 + (i % 10));
        posts.push({
          classGroupId: group.id,
          schoolId: school.id,
          authorId: pick(rand, members).userId,
          content: pick(rand, POSTS),
          createdAt,
          updatedAt: createdAt,
        });
      }
      await tx.insert(schema.classGroupPosts).values(posts);

      const at = (iso: string) => {
        const d = new Date(`${iso}Z`);
        d.setUTCHours(d.getUTCHours() - s.utcOffsetHours);
        return d;
      };
      const events = await tx
        .insert(schema.events)
        .values([
          {
            schoolId: school.id,
            createdBy: admin.id,
            title: "Homecoming Reunion",
            description: "Join us for an evening of reconnecting, food, and celebrating our school's legacy.",
            eventDate: at("2026-12-20T16:00:00"),
            endDate: at("2026-12-20T21:00:00"),
            location: s.campus,
            locationType: "physical",
            isPublished: true,
          },
          {
            schoolId: school.id,
            createdBy: admin.id,
            title: "Career Day (virtual)",
            description: "Alumni share their career paths with current students. Volunteers welcome.",
            eventDate: at("2027-01-14T15:00:00"),
            endDate: at("2027-01-14T17:00:00"),
            locationType: "virtual",
            virtualLink: "https://zoom.us/j/0000000000",
            isPublished: true,
          },
          {
            schoolId: school.id,
            createdBy: admin.id,
            title: "Library Fundraising Gala",
            description: "An evening gala to raise funds for the library renovation. Attend in person or online.",
            eventDate: at("2027-02-27T18:00:00"),
            location: s.campus,
            locationType: "hybrid",
            virtualLink: "https://zoom.us/j/1111111111",
            isPublished: true,
          },
          {
            schoolId: school.id,
            createdBy: admin.id,
            title: "Founders' Day",
            description: "Our annual celebration of the school's founding.",
            eventDate: at("2026-06-12T10:00:00"),
            location: s.campus,
            locationType: "physical",
            isPublished: true,
          },
          {
            // Unpublished draft: must not appear on alumni pages.
            schoolId: school.id,
            createdBy: admin.id,
            title: "Sports Day (draft)",
            eventDate: at("2027-03-20T09:00:00"),
            location: s.campus,
            isPublished: false,
          },
        ])
        .returning();

      const rsvps = [];
      for (const event of events.filter((e) => e.isPublished)) {
        for (const p of profiles) {
          if (!chance(rand, 0.3)) continue;
          rsvps.push({
            eventId: event.id,
            schoolId: school.id,
            userId: p.userId,
            status: pick(rand, ["going", "going", "maybe", "not_going"] as const),
          });
        }
      }
      await tx.insert(schema.eventRsvps).values(rsvps);

      console.log(
        `${s.slug}: 1 admin, ${profiles.length} alumni, ${groups.length} class groups, ${posts.length} posts, ${events.length} events, ${rsvps.length} RSVPs`
      );
    }
  });

  if (seedPhotos.length > 0) {
    await deletePhotos(seedPhotos);
    console.log(`Deleted ${seedPhotos.length} profile photo(s) of reset seed users`);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
