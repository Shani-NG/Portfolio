# PR15 Golden Corpus Offline Baseline

Base SHA: `737f814022439fdae3c484fa445c85741783ab0c`

This is an observation of unmodified PR15 behavior. Corpus failures are intentionally preserved.

## Traceable corpus revisions

- G05: the current official Deloitte display title `Product Manager` is the canonical title. `Technical Product Manager` remains source context, not a replacement title.
- G09: the current live DuckDuckGo posting published 2026-08-19 is authoritative. Assertions retained are limited to its current text. Historical implemented-motion, easing/spring, interruptible-transition, and broader agentic-workflow assertions were removed.

## Inventory and route boundary

| ID | Company / role | SHA-256 | chars | admitted | validation | parsed title | oracle title | roleItems | analysis chars |
|---|---|---|---:|---|---|---|---|---:|---:|
| G01 | Aman — AI Product Manager | `9271aa0bdf88ee52f9d13803f2b3645dc35ba9d970ee8450369b55f38c7e7be9` | 1919 | true | valid-incomplete | — | מנהל/ת מוצר AI | 21 | 1582 |
| G02 | Aman — UX Characterizer | `18f5947b11dfbb5b5a047cef48cc4f8e65e0a22cb43627c98923223160c20e51` | 849 | false | not reached | מאפיין/ת UX | מאפיין/ת UX | 1 | 114 |
| G03 | Drushim — DATA&AI Product Manager (freelance) | `593b4fc660ff06e327616833da07e9811e9a0c7ec54aaa22e083da661a79c72c` | 1124 | true | valid-incomplete | * בנייה וניהול של Product Roadmap ותכולת עבודה | מנהל\ת מוצר DATA&AI \מודל פרילנסר | 14 | 828 |
| G04 | Paragon — Product Strategy Lead | `4db23d8d28eddc68084f0100d0d38b25298c6d73869f9a87ad63812b5e47e010` | 2353 | true | valid-complete | Product Strategy Lead | Product Strategy Lead | 16 | 1692 |
| G05 | Deloitte — Product Manager | `f3687615ade752cdbb5a10bcb978a84f8b01173ce1f497363971c8cb432ab27f` | 3186 | true | valid-complete | Product Manager | Product Manager | 26 | 3286 |
| G06 | Figma — Product Designer - Figma Weave | `fad581b0f15daa59a12e500f6243a09c038d6e6640243e9dac1f4660366c7936` | 5797 | true | valid-complete | Product Designer - Figma Weave (Tel Aviv, Israel) | Product Designer - Figma Weave (Tel Aviv, Israel) | 30 | 3909 |
| G07 | Walmart Global Tech — Senior UX Designer | `2a4d648ba7cd5a19cf5078baede40bdb3057b353135ba2d0a4a7df807fd48e63` | 3348 | true | valid-complete | Senior UX Designer | Senior UX Designer | 18 | 2810 |
| G08 | accessiBe — AI Product Designer | `c076f79ae3240c6a7ebd8e6b8e1101b94f18835082dcd99ee31797ce6fce2b72` | 4107 | true | valid-complete | AI Product Designer | AI Product Designer | 8 | 2624 |
| G09 | DuckDuckGo — Senior Product Design Engineer | `8396d7913a095c74e009f0a67f8dc8026343881da2af1e1b2d779a09c1160386` | 7710 | true | valid-complete | Senior Product Design Engineer | Senior Product Design Engineer | 38 | 6287 |
| G10 | Wix — Payroll Accountant (negative control) | `05e41533a081c08fcd237620c2dc0e1f36cd3fbfaad09febcdcff7089c624e01` | 3351 | true | valid-incomplete | — | Payroll Accountant | 15 | 2645 |

## Structural field counts and observed loss

| ID | Responsibilities | Requirements | Preferred | lost critical assertions | contamination hits | compact IDs |
|---|---:|---:|---:|---:|---:|---:|
| G01 | 4 | 17 | 8 | 1 | 0 | 12 |
| G02 | 0 | 1 | 0 | 3 | 0 | 0 |
| G03 | 0 | 14 | 3 | 2 | 0 | 12 |
| G04 | 6 | 10 | 0 | 2 | 0 | 12 |
| G05 | 8 | 21 | 0 | 0 | 1 | 12 |
| G06 | 12 | 18 | 0 | 1 | 2 | 12 |
| G07 | 1 | 17 | 6 | 0 | 0 | 12 |
| G08 | 3 | 5 | 14 | 2 | 2 | 12 |
| G09 | 14 | 24 | 0 | 0 | 3 | 12 |
| G10 | 3 | 12 | 0 | 0 | 1 | 12 |

Cardinality: minimum 1, maximum 38, mean 18.7, total 187.

## Exact per-case parser output and roleItems

### G01 — AI Product Manager

Source: https://www.aman.co.il/careers/%D7%9E%D7%A2%D7%A8%D7%9B%D7%95%D7%AA-%D7%9E%D7%99%D7%93%D7%A2/project-manager-%D7%91%D7%A0%D7%A7%D7%90%D7%99-%D7%90%D7%95%D7%98%D7%95%D7%A0%D7%95%D7%9E%D7%99-%D7%A9%D7%95%D7%AA%D7%A4%D7%95%D7%99%D7%95%D7%AA-%D7%95%D7%9E%D7%95%D7%A6%D7%A8-%D7%98%D7%9B/

Lost critical concepts: `הגדרת דרישות עסקיות, יעדים ו-KPIs.`

Contamination: none

