import { Job, Candidate } from './types';

// ============================================================
// MOCK DATA — All locations are within India
// Remote/Hybrid refer to work style (job type), not location.
// Location always reflects the office city in India.
// Salaries are in INR (₹ LPA = Lakhs Per Annum)
// ============================================================

export const MOCK_JOBS: Job[] = [
  {
    id: 'job-001',
    title: 'Senior Frontend Engineer',
    company: 'Luminary Labs',
    department: 'Engineering',
    location: 'Bengaluru, Karnataka',
    type: 'hybrid',
    summary: 'Build beautiful, performant web apps for millions of users across India.',
    description: `We're looking for a passionate Senior Frontend Engineer to join our growing product team in Bengaluru. You'll work closely with design and backend to create seamless, high-impact user experiences across our core platform.`,
    responsibilities: [
      'Architect and build scalable React/Next.js applications',
      'Collaborate with designers to implement pixel-perfect UIs',
      'Lead code reviews and mentor junior engineers',
      'Optimise performance and ensure mobile-first responsiveness',
      'Contribute to our design system and component library',
    ],
    requirements: [
      '5+ years of frontend experience with React',
      'Strong TypeScript skills',
      'Experience with Next.js and SSR/SSG patterns',
      'Familiarity with testing (Jest, Playwright)',
      'Excellent communication and collaboration skills',
    ],
    mustHaveSkills: ['React', 'TypeScript', 'Next.js', 'CSS-in-JS'],
    salary: '₹28 – 42 LPA',
    postedAt: '2026-09-10T08:00:00Z',
    status: 'published',
    applicantCount: 34,
  },
  {
    id: 'job-002',
    title: 'Product Designer',
    company: 'Luminary Labs',
    department: 'Design',
    location: 'Mumbai, Maharashtra',
    type: 'remote',
    summary: 'Shape the visual identity and UX of a fast-growing platform — work from anywhere in India.',
    description: `As our Product Designer, you'll own the end-to-end design process — from user research and wireframing to high-fidelity prototypes and design system maintenance. Base office is in Mumbai; fully remote-friendly role within India.`,
    responsibilities: [
      'Lead UX research sessions and synthesise insights into designs',
      'Create wireframes, prototypes, and high-fidelity Figma designs',
      'Maintain and evolve the product design system',
      'Collaborate with PMs and engineers throughout the product lifecycle',
      'Run A/B tests and iterate on data-driven feedback',
    ],
    requirements: [
      '4+ years of product design experience',
      'Expert-level Figma skills',
      'Strong portfolio showcasing shipped products',
      'Experience with design systems',
      'User research experience',
    ],
    mustHaveSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    salary: '₹22 – 35 LPA',
    postedAt: '2026-09-12T08:00:00Z',
    status: 'published',
    applicantCount: 51,
  },
  {
    id: 'job-003',
    title: 'AI / ML Engineer',
    company: 'Luminary Labs',
    department: 'AI Research',
    location: 'Hyderabad, Telangana',
    type: 'hybrid',
    summary: 'Build intelligent systems that power our AI-matching core engine.',
    description: `Join our AI team in Hyderabad to build and deploy machine learning models that power Luminary's hiring intelligence platform. You'll work on NLP, audio/video analysis, and real-time scoring systems.`,
    responsibilities: [
      'Design and train NLP models for transcript analysis',
      'Build audio/video feature extraction pipelines',
      'Deploy and monitor ML models in production',
      'Research and evaluate state-of-the-art approaches',
      'Collaborate with product to define AI-driven features',
    ],
    requirements: [
      '3+ years ML/AI engineering experience',
      'Strong Python skills (PyTorch or TensorFlow)',
      'Experience deploying ML models to production',
      'Knowledge of NLP and speech processing',
      'Familiarity with cloud ML platforms (AWS/GCP)',
    ],
    mustHaveSkills: ['Python', 'PyTorch', 'NLP', 'MLOps'],
    salary: '₹32 – 55 LPA',
    postedAt: '2026-09-14T08:00:00Z',
    status: 'published',
    applicantCount: 22,
  },
  {
    id: 'job-004',
    title: 'Growth Marketing Manager',
    company: 'Luminary Labs',
    department: 'Marketing',
    location: 'Gurugram, Haryana',
    type: 'hybrid',
    summary: 'Drive user acquisition and retention across all digital marketing channels.',
    description: `We're looking for a data-driven Growth Marketing Manager to own our acquisition strategy, run experiments, and scale our pipeline from our Gurugram hub. You'll partner with the product and sales teams directly.`,
    responsibilities: [
      'Own growth strategy across paid, organic, and partner channels',
      'Run rapid A/B experiments across landing pages, ads, and email',
      'Analyse funnel metrics and identify conversion opportunities',
      'Collaborate with content, design, and product teams',
      'Report growth KPIs to leadership weekly',
    ],
    requirements: [
      '4+ years in growth or performance marketing',
      'Strong analytical skills (SQL, Mixpanel, or Amplitude)',
      'Experience with paid acquisition (Google, Meta, LinkedIn)',
      'Excellent written communication in English and Hindi',
      'SaaS or B2B marketing experience preferred',
    ],
    mustHaveSkills: ['Growth Strategy', 'Analytics', 'Paid Acquisition', 'A/B Testing'],
    salary: '₹18 – 28 LPA',
    postedAt: '2026-09-15T08:00:00Z',
    status: 'published',
    applicantCount: 18,
  },
  {
    id: 'job-005',
    title: 'Backend Engineer (Node.js)',
    company: 'Luminary Labs',
    department: 'Engineering',
    location: 'Pune, Maharashtra',
    type: 'remote',
    summary: 'Build reliable, scalable APIs powering our core platform — remote within India.',
    description: `As a Backend Engineer, you'll design and implement APIs, microservices, and data pipelines for our hiring intelligence platform. Office base is Pune; role is fully remote within India. You'll work on systems processing thousands of real-time video submissions daily.`,
    responsibilities: [
      'Design and build RESTful/GraphQL APIs in Node.js/TypeScript',
      'Architect scalable microservices and data pipelines',
      'Build and maintain CI/CD pipelines',
      'Ensure system reliability, observability, and security',
      'Mentor junior engineers and lead backend architecture decisions',
    ],
    requirements: [
      '5+ years backend engineering with Node.js',
      'Strong SQL and NoSQL database knowledge',
      'Experience with AWS or GCP',
      'Familiarity with message queues (Kafka, SQS)',
      'Security-first mindset',
    ],
    mustHaveSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    salary: '₹24 – 38 LPA',
    postedAt: '2026-09-16T08:00:00Z',
    status: 'published',
    applicantCount: 29,
  },
  {
    id: 'job-006',
    title: 'Customer Success Manager',
    company: 'Luminary Labs',
    department: 'Customer Success',
    location: 'Chennai, Tamil Nadu',
    type: 'hybrid',
    summary: 'Be the voice of our customers and drive long-term retention across South India.',
    description: `Our Customer Success team is the bridge between our product and our clients. As a CSM based in Chennai, you'll own the onboarding, adoption, and renewal journey for a portfolio of mid-market and enterprise clients across the South India region.`,
    responsibilities: [
      'Own a portfolio of 30–50 enterprise accounts in South India',
      'Lead onboarding and training for new clients',
      'Monitor usage metrics and proactively address churn risks',
      'Conduct QBRs and executive business reviews',
      'Gather product feedback and relay to the product team',
    ],
    requirements: [
      '3+ years in Customer Success or Account Management',
      'Experience with B2B SaaS platforms',
      'Strong data literacy (Salesforce, Gainsight, or similar)',
      'Excellent presentation and communication skills (English + Tamil preferred)',
      'Ability to manage multiple priorities in a fast-paced environment',
    ],
    mustHaveSkills: ['Account Management', 'Salesforce', 'QBR Preparation', 'Churn Prevention'],
    salary: '₹15 – 22 LPA',
    postedAt: '2026-09-17T08:00:00Z',
    status: 'published',
    applicantCount: 12,
  },
];

