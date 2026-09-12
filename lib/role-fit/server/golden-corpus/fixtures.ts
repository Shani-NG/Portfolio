export type GoldenCorpusFixture = {
  id: `G${string}`;
  company: string;
  roleIdentity: string;
  sourceUrl: string;
  sourceFile: string;
  expectedTitle: string;
  expectedCounts: { responsibilities: number; requirements: number; preferred: number };
  criticalSourceFragments: string[];
  contaminationFragments: string[];
  revisionNote?: string;
};

export const goldenCorpusFixtures: GoldenCorpusFixture[] = [
  {
    id: "G01", company: "Aman", roleIdentity: "AI Product Manager", sourceFile: "G01.txt",
    sourceUrl: "https://www.aman.co.il/careers/%D7%9E%D7%A2%D7%A8%D7%9B%D7%95%D7%AA-%D7%9E%D7%99%D7%93%D7%A2/project-manager-%D7%91%D7%A0%D7%A7%D7%90%D7%99-%D7%90%D7%95%D7%98%D7%95%D7%A0%D7%95%D7%9E%D7%99-%D7%A9%D7%95%D7%AA%D7%A4%D7%95%D7%99%D7%95%D7%AA-%D7%95%D7%9E%D7%95%D7%A6%D7%A8-%D7%98%D7%9B/",
    expectedTitle: "מנהל/ת מוצר AI",
    expectedCounts: { responsibilities: 10, requirements: 9, preferred: 7 },
    criticalSourceFragments: ["הובלת אסטרטגיית מוצר ו-Roadmap עבור פתרונות AI, GenAI ו-Agentic AI.", "הגדרת דרישות עסקיות, יעדים ו-KPIs.", "עבודה שוטפת מול גורמים עסקיים וטכנולוגיים, צוותי Data ו-AI וספקים חיצוניים."],
    contaminationFragments: ["לשליחת קורות חיים"],
  },
  {
    id: "G02", company: "Aman", roleIdentity: "UX Characterizer", sourceFile: "G02.txt",
    sourceUrl: "https://www.aman.co.il/careers/ui-ux/%D7%9E%D7%90%D7%A4%D7%99%D7%99%D7%9F-%D7%AA-ux/",
    expectedTitle: "מאפיין/ת UX",
    expectedCounts: { responsibilities: 6, requirements: 6, preferred: 1 },
    criticalSourceFragments: ["הובלה וניהול של תהליכי עיצוב וגורמי אנוש", "מחקר משתמשים, שימושיות ועיצוב.", "ניסיון בתכנון תהליכי אימות (V&V) בהיבטי האדם במערכת"],
    contaminationFragments: ["לשליחת קורות חיים"],
  },
  {
    id: "G03", company: "Drushim", roleIdentity: "DATA&AI Product Manager (freelance)", sourceFile: "G03.txt",
    sourceUrl: "https://www.drushim.co.il/job/38367748/703856b1/",
    expectedTitle: "מנהל\\ת מוצר DATA&AI \\מודל פרילנסר",
    expectedCounts: { responsibilities: 7, requirements: 3, preferred: 2 },
    criticalSourceFragments: ["הובלת אזור מוצר בתחומי Data ויישומי AI", "בנייה וניהול של Product Roadmap ותכולת עבודה", "איסוף, ניתוח ואפיון צרכים עסקיים ותרגומם לדרישות מקצועיות וטכנולוגיות"],
    contaminationFragments: ["משרות נוספות שעשויות לעניין אותך", "משרה חלקית עבודה מהבית היברידי", "משרה זו פונה לנשים וגברים"],
  },
  {
    id: "G04", company: "Paragon", roleIdentity: "Product Strategy Lead", sourceFile: "G04.txt",
    sourceUrl: "https://il.linkedin.com/jobs/view/product-strategy-lead-at-paragon-4459659659",
    expectedTitle: "Product Strategy Lead",
    expectedCounts: { responsibilities: 7, requirements: 7, preferred: 0 },
    criticalSourceFragments: ["Identify and shape new opportunity areas aligned with Paragon’s strategic direction.", "Lead Alpha/POC definition, including scope, requirements, success criteria, and learning agenda.", "Ability to work effectively across business and technical teams."],
    contaminationFragments: ["Show more jobs like this"],
  },
  {
    id: "G05", company: "Deloitte", roleIdentity: "Product Manager", sourceFile: "G05.txt",
    sourceUrl: "https://careers.deloitte.co.il/position/3c-17d-en/",
    expectedTitle: "Product Manager",
    expectedCounts: { responsibilities: 11, requirements: 10, preferred: 1 },
    criticalSourceFragments: ["Technical Product Manager", "agent architecture, data, model performance", "agents, RAG, evaluation", "access controls, privacy, governance"],
    contaminationFragments: ["R&D and Innovation Center", "diversity and inclusion among our people"],
    revisionNote: "Option B: current official source title Product Manager is canonical; Technical Product Manager remains description context only.",
  },
  {
    id: "G06", company: "Figma", roleIdentity: "Product Designer - Figma Weave", sourceFile: "G06.txt",
    sourceUrl: "https://job-boards.greenhouse.io/figma/jobs/5991320004?gh_jid=5991320004",
    expectedTitle: "Product Designer - Figma Weave (Tel Aviv, Israel)",
    expectedCounts: { responsibilities: 6, requirements: 5, preferred: 4 },
    criticalSourceFragments: ["generative AI, node-based workflow editing", "Contribute to overall strategy", "Design and ship high-quality features"],
    contaminationFragments: ["Figma is growing our team of passionate creatives", "We’re building the next chapter of AI-native craft", "equal opportunity workplace", "Candidate Privacy Notice"],
  },
  {
    id: "G07", company: "Walmart Global Tech", roleIdentity: "Senior UX Designer", sourceFile: "G07.txt",
    sourceUrl: "https://il.linkedin.com/jobs/view/senior-ux-designer-at-walmart-global-tech-4456823128",
    expectedTitle: "Senior UX Designer",
    expectedCounts: { responsibilities: 4, requirements: 8, preferred: 4 },
    criticalSourceFragments: ["Lead Core Product UX Design", "Research & Data-Driven Iteration", "Jobs-to-be-Done (JTBD)", "user trust, transparency, and limitations"],
    contaminationFragments: ["Walmart Global Tech’s presence in Israel", "Senior UX Designer at Walmart Global Tech Israel", "Show more Show less"],
  },
  {
    id: "G08", company: "accessiBe", roleIdentity: "AI Product Designer", sourceFile: "G08.txt",
    sourceUrl: "https://www.linkedin.com/jobs/view/4301655258/",
    expectedTitle: "AI Product Designer",
    expectedCounts: { responsibilities: 6, requirements: 9, preferred: 4 },
    criticalSourceFragments: ["design GenAI-based features", "AI tools", "accessible interfaces", "prototyping with APIs"],
    contaminationFragments: ["Tel Aviv-Yafo, Tel Aviv District, Israel", "accessiBe is the market leader in web accessibility", "Want to make a real impact? Click here", "Click here to learn more", "Equal opportunity", "recruitment process"],
  },
  {
    id: "G09", company: "DuckDuckGo", roleIdentity: "Senior Product Design Engineer", sourceFile: "G09.txt",
    sourceUrl: "https://jobs.ashbyhq.com/duck-duck-go/ca69d3dd-7cef-4e02-9a1b-5f4d103fe4cd",
    expectedTitle: "Senior Product Design Engineer",
    expectedCounts: { responsibilities: 3, requirements: 10, preferred: 0 },
    criticalSourceFragments: ["working directly in the codebase", "contributing code where it raises design quality", "Prototypes in code to a production standard", "semantic markup and accessibility", "design-to-code parity", "building tools that accelerate design and engineering workflows"],
    contaminationFragments: ["DISCLOSURE STATEMENT: USE OF AI IN HIRING PROCESS", "Data Privacy", "Human Oversight and Accountability"],
    revisionNote: "Option B: current live 2026-08-19 posting is authoritative. Historical motion-implementation, spring/easing, interruptible-transition, and broader agentic-workflow assertions were retired because this source does not state them.",
  },
  {
    id: "G10", company: "Wix", roleIdentity: "Payroll Accountant (negative control)", sourceFile: "G10.txt",
    sourceUrl: "https://jobs.smartrecruiters.com/Wix2/744000143985674-payroll-accountant",
    expectedTitle: "Payroll Accountant",
    expectedCounts: { responsibilities: 5, requirements: 8, preferred: 1 },
    criticalSourceFragments: ["end-to-end monthly payroll process", "Hilan payroll system", "Israeli labor laws and pension regulations"],
    contaminationFragments: ["leveraging AI to redefine", "equal opportunity employer", "third-party website"],
  },
];