```json
{
  "title": "",
  "responsibilities": [
    "הובלת אסטרטגיית מוצר ו-Roadmap עבור פתרונות AI, GenAI ו-Agentic AI.",
    "זיהוי צרכי לקוחות והזדמנויות עסקיות ותרגומם ליוזמות ומוצרים חדשניים.",
    "הובלת המוצר משלב ה-Discovery והגדרת ה-Use Case ועד להטמעה ומדידת הצלחה.",
    "הגדרת"
  ],
  "requirements": [
    "עסקיות, יעדים ו-KPIs.",
    "תיעדוף יוזמות, מוצרים ו-Use Cases בהתאם ליעדים העסקיים ולערך ללקוח.",
    "עבודה שוטפת מול גורמים עסקיים וטכנולוגיים, צוותי Data ו-AI וספקים חיצוניים.",
    "הובלת תהליכים חוצי ארגון וניהול ממשקים מרובים.",
    "ניהול תלויות וחסמים וקידום החלטות לצורך עמידה ביעדים.",
    "מדידת הערך העסקי, ביצועים ואימוץ המוצרים והפקת תובנות לשיפור.",
    "בניית תוכניות עבודה ותמיכה בניהול פורטפוליו יוזמות בתחום ה-AI.",
    "למי התפקיד יתאים?",
    "תואר ראשון במנהל עסקים, הנדסת תעשייה וניהול, כלכלה או תחום רלוונטי.",
    "5 שנות ניסיון ומעלה בניהול מוצר.",
    "ניסיון מוכח בהובלת מוצרים או יוזמות מורכבות מקצה לקצה.",
    "ניסיון בבניית אסטרטגיית מוצר, Roadmap ותיעדוף יוזמות.",
    "ניסיון בעבודה מול גורמים עסקיים וטכנולוגיים ובהובלת תהליכים חוצי ארגון.",
    "יכולת לתרגם צרכי לקוחות ויעדים עסקיים לפתרונות מוצר וטכנולוגיה.",
    "יכולות אנליטיות גבוהות וקבלת החלטות מבוססת נתונים.",
    "ראייה מערכתית, חשיבה עסקית ויכולת הנעת ממשקים.",
    "יכולת למידה עצמאית, יוזמה ויכולת עבודה בסביבה דינמית."
  ],
  "preferred": [
    "משמעותי:",
    "ניסיון במוצרי AI / GenAI / Agentic AI.",
    "ניסיון במוצרים דיגיטליים ו-Customer Facing.",
    "ניסיון במוצרים בעלי בסיס משתמשים רחב ובסקייל גבוה.",
    "היכרות עם עולמות פיננסיים / בנקאיים / משכנתאות.",
    "ניסיון בניהול פורטפוליו יוזמות או תוכניות עבודה מורכבות.",
    "היכרות עם Jira וכלים לניהול מוצר ולעבודה אג'ילית.",
    "ניסיון בבניית Business Case ובמדידת ערך עסקי."
  ],
  "roleItems": [
    {
      "originalText": "עסקיות, יעדים ו-KPIs.",
      "source": "requirement"
    },
    {
      "originalText": "תיעדוף יוזמות, מוצרים ו-Use Cases בהתאם ליעדים העסקיים ולערך ללקוח.",
      "source": "requirement"
    },
    {
      "originalText": "עבודה שוטפת מול גורמים עסקיים וטכנולוגיים, צוותי Data ו-AI וספקים חיצוניים.",
      "source": "requirement"
    },
    {
      "originalText": "הובלת תהליכים חוצי ארגון וניהול ממשקים מרובים.",
      "source": "requirement"
    },
    {
      "originalText": "ניהול תלויות וחסמים וקידום החלטות לצורך עמידה ביעדים.",
      "source": "requirement"
    },
    {
      "originalText": "מדידת הערך העסקי, ביצועים ואימוץ המוצרים והפקת תובנות לשיפור.",
      "source": "requirement"
    },
    {
      "originalText": "בניית תוכניות עבודה ותמיכה בניהול פורטפוליו יוזמות בתחום ה-AI.",
      "source": "requirement"
    },
    {
      "originalText": "למי התפקיד יתאים?",
      "source": "requirement"
    },
    {
      "originalText": "תואר ראשון במנהל עסקים, הנדסת תעשייה וניהול, כלכלה או תחום רלוונטי.",
      "source": "requirement"
    },
    {
      "originalText": "5 שנות ניסיון ומעלה בניהול מוצר.",
      "source": "requirement"
    },
    {
      "originalText": "ניסיון מוכח בהובלת מוצרים או יוזמות מורכבות מקצה לקצה.",
      "source": "requirement"
    },
    {
      "originalText": "ניסיון בבניית אסטרטגיית מוצר, Roadmap ותיעדוף יוזמות.",
      "source": "requirement"
    },
    {
      "originalText": "ניסיון בעבודה מול גורמים עסקיים וטכנולוגיים ובהובלת תהליכים חוצי ארגון.",
      "source": "requirement"
    },
    {
      "originalText": "יכולת לתרגם צרכי לקוחות ויעדים עסקיים לפתרונות מוצר וטכנולוגיה.",
      "source": "requirement"
    },
    {
      "originalText": "יכולות אנליטיות גבוהות וקבלת החלטות מבוססת נתונים.",
      "source": "requirement"
    },
    {
      "originalText": "ראייה מערכתית, חשיבה עסקית ויכולת הנעת ממשקים.",
      "source": "requirement"
    },
    {
      "originalText": "יכולת למידה עצמאית, יוזמה ויכולת עבודה בסביבה דינמית.",
      "source": "requirement"
    },
    {
      "originalText": "הובלת אסטרטגיית מוצר ו-Roadmap עבור פתרונות AI, GenAI ו-Agentic AI.",
      "source": "responsibility"
    },
    {
      "originalText": "זיהוי צרכי לקוחות והזדמנויות עסקיות ותרגומם ליוזמות ומוצרים חדשניים.",
      "source": "responsibility"
    },
    {
      "originalText": "הובלת המוצר משלב ה-Discovery והגדרת ה-Use Case ועד להטמעה ומדידת הצלחה.",
      "source": "responsibility"
    },
    {
      "originalText": "הגדרת",
      "source": "responsibility"
    }
  ]
}
```

### G02 — UX Characterizer

Source: https://www.aman.co.il/careers/ui-ux/%D7%9E%D7%90%D7%A4%D7%99%D7%99%D7%9F-%D7%AA-ux/

Lost critical concepts: `הובלה וניהול של תהליכי עיצוב וגורמי אנוש`, `מחקר משתמשים, שימושיות ועיצוב.`, `ניסיון בתכנון תהליכי אימות (V&V) בהיבטי האדם במערכת`

Contamination: none

```json
{
  "title": "מאפיין/ת UX",
  "responsibilities": [],
  "requirements": [
    "לארגון ביטחוני גדול באזור הצפון דרוש/ה מאפיין/ת UX עם מומחיות בהנדסת גורמי אנוש"
  ],
  "preferred": [],
  "roleItems": [
    {
      "originalText": "לארגון ביטחוני גדול באזור הצפון דרוש/ה מאפיין/ת UX עם מומחיות בהנדסת גורמי אנוש",
      "source": "requirement"
    }
  ]
}
```

### G03 — DATA&AI Product Manager (freelance)

Source: https://www.drushim.co.il/job/38367748/703856b1/

Lost critical concepts: `הובלת אזור מוצר בתחומי Data ויישומי AI`, `איסוף, ניתוח ואפיון צרכים עסקיים ותרגומם לדרישות מקצועיות וטכנולוגיות`

Contamination: none

```json
{
  "title": "* בנייה וניהול של Product Roadmap ותכולת עבודה",
  "responsibilities": [],
  "requirements": [
    "מקצועיות וטכנולוגיות",
    "תיעדוף יוזמות ומשימות בהתאם לצרכים ולערך העסקי",
    "הגדרת יעדים, מדדים ומעקב אחר מימוש הערך העסקי",
    "עבודה שוטפת מול הנהלה, יחידות עסקיות וצוותי פיתוח, Data, UX ותוכן",
    "זיהוי סיכונים, פתרון חסמים וליווי תהליכי פיתוח והטמעה מקצה לקצה",
    "פרטים נוספים:",
    "מיקום: הגן הטכנולוגי מלחה, ירושלים",
    "מודל העסקה: פרילנס",
    "היקף התחלתי: כ־50% משרה, עם אפשרות להרחבת ההיקף בהמשך בהתאם לצורך",
    "קיימת אפשרות לעבודה חלקית מרחוק, בהתאם למדיניות הארגון",
    "התפקיד",
    "6 שנות ניסיון ומעלה בניהול מוצר",
    "לפחות 3 שנות ניסיון בניהול מוצרים מורכבים",
    "עמידה באחת מחלופות ההשכלה הנדרשות לתפקיד"
  ],
  "preferred": [
    "לניסיון בעולמות Data, ניתוח נתונים ו־AI",
    "לניסיון בעבודה עם כלי בינה מלאכותית לצורכי פיתוח, אוטומציה ושיפור תהליכים",
    "משרה זו פונה לנשים וגברים כאחד."
  ],
  "roleItems": [
    {
      "originalText": "מקצועיות וטכנולוגיות",
      "source": "requirement"
    },
    {
      "originalText": "תיעדוף יוזמות ומשימות בהתאם לצרכים ולערך העסקי",
      "source": "requirement"
    },
    {
      "originalText": "הגדרת יעדים, מדדים ומעקב אחר מימוש הערך העסקי",
      "source": "requirement"
    },
    {
      "originalText": "עבודה שוטפת מול הנהלה, יחידות עסקיות וצוותי פיתוח, Data, UX ותוכן",
      "source": "requirement"
    },
    {
      "originalText": "זיהוי סיכונים, פתרון חסמים וליווי תהליכי פיתוח והטמעה מקצה לקצה",
      "source": "requirement"
    },
    {
      "originalText": "פרטים נוספים:",
      "source": "requirement"
    },
    {
      "originalText": "מיקום: הגן הטכנולוגי מלחה, ירושלים",
      "source": "requirement"
    },
    {
      "originalText": "מודל העסקה: פרילנס",
      "source": "requirement"
    },
    {
      "originalText": "היקף התחלתי: כ־50% משרה, עם אפשרות להרחבת ההיקף בהמשך בהתאם לצורך",
      "source": "requirement"
    },
    {
      "originalText": "קיימת אפשרות לעבודה חלקית מרחוק, בהתאם למדיניות הארגון",
      "source": "requirement"
    },
    {
      "originalText": "התפקיד",
      "source": "requirement"
    },
    {
      "originalText": "6 שנות ניסיון ומעלה בניהול מוצר",
      "source": "requirement"
    },
    {
      "originalText": "לפחות 3 שנות ניסיון בניהול מוצרים מורכבים",
      "source": "requirement"
    },
    {
      "originalText": "עמידה באחת מחלופות ההשכלה הנדרשות לתפקיד",
      "source": "requirement"
    }
  ]
}
```