// ── Candidate mock data ──
export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    jobId: 'job-001',
    jobTitle: 'Senior Frontend Engineer',
    submittedAt: '2026-09-16T14:32:00Z',
    status: 'decided',
    decision: 'selected',
    aiScore: 91,
    aiReasoning: 'Strong alignment with React and TypeScript requirements. Candidate demonstrated clear understanding of performance optimisation and design system architecture. Communication was articulate and confident. Exceeds expectations on all must-have skills.',
    transcript: `Hi, I'm Priya. I've spent the last 6 years building frontend systems at scale — most recently at Razorpay in Bengaluru, where I led the migration of our checkout UI to Next.js. I'm deeply passionate about performance and design systems. I led a project that cut our LCP by 40% and reduced bundle size by 35%. I work closely with designers to ensure pixel-perfect implementations, and I've mentored 3 junior engineers over the past year. I'm excited about the opportunity at Luminary because I believe AI-driven hiring can genuinely make the process fairer. I'd love to bring my experience building high-impact, user-centric products to your team.`,
    recordingUrl: '/recordings/cand-001.mp4',
  },
  {
    id: 'cand-002',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@email.com',
    jobId: 'job-001',
    jobTitle: 'Senior Frontend Engineer',
    submittedAt: '2026-09-16T16:45:00Z',
    status: 'decided',
    decision: 'not_selected',
    aiScore: 48,
    aiReasoning: 'Candidate has some frontend experience but lacks depth in TypeScript and Next.js — both marked as must-have skills. Did not mention experience with design systems or mentorship. Communication was unclear in places. Score reflects significant gaps in required technical skills.',
    transcript: `Hey, I'm Arjun. I've been doing frontend work for about 2 years, mostly with Vue and some React on smaller projects. I haven't used TypeScript much but I'm willing to learn. I've done some CSS and basic JavaScript. I like building things that look good. I think I could grow into this role with some time and guidance.`,
    recordingUrl: '/recordings/cand-002.mp4',
  },
  {
    id: 'cand-003',
    name: 'Kavitha Nair',
    email: 'kavitha.nair@email.com',
    jobId: 'job-002',
    jobTitle: 'Product Designer',
    submittedAt: '2026-09-17T09:15:00Z',
    status: 'decided',
    decision: 'manual_review',
    aiScore: 74,
    aiReasoning: 'Candidate shows strong Figma skills and good design sensibility. Mentioned user research experience but did not elaborate on methodology. Design system experience is implied but not confirmed. Score falls in the borderline zone — recommending manual human review to assess portfolio depth.',
    transcript: `Hello, I'm Kavitha. I've been a product designer for 5 years, working at both agencies and startups across Mumbai. My Figma skills are advanced — I've built two design systems from scratch for fintech products. I love the research side of design, especially usability testing. I've worked on consumer apps with millions of users. I'm drawn to Luminary because I want to work on a product that has real social impact. I believe good design can remove bias in hiring, which is something I care about deeply.`,
    recordingUrl: '/recordings/cand-003.mp4',
  },
  {
    id: 'cand-004',
    name: 'Aditya Rao',
    email: 'aditya.rao@email.com',
    jobId: 'job-003',
    jobTitle: 'AI / ML Engineer',
    submittedAt: '2026-09-17T11:00:00Z',
    status: 'processing',
    decision: 'pending',
    aiScore: 0,
    aiReasoning: '',
    transcript: '',
    recordingUrl: '/recordings/cand-004.mp4',
  },
  {
    id: 'cand-005',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@email.com',
    jobId: 'job-001',
    jobTitle: 'Senior Frontend Engineer',
    submittedAt: '2026-09-18T07:20:00Z',
    status: 'received',
    decision: 'pending',
    aiScore: 0,
    aiReasoning: '',
    transcript: '',
    recordingUrl: '/recordings/cand-005.mp4',
  },
];

// ── Helper functions ──
export function getJobById(id: string): Job | undefined {
  return MOCK_JOBS.find(j => j.id === id);
}

export function getCandidateById(id: string): Candidate | undefined {
  return MOCK_CANDIDATES.find(c => c.id === id);
}

export function getCandidatesForJob(jobId: string): Candidate[] {
  return MOCK_CANDIDATES.filter(c => c.jobId === jobId);
}

export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
