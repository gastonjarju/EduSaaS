// Countries offered in the join form's country-code picker: the pilot
// countries plus where alumni most often live abroad. Safe to import from
// client components (no server code).

export type PhoneCountry = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  dial: string; // country calling code, without "+"
  digits: [min: number, max: number]; // national number length, without trunk "0"
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "GM", name: "The Gambia", flag: "🇬🇲", dial: "220", digits: [7, 7] },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", dial: "263", digits: [9, 9] },
  { code: "SN", name: "Senegal", flag: "🇸🇳", dial: "221", digits: [9, 9] },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "27", digits: [9, 9] },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "234", digits: [10, 10] },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dial: "233", digits: [9, 9] },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dial: "254", digits: [9, 9] },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "44", digits: [10, 10] },
  { code: "US", name: "United States / Canada", flag: "🇺🇸", dial: "1", digits: [10, 10] },
  { code: "SE", name: "Sweden", flag: "🇸🇪", dial: "46", digits: [7, 9] },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "49", digits: [10, 11] },
  { code: "FR", name: "France", flag: "🇫🇷", dial: "33", digits: [9, 9] },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "61", digits: [9, 9] },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dial: "64", digits: [8, 10] },
];

export function phoneCountry(code: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((c) => c.code === code);
}