### G04 — Product Strategy Lead

Source: https://il.linkedin.com/jobs/view/product-strategy-lead-at-paragon-4459659659

Lost critical concepts: `Identify and shape new opportunity areas aligned with Paragon’s strategic direction.`, `Lead Alpha/POC definition, including scope, requirements, success criteria, and learning agenda.`

Contamination: none

```json
{
  "title": "Product Strategy Lead",
  "responsibilities": [
    "combines product strategy, business analysis, and execution leadership. It is suited to someone who can move from ambiguity to structure, connect market needs to technical possibilities, and lead early-stage initiatives with both strategic rigor and operational speed.",
    "Identify and shape new opportunity areas aligned with Paragon's strategic direction.",
    "Define problem spaces, user needs, value propositions, and initial product concepts.",
    "Conduct market, competitor, and risk assessments to support prioritization and investment decisions.",
    "Build business cases including market potential, ROI logic, business model, and strategic fit.",
    "Lead Alpha/POC definition, including scope,"
  ],
  "requirements": [
    ", success criteria, and learning agenda.",
    "Drive implementation with cross-functional teams and support soft launch with design partners.",
    "Help define the initial offering, positioning, and early go-to-market approach.",
    "7+ years of experience across product strategy, product management, business development, strategy consulting, venture building, or a similar role in a technology environment.",
    "Proven ability to lead 0 to 1 initiatives from idea through validation and early launch.",
    "Strong strategic, analytical, and commercial judgment.",
    "Strong ability to structure unclear opportunity spaces, develop sharp hypotheses, and convert them into practical execution plans.",
    "Ability to work effectively across business and technical teams.",
    "Clear communicator with strong executive presence and ownership mindset.",
    "Strong ability to influence senior stakeholders and create clear executive-level narratives."
  ],
  "preferred": [],
  "roleItems": [
    {
      "originalText": ", success criteria, and learning agenda.",
      "source": "requirement"
    },
    {
      "originalText": "Drive implementation with cross-functional teams and support soft launch with design partners.",
      "source": "requirement"
    },
    {
      "originalText": "Help define the initial offering, positioning, and early go-to-market approach.",
      "source": "requirement"
    },
    {
      "originalText": "7+ years of experience across product strategy, product management, business development, strategy consulting, venture building, or a similar role in a technology environment.",
      "source": "requirement"
    },
    {
      "originalText": "Proven ability to lead 0 to 1 initiatives from idea through validation and early launch.",
      "source": "requirement"
    },
    {
      "originalText": "Strong strategic, analytical, and commercial judgment.",
      "source": "requirement"
    },
    {
      "originalText": "Strong ability to structure unclear opportunity spaces, develop sharp hypotheses, and convert them into practical execution plans.",
      "source": "requirement"
    },
    {
      "originalText": "Ability to work effectively across business and technical teams.",
      "source": "requirement"
    },
    {
      "originalText": "Clear communicator with strong executive presence and ownership mindset.",
      "source": "requirement"
    },
    {
      "originalText": "Strong ability to influence senior stakeholders and create clear executive-level narratives.",
      "source": "requirement"
    },
    {
      "originalText": "combines product strategy, business analysis, and execution leadership. It is suited to someone who can move from ambiguity to structure, connect market needs to technical possibilities, and lead early-stage initiatives with both strategic rigor and operational speed.",
      "source": "responsibility"
    },
    {
      "originalText": "Identify and shape new opportunity areas aligned with Paragon's strategic direction.",
      "source": "responsibility"
    },
    {
      "originalText": "Define problem spaces, user needs, value propositions, and initial product concepts.",
      "source": "responsibility"
    },
    {
      "originalText": "Conduct market, competitor, and risk assessments to support prioritization and investment decisions.",
      "source": "responsibility"
    },
    {
      "originalText": "Build business cases including market potential, ROI logic, business model, and strategic fit.",
      "source": "responsibility"
    },
    {
      "originalText": "Lead Alpha/POC definition, including scope,",
      "source": "responsibility"
    }
  ]
}
```

### G05 — Product Manager

Source: https://careers.deloitte.co.il/position/3c-17d-en/

Lost critical concepts: none

Contamination: `diversity and inclusion among our people`

