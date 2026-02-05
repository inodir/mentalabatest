 // Regions of Uzbekistan
 export const REGIONS = [
   "Toshkent shahri",
   "Toshkent viloyati",
   "Andijon viloyati",
   "Buxoro viloyati",
   "Farg'ona viloyati",
   "Jizzax viloyati",
   "Xorazm viloyati",
   "Namangan viloyati",
   "Navoiy viloyati",
   "Qashqadaryo viloyati",
   "Qoraqalpog'iston Respublikasi",
   "Samarqand viloyati",
   "Sirdaryo viloyati",
   "Surxondaryo viloyati",
 ] as const;
 
 // Subject list
 export const SUBJECTS = [
   "Matematika",
   "Fizika",
   "Kimyo",
   "Biologiya",
   "Tarix",
   "Geografiya",
   "Ingliz tili",
   "Rus tili",
   "Ona tili va adabiyot",
   "Informatika",
 ] as const;
 
 // Test languages
 export const TEST_LANGUAGES = [
   { value: "uzbek", label: "O'zbek" },
   { value: "russian", label: "Rus" },
   { value: "english", label: "Ingliz" },
 ] as const;
 
 // Certificate types
 export const CERTIFICATE_TYPES = [
   "IELTS",
   "CEFR",
   "Duolingo",
   "TOEFL",
   "Other",
 ] as const;
 
 export type Region = (typeof REGIONS)[number];
 export type Subject = (typeof SUBJECTS)[number];
 export type TestLanguage = (typeof TEST_LANGUAGES)[number]["value"];
 export type CertificateType = (typeof CERTIFICATE_TYPES)[number];