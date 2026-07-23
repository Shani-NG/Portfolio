# Home Page — Content Map

Source: Approved homepage content based on Figma and Shani's subsequent decisions.

## Global Navigation

Brand: Shani Nakash-Gomel

Brand destination: `home-intro`

Navigation sequence:

1. Experience
2. About
3. Contact Me

### Implementation Notes — Navigation Anchors

- Experience: `technical-excellence`
- About: `core-values`
- Contact Me: `contact`

### Experience Contextual Menu

1. Monitor Module  
   Case study: The Big RED BUTTON
2. C4I Operational System  
   Case study: C4I - Beyond Clarity
3. Data Driven Design  
   Case study: Monitoring and Product Intelligence
4. Knowledge Management System  
   Case study: Nobody Reads the Manual
5. Product Monitoring System  
   Case study: Monitoring as Product Intelligence

Each item opens its case study in the same tab. On mobile, the contextual menu must open by tap and preserve the current page context.

## 1. Hero

Anchor: `home-intro`

Headline: KEEP IT COMPLEX

Subheadline: I’ll take it from there.

## 2. Role Fit Agent Entry

Anchor: `role-fit-agent`

### Animated Headline

Fixed text: As challenges evolve, solutions take shape through 

Rotating terms:

1. Product Strategy
2. Vision & Innovation
3. AI Workflows

Typing cursor: `|`

### Animation Behavior

- Each rotating term is typed and deleted character by character.
- Adding or removing characters changes the rendered line length.
- The blinking cursor always appears after the last visible character.
- The cursor remains visible while typing, pausing, and deleting.
- Mobile wrapping must remain readable and avoid excessive layout movement.

### Agent Input

Placeholder: Ask me anything about my experience...

### Quick Actions

1. Upload a job description
2. Paste job details
3. Explore my experience

### Product Rules

- The agent is the Role Fit Agent, not a generic portfolio chatbot.
- A fit report requires sufficient role requirements and responsibility context.
- No analysis, scores, gaps, semantic matches, or recommended projects appear before explicit report-generation confirmation.
- The report uses semantic fit, transferable skills, and contextual evidence.
- Report evidence links to relevant case-study anchors.
- Chat, report, and project navigation preserve context.
- V1 does not generate or rewrite a tailored CV.

## 3. Core Values

Anchor: `core-values`

Heading: Core Values

Supporting text: The working principles behind the way I lead strategy, innovation and AI adoption.

### Integrity

Clear communication, honest thinking, and no hidden agendas. Trust is built through transparency, especially when things are complex.

### Excellence

Excellence lives in the details people may not notice, but always feel. The work should be sharp, reliable, and deeply considered.

### Collaboration

Strong solutions are built through teamwork. Listening, alignment, and shared language turn different perspectives into one direction.

### Commitment

I stay fully invested from brief to delivery, making innovation practical, secure, and useful for real teams, within real constraints and timelines.

Media requirement: One icon per value.

## 4. Experience

Anchor: `technical-excellence`

All five projects use the same hierarchy:

1. Category
2. Project title
3. Supporting statement
4. Project-specific image
5. View project button

### Project 1

Category: MONITOR MODULE

Title: The Big RED BUTTON

Supporting statement: Reducing critical downtime through targeted recovery

Button: View project

### Project 2

Category: Critical Missions

Title: C4I - Beyond Clarity

Supporting statement: An operational system for awareness, coordination, trusted information, and accountable decisions.

Button: View project

### Project 3

Category: Data Driven Design

Title: Monitoring and Product Intelligence

Supporting statement: Transforming Anecdotal Feedback into Data-Driven Strategy

Button: View project

### Project 4

Category: KNOWLEDGE MANAGEMENT SYSTEM

Title: Nobody Reads the Manual

Supporting statement: Structuring expert knowledge before generative AI

Button: View project

### Project 5

Category: SYSTEM MONITORING / PRODUCT STRATEGY

Title: Monitoring as Product Intelligence

Supporting statement: Turning field feedback, commander evaluations, and Excel-based reports into a measurable product learning system.

Button: View project

### Project Scope

- The homepage and contextual menu contain exactly five case studies.
- This sequence is final.
- Tower Control is excluded from V1.
- Each project requires a distinct, relevant image.
- Every View project button opens the corresponding case study in the same tab.

## 5. Expertise Areas

Anchor: `expertise-areas`

Heading: Expertise Areas

Supporting text: A high-level view of the three ways I help complex products move from ambiguity to clear, usable systems.

### Strategy

- Shape product direction
- Turn complexity into clarity
- Align teams around decisions

### Innovation

- Facilitate workshops and sprints
- Turn ideas into tested concepts
- Build adoption rituals

### AI Workflows

- Map AI into real workflows
- Design agentic automation
- Enable teams through practice

Media requirement: One icon per expertise area.

## 6. Contact

Anchor: `contact`

Heading: THANKS FOR MAKING IT THIS FAR!

Supporting text: Let’s collaborate on your next technical challenge and build something meaningful together.

Button: LET’S CONNECT

## Footer

Name: Shani Nakash-Gomel

Copyright and closing line: © 2026 Shani Nakash-Gomel. When human intent is clear, AI knows what to do.

External links:

- LINKEDIN
- WHATSAPP
- EMAIL

## Link and Route Contract

- Link destinations are documented now and will be connected when internal routes are created.
- Project and agent links stay in the same tab by default.
- Links from the agent or fit report must lead to the relevant semantic anchor inside the appropriate case study.
- Chat, report, and project navigation must preserve context across routes.

## Open Implementation Inputs

- Final images and alternative text for the five projects.
- Final URLs for project pages and external contact links.
- Mobile behavior for the contextual Experience menu.
- Route and state-continuity specifications for the Role Fit Agent and fit report.