```json
{
  "title": "Product Manager",
  "responsibilities": [
    "We are looking for an experienced Technical Product Manager to lead the discovery, delivery, and evolution of AI-enabled and agentic products. You will combine strong product judgment with enough technical depth to make informed decisions about agent architecture, data, model performance, tool integrations, evaluation, and delivery trade-offs.",
    "Working closely with engineering, data science, design, and business teams, you will turn complex opportunities into secure, scalable, user-centred products that create measurable value. This role is ideal for a product leader who enjoys moving between customer needs, technical constraints, and business outcomes.",
    "Lead the end-to-end lifecycle of AI-enabled and agentic products, from discovery to launch and continuous improvement.",
    "Define product vision, strategy, roadmaps, and measurable business outcomes.",
    "Collaborate with engineering and data science teams to deliver scalable, secure AI solutions and workflows.",
    "Define success metrics, quality standards, and evaluation frameworks for AI capabilities.",
    "Partner with UX and engineering teams to deliver intuitive, production-ready products.",
    "Monitor KPIs, user feedback, and product performance to drive adoption and continuous enhancement."
  ],
  "requirements": [
    ", user stories, and technical specifications.",
    "Prioritize backlog and make data-driven trade-offs based on value, impact, and feasibility.",
    "Define success metrics, quality standards, and evaluation frameworks for AI capabilities.",
    "Partner with UX and engineering teams to deliver intuitive, production-ready products.",
    "Monitor KPIs, user feedback, and product performance to drive adoption and continuous enhancement.",
    "Communicate product strategy, progress, and outcomes to stakeholders and leadership.",
    "Stay up to date with AI, machine learning, cloud, and product management trends.",
    "4+ years of product management experience, ideally with digital, data-driven, or AI-powered products.",
    "Proven experience leading cross-functional teams including engineers, data scientists, designers, and business stakeholders.",
    "Strong technical understanding of APIs, cloud services, data pipelines, integrations, and software development.",
    "Solid knowledge of AI and GenAI concepts, including agents, RAG, evaluation, data quality, and Responsible AI.",
    "Experience with agentic AI frameworks such as LangChain, LangGraph, Langfuse, or similar platforms.",
    "Familiarity with secure AI system design, access controls, privacy, governance, and enterprise integrations.",
    "Strong ability to translate complex business needs into clear product",
    "and delivery plans.",
    "Excellent analytical, prioritization, and communication",
    "Experience with Agile methodologies and tools such as Jira and Confluence.",
    "Familiarity with AWS, Azure, or GCP is an advantage.",
    "Bachelor's degree in Computer Science, Engineering, Information Systems, Business, or a related field (or equivalent experience)",
    "Location: Tel Aviv, Hybrid",
    "We at Deloitte believe that diversity and inclusion among our people is a critical component of our success and that is why we cultivate an organizational culture that contains and embraces diversity in all its forms."
  ],
  "preferred": [],
  "roleItems": [
    {
      "originalText": ", user stories, and technical specifications.",
      "source": "requirement"
    },
    {
      "originalText": "Prioritize backlog and make data-driven trade-offs based on value, impact, and feasibility.",
      "source": "requirement"
    },
    {
      "originalText": "Define success metrics, quality standards, and evaluation frameworks for AI capabilities.",
      "source": "requirement"
    },
    {
      "originalText": "Partner with UX and engineering teams to deliver intuitive, production-ready products.",
      "source": "requirement"
    },
    {
      "originalText": "Monitor KPIs, user feedback, and product performance to drive adoption and continuous enhancement.",
      "source": "requirement"
    },
    {
      "originalText": "Communicate product strategy, progress, and outcomes to stakeholders and leadership.",
      "source": "requirement"
    },
    {
      "originalText": "Stay up to date with AI, machine learning, cloud, and product management trends.",
      "source": "requirement"
    },
    {
      "originalText": "4+ years of product management experience, ideally with digital, data-driven, or AI-powered products.",
      "source": "requirement"
    },
    {
      "originalText": "Proven experience leading cross-functional teams including engineers, data scientists, designers, and business stakeholders.",
      "source": "requirement"
    },
    {
      "originalText": "Strong technical understanding of APIs, cloud services, data pipelines, integrations, and software development.",
      "source": "requirement"
    },
    {
      "originalText": "Solid knowledge of AI and GenAI concepts, including agents, RAG, evaluation, data quality, and Responsible AI.",
      "source": "requirement"
    },
    {
      "originalText": "Experience with agentic AI frameworks such as LangChain, LangGraph, Langfuse, or similar platforms.",
      "source": "requirement"
    },
    {
      "originalText": "Familiarity with secure AI system design, access controls, privacy, governance, and enterprise integrations.",
      "source": "requirement"
    },
    {
      "originalText": "Strong ability to translate complex business needs into clear product",
      "source": "requirement"
    },
    {
      "originalText": "and delivery plans.",
      "source": "requirement"
    },
    {
      "originalText": "Excellent analytical, prioritization, and communication",
      "source": "requirement"
    },
    {
      "originalText": "Experience with Agile methodologies and tools such as Jira and Confluence.",
      "source": "requirement"
    },
    {
      "originalText": "Familiarity with AWS, Azure, or GCP is an advantage.",
      "source": "requirement"
    },
    {
      "originalText": "Bachelor's degree in Computer Science, Engineering, Information Systems, Business, or a related field (or equivalent experience)",
      "source": "requirement"
    },
    {
      "originalText": "Location: Tel Aviv, Hybrid",
      "source": "requirement"
    },
    {
      "originalText": "We at Deloitte believe that diversity and inclusion among our people is a critical component of our success and that is why we cultivate an organizational culture that contains and embraces diversity in all its forms.",
      "source": "requirement"
    },
    {
      "originalText": "We are looking for an experienced Technical Product Manager to lead the discovery, delivery, and evolution of AI-enabled and agentic products. You will combine strong product judgment with enough technical depth to make informed decisions about agent architecture, data, model performance, tool integrations, evaluation, and delivery trade-offs.",
      "source": "responsibility"
    },
    {
      "originalText": "Working closely with engineering, data science, design, and business teams, you will turn complex opportunities into secure, scalable, user-centred products that create measurable value. This role is ideal for a product leader who enjoys moving between customer needs, technical constraints, and business outcomes.",
      "source": "responsibility"
    },
    {
      "originalText": "Lead the end-to-end lifecycle of AI-enabled and agentic products, from discovery to launch and continuous improvement.",
      "source": "responsibility"
    },
    {
      "originalText": "Define product vision, strategy, roadmaps, and measurable business outcomes.",
      "source": "responsibility"
    },
    {
      "originalText": "Collaborate with engineering and data science teams to deliver scalable, secure AI solutions and workflows.",
      "source": "responsibility"
    }
  ]
}
```

### G06 — Product Designer - Figma Weave

Source: https://job-boards.greenhouse.io/figma/jobs/5991320004?gh_jid=5991320004

Lost critical concepts: `generative AI, node-based workflow editing`

Contamination: `equal opportunity workplace`, `Candidate Privacy Notice`

```json
{
  "title": "Product Designer - Figma Weave (Tel Aviv, Israel)",
  "responsibilities": [
    "at Figma Weave:",
    "Contribute to overall strategy and decision-making about product direction",
    "Help deliver clear storytelling around customer needs and business opportunities",
    "Work cross-functionally with product management, engineering, and design peers",
    "Create, collaborate, and iterate on flows, prototypes, and high-fidelity visuals",
    "Design and ship high-quality features and product improvements",
    "Be a mentor and provide thoughtful feedback to your peers (and benefit from strong personal and professional mentorship opportunities yourself!)",
    "We'd love to hear from you if you have:",
    "5+ years of experience working as a product designer",
    "3+ years of experience working on a software product with similar scale or complexity",
    "Experience using node-based design tools or broader design/ development tools",
    "Excellent communication and presentation"
  ],
  "requirements": [
    "you're able to explain your design decisions and strategy with clear rationale and storytelling",
    "Great attention to detail, and an eye for visual craft, such as composition, typography, and layout",
    "While not required, it's an added plus if you also have:",
    "Familiarity with technical things like HTML/CSS, prototyping tools such as Origami, or advanced Figma features like Auto Layout, Variables, and Components",
    "Past experience designing for developers, or partnering closely with developing on complex problems",
    "A design/development hybrid background, or experience building websites or apps",
    "A history of working on canvas-based interfaces or tools that support creative workflows",
    "At Figma, one of our values is Grow as you go. We believe in hiring smart, curious people who are excited to learn and develop their",
    "If you're excited about this role but your past experience doesn't align perfectly with the points outlined in the",
    "We will work to ensure individuals with disabilities are provided reasonable accommodation to apply for a role, participate in the interview process, perform essential job functions, and receive other benefits and privileges of employment. If you require accommodation, please reach out to accommodations-ext@figma.com.",
    "These modifications enable an individual with a disability to have an equal opportunity not only to get a job, but successfully perform their job tasks to the same extent as people without disabilities.",
    "Examples of accommodations include but are not limited to:",
    "Holding interviews in an accessible location",
    "Enabling closed captioning on video conferencing",
    "Ensuring all written communication be compatible with screen readers",
    "Changing the mode or format of interviews",
    "To ensure the integrity of our hiring process and facilitate a more personal connection, we require all candidates keep their cameras on during video interviews. Additionally, if hired you will be required to attend in person onboarding.",
    "By applying for this job, the candidate acknowledges and agrees that any personal data contained in their application or supporting materials will be processed in accordance with Figma's Candidate Privacy Notice."
  ],
  "preferred": [],
  "roleItems": [
    {
      "originalText": "you're able to explain your design decisions and strategy with clear rationale and storytelling",
      "source": "requirement"
    },
    {
      "originalText": "Great attention to detail, and an eye for visual craft, such as composition, typography, and layout",
      "source": "requirement"
    },
    {
      "originalText": "While not required, it's an added plus if you also have:",
      "source": "requirement"
    },
    {
      "originalText": "Familiarity with technical things like HTML/CSS, prototyping tools such as Origami, or advanced Figma features like Auto Layout, Variables, and Components",
      "source": "requirement"
    },
    {
      "originalText": "Past experience designing for developers, or partnering closely with developing on complex problems",
      "source": "requirement"
    },
    {
      "originalText": "A design/development hybrid background, or experience building websites or apps",
      "source": "requirement"
    },
    {
      "originalText": "A history of working on canvas-based interfaces or tools that support creative workflows",
      "source": "requirement"
    },
    {
      "originalText": "At Figma, one of our values is Grow as you go. We believe in hiring smart, curious people who are excited to learn and develop their",
      "source": "requirement"
    },
    {
      "originalText": "If you're excited about this role but your past experience doesn't align perfectly with the points outlined in the",
      "source": "requirement"
    },
    {
      "originalText": "We will work to ensure individuals with disabilities are provided reasonable accommodation to apply for a role, participate in the interview process, perform essential job functions, and receive other benefits and privileges of employment. If you require accommodation, please reach out to accommodations-ext@figma.com.",
      "source": "requirement"
    },
    {
      "originalText": "These modifications enable an individual with a disability to have an equal opportunity not only to get a job, but successfully perform their job tasks to the same extent as people without disabilities.",
      "source": "requirement"
    },
    {
      "originalText": "Examples of accommodations include but are not limited to:",
      "source": "requirement"
    },
    {
      "originalText": "Holding interviews in an accessible location",
      "source": "requirement"
    },
    {
      "originalText": "Enabling closed captioning on video conferencing",
      "source": "requirement"
    },
    {
      "originalText": "Ensuring all written communication be compatible with screen readers",
      "source": "requirement"
    },
    {
      "originalText": "Changing the mode or format of interviews",
      "source": "requirement"
    },
    {
      "originalText": "To ensure the integrity of our hiring process and facilitate a more personal connection, we require all candidates keep their cameras on during video interviews. Additionally, if hired you will be required to attend in person onboarding.",
      "source": "requirement"
    },
    {
      "originalText": "By applying for this job, the candidate acknowledges and agrees that any personal data contained in their application or supporting materials will be processed in accordance with Figma's Candidate Privacy Notice.",
      "source": "requirement"
    },
    {
      "originalText": "at Figma Weave:",
      "source": "responsibility"
    },
    {
      "originalText": "Contribute to overall strategy and decision-making about product direction",
      "source": "responsibility"
    },
    {
      "originalText": "Help deliver clear storytelling around customer needs and business opportunities",
      "source": "responsibility"
    },
    {
      "originalText": "Work cross-functionally with product management, engineering, and design peers",
      "source": "responsibility"
    },
    {
      "originalText": "Create, collaborate, and iterate on flows, prototypes, and high-fidelity visuals",
      "source": "responsibility"
    },
    {
      "originalText": "Design and ship high-quality features and product improvements",
      "source": "responsibility"
    },
    {
      "originalText": "Be a mentor and provide thoughtful feedback to your peers (and benefit from strong personal and professional mentorship opportunities yourself!)",
      "source": "responsibility"
    },
    {
      "originalText": "We'd love to hear from you if you have:",
      "source": "responsibility"
    },
    {
      "originalText": "5+ years of experience working as a product designer",
      "source": "responsibility"
    },
    {
      "originalText": "3+ years of experience working on a software product with similar scale or complexity",
      "source": "responsibility"
    },
    {
      "originalText": "Experience using node-based design tools or broader design/ development tools",
      "source": "responsibility"
    },
    {
      "originalText": "Excellent communication and presentation",
      "source": "responsibility"
    }
  ]
}
```

### G07 — Senior UX Designer

Source: https://il.linkedin.com/jobs/view/senior-ux-designer-at-walmart-global-tech-4456823128

Lost critical concepts: none

Contamination: none

```json
{
  "title": "Senior UX Designer",
  "responsibilities": [
    "Lead Core Product UX Design: Take full ownership of the user experience for Walmart Israel's digital products, shaping the design vision and transforming complex"
  ],
  "requirements": [
    ", a deep understanding of research- and data-driven product goals, and the ability to take ownership of end-to-end UX processes.",
    "This role requires a designer who can work in a structured and methodical way—defining problems clearly, grounding decisions in user research and data, and translating insights into clear, intuitive user flows and high-quality experiences, while collaborating effectively with cross-functional teams.",
    "into intuitive, highly functional digital solutions.",
    "End-to-End Execution: Map comprehensive user journeys and structural workflows, seamlessly translating them into interactive prototypes and pixel-perfect, high-fidelity UI designs.",
    "Research & Data-Driven Iteration: Conduct targeted user research (e.g., usability testing, user interviews) and leverage behavioral analytics to validate design hypotheses, pinpoint friction areas, and continuously optimize the product.",
    "Cross-Functional Alignment: Act as the central design advocate, partnering closely with Product Managers and Engineers to balance user insights with technical feasibility and overarching business goals.",
    "UX Strategy, Research & Data",
    "Research & Synthesis Expertise: Demonstrated ability to conduct foundational and evaluative research (interviews, surveys) and distill findings into actionable artifacts like personas and Jobs-to-be-Done (JTBD).",
    "Methodological Fluency: Deep understanding of Human-Centered Design principles, Double Diamond frameworks, and Information Architecture modeling.",
    "Analytical Acumen: Strong capability to interpret behavioral data, A/B test results, and funnel metrics to ground design hypotheses in empirical evidence.",
    "Design Execution & Collaboration",
    "Craft & Tooling Mastery: Expert-level proficiency in Figma and Adobe CS, backed by a portfolio showcasing scalable design systems and meticulous attention to UI detail.",
    "Collaborative Mindset: Proven track record of thriving in agile, cross-functional environments alongside technical and commercial teams.",
    "Persuasive Communication: Excellent storytelling and presentation",
    ", with the ability to confidently defend design choices to leadership using structured rationale and data.",
    "Strong English communication",
    "Hebrew – required"
  ],
  "preferred": [
    "– AI Mindset:",
    "Interest in how AI is shaping user experience and product design",
    "Ability to integrate AI thinking into discovery, ideation, and UX flows",
    "Awareness of user trust, transparency, and limitations in AI-driven experiences",
    "Experience designing AI-driven or data-informed experiences is a plus",
    "Additional"
  ],
  "roleItems": [
    {
      "originalText": ", a deep understanding of research- and data-driven product goals, and the ability to take ownership of end-to-end UX processes.",
      "source": "requirement"
    },
    {
      "originalText": "This role requires a designer who can work in a structured and methodical way—defining problems clearly, grounding decisions in user research and data, and translating insights into clear, intuitive user flows and high-quality experiences, while collaborating effectively with cross-functional teams.",
      "source": "requirement"
    },
    {
      "originalText": "into intuitive, highly functional digital solutions.",
      "source": "requirement"
    },
    {
      "originalText": "End-to-End Execution: Map comprehensive user journeys and structural workflows, seamlessly translating them into interactive prototypes and pixel-perfect, high-fidelity UI designs.",
      "source": "requirement"
    },
    {
      "originalText": "Research & Data-Driven Iteration: Conduct targeted user research (e.g., usability testing, user interviews) and leverage behavioral analytics to validate design hypotheses, pinpoint friction areas, and continuously optimize the product.",
      "source": "requirement"
    },
    {
      "originalText": "Cross-Functional Alignment: Act as the central design advocate, partnering closely with Product Managers and Engineers to balance user insights with technical feasibility and overarching business goals.",
      "source": "requirement"
    },
    {
      "originalText": "UX Strategy, Research & Data",
      "source": "requirement"
    },
    {
      "originalText": "Research & Synthesis Expertise: Demonstrated ability to conduct foundational and evaluative research (interviews, surveys) and distill findings into actionable artifacts like personas and Jobs-to-be-Done (JTBD).",
      "source": "requirement"
    },
    {
      "originalText": "Methodological Fluency: Deep understanding of Human-Centered Design principles, Double Diamond frameworks, and Information Architecture modeling.",
      "source": "requirement"
    },
    {
      "originalText": "Analytical Acumen: Strong capability to interpret behavioral data, A/B test results, and funnel metrics to ground design hypotheses in empirical evidence.",
      "source": "requirement"
    },
    {
      "originalText": "Design Execution & Collaboration",
      "source": "requirement"
    },
    {
      "originalText": "Craft & Tooling Mastery: Expert-level proficiency in Figma and Adobe CS, backed by a portfolio showcasing scalable design systems and meticulous attention to UI detail.",
      "source": "requirement"
    },
    {
      "originalText": "Collaborative Mindset: Proven track record of thriving in agile, cross-functional environments alongside technical and commercial teams.",
      "source": "requirement"
    },
    {
      "originalText": "Persuasive Communication: Excellent storytelling and presentation",
      "source": "requirement"
    },
    {
      "originalText": ", with the ability to confidently defend design choices to leadership using structured rationale and data.",
      "source": "requirement"
    },
    {
      "originalText": "Strong English communication",
      "source": "requirement"
    },
    {
      "originalText": "Hebrew – required",
      "source": "requirement"
    },
    {
      "originalText": "Lead Core Product UX Design: Take full ownership of the user experience for Walmart Israel's digital products, shaping the design vision and transforming complex",
      "source": "responsibility"
    }
  ]
}
```

### G08 — AI Product Designer

Source: https://www.linkedin.com/jobs/view/4301655258/

Lost critical concepts: `design GenAI-based features`, `prototyping with APIs`

Contamination: `Equal opportunity`, `recruitment process`

```json
{
  "title": "AI Product Designer",
  "responsibilities": [
    "You own the design of AI-powered features and end-user experiences across our products, with a focus on usability, clarity, and impact",
    "You collaborate with product managers, engineers, and data or ML teams to create smart, intuitive, and accessible interfaces that are built on AI capabilities",
    "You push boundaries – actively experimenting with what AI can enable in product design, both in terms of user experience and your own internal workflows"
  ],
  "requirements": [
    "3+ years of experience as a Product Designer in a high-tech or startup environment",
    "A strong portfolio with at least 5 product design examples – including AI-powered features or systems you helped design",
    "Daily hands-on use of AI tools in your workflow – from ideation to content generation, wireframing, UI design, and user testing",
    "Proven experience designing GenAI features such as chat interfaces, AI copilots, smart content flows, personalization systems, or prompt-based tools",
    "High proficiency in Figma, with"
  ],
  "preferred": [
    "for developing custom plugins, using APIs, or building internal tools to optimize design processes",
    "Comfortable with generative and visual AI tools like Midjourney, Runway, Framer AI, Galileo, or similar",
    "Strong UX and systems thinking, with the ability to turn technical complexity into clear, empowering experiences",
    "Passion for exploring new tools and a builder mindset – you're curious, fast, and always pushing boundaries",
    "CV and portfolio required.",
    "if you share AI-generated or AI-assisted artifacts you've created – tools, concepts, or workflows.",
    "Equal opportunity",
    "At accessiBe, we celebrate diversity and welcome people of all backgrounds. If you need any accommodations during the recruitment process, let us know. We're here to ensure a smooth and inclusive experience.",
    "Advantages:",
    "Portfolio+ CV required",
    "Equal opportunities",
    "At accessiBe, we prioritize diversity. We celebrate difference and embed it into every aspect of our workplace and product, as well as our community. accessiBe is proud and committed to providing equal opportunity employment to all individuals regardless of disability, race, color, religion, sex, sexual orientation, citizenship, national origin, veteran status, pregnancy or any other characteristic protected by law.",
    "In addition, accessiBe will provide accommodation to individuals with disabilities or a special need.",
    "Please don't hesitate to share your needs when applying so that we can provide the necessary accommodations for an accessible and inclusive recruitment process."
  ],
  "roleItems": [
    {
      "originalText": "3+ years of experience as a Product Designer in a high-tech or startup environment",
      "source": "requirement"
    },
    {
      "originalText": "A strong portfolio with at least 5 product design examples – including AI-powered features or systems you helped design",
      "source": "requirement"
    },
    {
      "originalText": "Daily hands-on use of AI tools in your workflow – from ideation to content generation, wireframing, UI design, and user testing",
      "source": "requirement"
    },
    {
      "originalText": "Proven experience designing GenAI features such as chat interfaces, AI copilots, smart content flows, personalization systems, or prompt-based tools",
      "source": "requirement"
    },
    {
      "originalText": "High proficiency in Figma, with",
      "source": "requirement"
    },
    {
      "originalText": "You own the design of AI-powered features and end-user experiences across our products, with a focus on usability, clarity, and impact",
      "source": "responsibility"
    },
    {
      "originalText": "You collaborate with product managers, engineers, and data or ML teams to create smart, intuitive, and accessible interfaces that are built on AI capabilities",
      "source": "responsibility"
    },
    {
      "originalText": "You push boundaries – actively experimenting with what AI can enable in product design, both in terms of user experience and your own internal workflows",
      "source": "responsibility"
    }
  ]
}
```

### G09 — Senior Product Design Engineer

Source: https://jobs.ashbyhq.com/duck-duck-go/ca69d3dd-7cef-4e02-9a1b-5f4d103fe4cd

Lost critical concepts: none

Contamination: `DISCLOSURE STATEMENT: USE OF AI IN HIRING PROCESS`, `Data Privacy`, `Human Oversight and Accountability`

```json
{
  "title": "Senior Product Design Engineer",
  "responsibilities": [
    "and discipline!",
    "As a Senior Product Design Engineer, you'll collaborate across levels to solve problems in our current products and pioneer new ones as we build the privacy layer for the Internet. You'll autonomously lead high-impact projects at scale from ideation to execution with a voice in product design decisions large and small.",
    "About You",
    "7+ years in product design roles, including 2+ years senior-level at significant global consumer brands",
    "Pushes creative limits on hard design problems, delivering delight, craft, and exceptional quality",
    "Communicates visual and interaction recommendations through high-quality mockups, rationale, prototypes, and specific motion variables",
    "Partners with engineers as a peer — reasoning about decisions in PR reviews, contributing code where it raises design quality",
    "Prototypes in code to a production standard, with an understanding of semantic markup and accessibility, leveraging but not relying on AI",
    "Experience structuring a design system beyond component inventory: token layering, primitive vs. semantic naming, design-to-code parity",
    "Proficient in research and experimentation, using both qualitative and quantitative data, comfortable instrumenting your own work",
    "Experience participating in multiple areas of the product process including prioritization, strategy, and user testing",
    "Takes initiative",
    "generates ideas and carries them forward with urgency and discretion, while working openly",
    "Experience defining"
  ],
  "requirements": [
    "close the gap between the design that's intended and the product that ships. You're fluent enough in code to prototype, spec precisely, and partner with engineers as a peer, working directly in the codebase to make sure execution clears the bar you set. As our 2nd Design Engineer, you'll have real leadership opportunities to shape",
    "and building tools that accelerate design and engineering workflows while retaining design system quality and consistency",
    "COMPENSATION",
    "$178,500 USD annually and stock options. Compensation is identical within professional levels https://duckduckgo.com/how-we-work, regardless of geographic location or team. Compensation for each professional level is transparent across the organization.",
    "Eligibility for company-sponsored health benefits is limited to team members based in the United States. This program does not extend to team members located in other countries, such as Canada or the UK.",
    "Our Team Member Support Guide https://duckduckgo.com/assets/hiring/team_support_guide.pdf explains how we prioritize your wellbeing including paid parental leave, office setup, and co-working allowances.",
    "HIRING PROCESS",
    "Hiring works best when it's a two-way street. Learn how we help you get to know DuckDuckGo, envision your future role here, and find out more about how we hire https://duckduckgo.com/how-we-hire.",
    "DIVERSITY, EQUITY AND INCLUSION",
    "DuckDuckGo provides equal work opportunities to all team members and applicants, and it prohibits discrimination and harassment of any type on the basis of race, color, ethnicity, caste, religion, age, sex (including pregnancy), national origin, disability status, genetics, protected veteran status, sexual orientation, gender identity or expression, or any other characteristic protected by our policies or federal, state, or local laws.",
    "We want to ensure that our hiring process is accessible. If you need reasonable accommodation for any part of the application process because of a medical condition or disability, please send an email to careers@duckduckgo.com to let us know the nature of your request.",
    "PLEASE NOTE THAT:",
    "You'll be required to attend meetings on camera via video conferencing",
    "Expect to travel at least two times a year: once for our all-hands meetup and again for a team retreat (each around 4-5 days). While extenuating circumstances may impact attendance, everyone is strongly encouraged to attend.",
    "While we offer a flexible work arrangement with no core hours, expect an average full-time commitment of 40 hours per week.",
    "A successful candidate must pass a background check as a condition of joining the team.",
    "By applying for this role, you confirm that all information submitted is accurate and complete. You further acknowledge that providing false or fraudulent information during the application process is cause for denial of an offer, revocation of any existing offer, or other adverse action, up to and including termination after the start of your commencement of work.",
    "DISCLOSURE STATEMENT: USE OF AI IN HIRING PROCESS",
    "As part of our commitment to enhancing our recruitment process, we utilize artificial intelligence (AI) technology to assist in reviewing and summarizing job applications and test projects, including those tools integrated into our recruitment vendor platforms. We use AI to flag potentially fraudulent applications, analyze and summarize applicants' experience, interviews, and project performance, and help streamline our selection process.",
    "Key Principles:",
    "Data Privacy: All information provided in your application will be handled in accordance with our Recruiting Privacy Policy https://duckduckgo.com/static-assets/files/pages/careers/DuckDuckGo-Recruiting-Privacy-Policy-effective-September-30-2025.pdf. We ensure that your personal information is protected and used solely for recruitment purposes.",
    "Human Oversight and Accountability: The AI technology is designed to support our hiring team by providing insights and summaries of applications and evaluations of test projects against scoring rubrics. All final evaluations and hiring decisions, however, will be made by our hiring team, who will consider the AI's input alongside other factors.",
    "Transparency: We believe in transparency regarding our hiring practices. If you have any questions about how AI is used in our recruitment process, please feel free to reach out to us.",
    "By submitting your application, you acknowledge and consent to the use of AI technology in our review process. If you would like to request an alternative selection process, please contact us as at careers@duckduckgo.com. Thank you for your interest in joining DuckDuckGo!"
  ],
  "preferred": [],
  "roleItems": [
    {
      "originalText": "close the gap between the design that's intended and the product that ships. You're fluent enough in code to prototype, spec precisely, and partner with engineers as a peer, working directly in the codebase to make sure execution clears the bar you set. As our 2nd Design Engineer, you'll have real leadership opportunities to shape",
      "source": "requirement"
    },
    {
      "originalText": "and building tools that accelerate design and engineering workflows while retaining design system quality and consistency",
      "source": "requirement"
    },
    {
      "originalText": "COMPENSATION",
      "source": "requirement"
    },
    {
      "originalText": "$178,500 USD annually and stock options. Compensation is identical within professional levels https://duckduckgo.com/how-we-work, regardless of geographic location or team. Compensation for each professional level is transparent across the organization.",
      "source": "requirement"
    },
    {
      "originalText": "Eligibility for company-sponsored health benefits is limited to team members based in the United States. This program does not extend to team members located in other countries, such as Canada or the UK.",
      "source": "requirement"
    },
    {
      "originalText": "Our Team Member Support Guide https://duckduckgo.com/assets/hiring/team_support_guide.pdf explains how we prioritize your wellbeing including paid parental leave, office setup, and co-working allowances.",
      "source": "requirement"
    },
    {
      "originalText": "HIRING PROCESS",
      "source": "requirement"
    },
    {
      "originalText": "Hiring works best when it's a two-way street. Learn how we help you get to know DuckDuckGo, envision your future role here, and find out more about how we hire https://duckduckgo.com/how-we-hire.",
      "source": "requirement"
    },
    {
      "originalText": "DIVERSITY, EQUITY AND INCLUSION",
      "source": "requirement"
    },
    {
      "originalText": "DuckDuckGo provides equal work opportunities to all team members and applicants, and it prohibits discrimination and harassment of any type on the basis of race, color, ethnicity, caste, religion, age, sex (including pregnancy), national origin, disability status, genetics, protected veteran status, sexual orientation, gender identity or expression, or any other characteristic protected by our policies or federal, state, or local laws.",
      "source": "requirement"
    },
    {
      "originalText": "We want to ensure that our hiring process is accessible. If you need reasonable accommodation for any part of the application process because of a medical condition or disability, please send an email to careers@duckduckgo.com to let us know the nature of your request.",
      "source": "requirement"
    },
    {
      "originalText": "PLEASE NOTE THAT:",
      "source": "requirement"
    },
    {
      "originalText": "You'll be required to attend meetings on camera via video conferencing",
      "source": "requirement"
    },
    {
      "originalText": "Expect to travel at least two times a year: once for our all-hands meetup and again for a team retreat (each around 4-5 days). While extenuating circumstances may impact attendance, everyone is strongly encouraged to attend.",
      "source": "requirement"
    },
    {
      "originalText": "While we offer a flexible work arrangement with no core hours, expect an average full-time commitment of 40 hours per week.",
      "source": "requirement"
    },
    {
      "originalText": "A successful candidate must pass a background check as a condition of joining the team.",
      "source": "requirement"
    },
    {
      "originalText": "By applying for this role, you confirm that all information submitted is accurate and complete. You further acknowledge that providing false or fraudulent information during the application process is cause for denial of an offer, revocation of any existing offer, or other adverse action, up to and including termination after the start of your commencement of work.",
      "source": "requirement"
    },
    {
      "originalText": "DISCLOSURE STATEMENT: USE OF AI IN HIRING PROCESS",
      "source": "requirement"
    },
    {
      "originalText": "As part of our commitment to enhancing our recruitment process, we utilize artificial intelligence (AI) technology to assist in reviewing and summarizing job applications and test projects, including those tools integrated into our recruitment vendor platforms. We use AI to flag potentially fraudulent applications, analyze and summarize applicants' experience, interviews, and project performance, and help streamline our selection process.",
      "source": "requirement"
    },
    {
      "originalText": "Key Principles:",
      "source": "requirement"
    },
    {
      "originalText": "Data Privacy: All information provided in your application will be handled in accordance with our Recruiting Privacy Policy https://duckduckgo.com/static-assets/files/pages/careers/DuckDuckGo-Recruiting-Privacy-Policy-effective-September-30-2025.pdf. We ensure that your personal information is protected and used solely for recruitment purposes.",
      "source": "requirement"
    },
    {
      "originalText": "Human Oversight and Accountability: The AI technology is designed to support our hiring team by providing insights and summaries of applications and evaluations of test projects against scoring rubrics. All final evaluations and hiring decisions, however, will be made by our hiring team, who will consider the AI's input alongside other factors.",
      "source": "requirement"
    },
    {
      "originalText": "Transparency: We believe in transparency regarding our hiring practices. If you have any questions about how AI is used in our recruitment process, please feel free to reach out to us.",
      "source": "requirement"
    },
    {
      "originalText": "By submitting your application, you acknowledge and consent to the use of AI technology in our review process. If you would like to request an alternative selection process, please contact us as at careers@duckduckgo.com. Thank you for your interest in joining DuckDuckGo!",
      "source": "requirement"
    },
    {
      "originalText": "and discipline!",
      "source": "responsibility"
    },
    {
      "originalText": "As a Senior Product Design Engineer, you'll collaborate across levels to solve problems in our current products and pioneer new ones as we build the privacy layer for the Internet. You'll autonomously lead high-impact projects at scale from ideation to execution with a voice in product design decisions large and small.",
      "source": "responsibility"
    },
    {
      "originalText": "About You",
      "source": "responsibility"
    },
    {
      "originalText": "7+ years in product design roles, including 2+ years senior-level at significant global consumer brands",
      "source": "responsibility"
    },
    {
      "originalText": "Pushes creative limits on hard design problems, delivering delight, craft, and exceptional quality",
      "source": "responsibility"
    },
    {
      "originalText": "Communicates visual and interaction recommendations through high-quality mockups, rationale, prototypes, and specific motion variables",
      "source": "responsibility"
    },
    {
      "originalText": "Partners with engineers as a peer — reasoning about decisions in PR reviews, contributing code where it raises design quality",
      "source": "responsibility"
    },
    {
      "originalText": "Prototypes in code to a production standard, with an understanding of semantic markup and accessibility, leveraging but not relying on AI",
      "source": "responsibility"
    },
    {
      "originalText": "Experience structuring a design system beyond component inventory: token layering, primitive vs. semantic naming, design-to-code parity",
      "source": "responsibility"
    },
    {
      "originalText": "Proficient in research and experimentation, using both qualitative and quantitative data, comfortable instrumenting your own work",
      "source": "responsibility"
    },
    {
      "originalText": "Experience participating in multiple areas of the product process including prioritization, strategy, and user testing",
      "source": "responsibility"
    },
    {
      "originalText": "Takes initiative",
      "source": "responsibility"
    },
    {
      "originalText": "generates ideas and carries them forward with urgency and discretion, while working openly",
      "source": "responsibility"
    },
    {
      "originalText": "Experience defining",
      "source": "responsibility"
    }
  ]
}
```

### G10 — Payroll Accountant (negative control)

Source: https://jobs.smartrecruiters.com/Wix2/744000143985674-payroll-accountant

Lost critical concepts: none

Contamination: `third-party website`

```json
{
  "title": "",
  "responsibilities": [
    "Manage the end-to-end monthly payroll process",
    "Own all payroll-related aspects of the employee lifecycle, including onboarding, employment changes, offboarding, and final settlements",
    "Provide professional support and guidance to employees regarding payroll inquiries"
  ],
  "requirements": [
    "4+ years of experience as a payroll accountant",
    "Significant hands-on experience working with the Hilan payroll system (required)",
    "Hands-on experience working with the Hilanet attendance system",
    "Proven experience managing the payroll process end-to-end",
    "High level of English (written and spoken)",
    "Proficiency in Microsoft Excel",
    "Knowledge of Israeli labor laws and pension regulations",
    "Relevant certifications such as Certified Payroll Professional (CPP) or equivalent – an advantage",
    "Strong understanding of the entire employee lifecycle, from onboarding through offboarding and final settlements",
    "Additional Information",
    "We are Wix's Finance Group. We oversee all financial transactions at Wix, which includes overseeing the company's financial management, external partnerships, and more. We're a large global group in various roles including FP&A, Procurement, and Business Development. We approach finance The Wix Way, which means we're pros at what we do, but still make time to have fun and learn new things.",
    "By clicking the link above or any third-party link within this posting, you are leaving this site and going to a third-party website where the third-party website's terms and privacy policy apply"
  ],
  "preferred": [],
  "roleItems": [
    {
      "originalText": "4+ years of experience as a payroll accountant",
      "source": "requirement"
    },
    {
      "originalText": "Significant hands-on experience working with the Hilan payroll system (required)",
      "source": "requirement"
    },
    {
      "originalText": "Hands-on experience working with the Hilanet attendance system",
      "source": "requirement"
    },
    {
      "originalText": "Proven experience managing the payroll process end-to-end",
      "source": "requirement"
    },
    {
      "originalText": "High level of English (written and spoken)",
      "source": "requirement"
    },
    {
      "originalText": "Proficiency in Microsoft Excel",
      "source": "requirement"
    },
    {
      "originalText": "Knowledge of Israeli labor laws and pension regulations",
      "source": "requirement"
    },
    {
      "originalText": "Relevant certifications such as Certified Payroll Professional (CPP) or equivalent – an advantage",
      "source": "requirement"
    },
    {
      "originalText": "Strong understanding of the entire employee lifecycle, from onboarding through offboarding and final settlements",
      "source": "requirement"
    },
    {
      "originalText": "Additional Information",
      "source": "requirement"
    },
    {
      "originalText": "We are Wix's Finance Group. We oversee all financial transactions at Wix, which includes overseeing the company's financial management, external partnerships, and more. We're a large global group in various roles including FP&A, Procurement, and Business Development. We approach finance The Wix Way, which means we're pros at what we do, but still make time to have fun and learn new things.",
      "source": "requirement"
    },
    {
      "originalText": "By clicking the link above or any third-party link within this posting, you are leaving this site and going to a third-party website where the third-party website's terms and privacy policy apply",
      "source": "requirement"
    },
    {
      "originalText": "Manage the end-to-end monthly payroll process",
      "source": "responsibility"
    },
    {
      "originalText": "Own all payroll-related aspects of the employee lifecycle, including onboarding, employment changes, offboarding, and final settlements",
      "source": "responsibility"
    },
    {
      "originalText": "Provide professional support and guidance to employees regarding payroll inquiries",
      "source": "responsibility"
    }
  ]
}
```

## Deterministic evidence trace

The adjacent JSON artifact contains the complete `candidatesByRoleItem`, every packed candidate ID set, and every compact evidence source ID for all cases. Two consecutive runs produced the same evidence fingerprint: `f88999ff7398238bd0e78683ad5aa49f2bf8742a71fb316eacdf963a79561531`.

## Upload transport

The existing `Uploaded file: <filename>` prefix was passed through the same chat admission and parser boundary. G01 and G03–G10 matched their plain-text parser arrays. G02 was rejected at admission in both forms; because the upload message was not parsed, its resulting empty draft does not match the direct diagnostic parse.

## Existing test conflict

`lib/role-fit/server/role-understanding.test.ts` contains `recognizes headings embedded in continuous text`. It requires prose-inline phrases such as `Responsibilities`, `What You Have`, and `Preferred Qualifications` to open sections without line boundaries. That behavior directly conflicts with the approved line-aware Structural Recovery rule, where heading recognition requires structural line context so ordinary prose cannot become a heading.

## Test enumeration

The `package.json` test command explicitly lists every test file. A future standalone Golden Corpus test file will therefore require a mechanical test-command update; this baseline capture script runs directly and required no package change.

## Scope conclusion

The baseline exposes parser/admission defects but no need to change protected eligibility, report composition, evidence ranking/packing, persistence, session, mobile, provider, or deployment mechanisms. Structural Recovery can remain bounded to role-understanding behavior plus its tests and corpus expectations.

