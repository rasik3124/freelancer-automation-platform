import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import session from "express-session";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import fs from "fs";
import { initializeSocket } from "./src/lib/socket";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createHttpServer(app);
const PORT = process.env.PORT || 3000;

// ─── Environment Validation ──────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!JWT_SECRET || !SESSION_SECRET) {
  console.error("❌ CRITICAL ERROR: JWT_SECRET or SESSION_SECRET not set in environment.");
  process.exit(1);
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  role: "freelancer" | "client" | null;
  onboardingComplete: boolean;
  createdAt: string;
}

interface Lead {
  id: string;
  userId: string;
  description: string;
  score: number;
  status: string;
  createdAt: string;
}

interface Proposal {
  id: string;
  userId: string;
  clientName?: string;
  content: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

interface Meeting {
  id: string;
  userId: string;
  createdAt: string;
  [key: string]: unknown;
}

interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new_lead" | "contacted" | "proposal_in" | "negotiation" | "in_progress" | "completed" | "cancelled";
  features: string[];
  technologies: string[];
  deliverables: string[];
  problemStatement: string;
  targetAudience: string;
  references: string[];
  assignedFreelancers: string[];
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Persistent User Store ────────────────────────────────────────────────────
// Users are persisted to .data/users.json so they survive server restarts.
const DATA_DIR = path.join(__dirname, ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function loadUsers(): Map<string, User> {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) return new Map();
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const arr: User[] = JSON.parse(raw);
    return new Map(arr.map((u) => [u.id, u]));
  } catch {
    return new Map();
  }
}

function saveUsers() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify([...db.users.values()], null, 2));
  } catch (e) {
    console.error("Failed to persist users:", e);
  }
}

// ─── In-Memory Database ───────────────────────────────────────────────────────
const db = {
  users: loadUsers(),
  leads: new Map<string, Lead>(),
  proposals: new Map<string, Proposal>(),
  meetings: new Map<string, Meeting>(),
  projects: new Map<string, Project>(),
};

// ─── Seed Demo Users ──────────────────────────────────────────────────────────
// Adds demo users only if they don't already exist (idempotent).
async function seedDemoUsers() {
  type SeedUser = { id: string; email: string; plainPassword: string; fullName: string; role: "client" | "freelancer"; onboardingComplete: boolean; };
  const seeds: SeedUser[] = [
    { id: "demo-client-001",     email: "client@demo.com",     plainPassword: "demo1234", fullName: "Alex Demo (Client)",    role: "client",     onboardingComplete: true },
    { id: "demo-freelancer-001", email: "freelancer@demo.com", plainPassword: "demo1234", fullName: "Sam Demo (Freelancer)", role: "freelancer", onboardingComplete: true },
  ];
  let added = false;
  for (const s of seeds) {
    if (!db.users.has(s.id)) {
      db.users.set(s.id, {
        id: s.id, email: s.email, fullName: s.fullName,
        role: s.role, onboardingComplete: s.onboardingComplete,
        password: await bcrypt.hash(s.plainPassword, 10),
        createdAt: new Date().toISOString(),
      });
      added = true;
    }
  }
  if (added) saveUsers();
  console.log("✅ Demo users ready  →  client@demo.com / freelancer@demo.com  (password: demo1234)");
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(cookieParser());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    },
  })
);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
};

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, please try again later." },
});

// Helper: serialize user for response
const serializeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  onboardingComplete: user.onboardingComplete,
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post("/auth/signup", authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existingUser = [...db.users.values()].find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const user: User = {
      id: userId,
      email,
      password: hashedPassword,
      fullName: name,
      role: null,
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
    };

    db.users.set(userId, user);
    saveUsers();

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      data: {
        accessToken: token,
        user: serializeUser(user),
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = [...db.users.values()].find((u) => u.email === email);
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      data: {
        accessToken: token,
        user: serializeUser(user),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Get Current User (session restore) ──────────────────────────────────────
app.get("/auth/me", authenticateToken, async (req: any, res) => {
  try {
    const user = db.users.get(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ data: { user: serializeUser(user) } });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Profile / Role / Onboarding Update ──────────────────────────────────────
app.put("/auth/profile", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.user;
    const updates = req.body;

    const user = db.users.get(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const updatedUser: User = { ...user, ...updates };
    db.users.set(id, updatedUser);
    saveUsers();

    res.json({
      data: {
        user: serializeUser(updatedUser),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
app.put("/auth/password", authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const user = db.users.get(req.user.id);
    if (!user || !user.password) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.users.set(req.user.id, { ...user, password: hashed });
    saveUsers();

    res.json({ data: { message: "Password updated successfully" } });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Lead Routes ──────────────────────────────────────────────────────────────
app.post("/leads/analyze", authenticateToken, async (req: any, res) => {
  try {
    const { description } = req.body;
    const lead: Lead = {
      id: randomUUID(),
      userId: req.user.id,
      description,
      score: Math.floor(Math.random() * 100),
      status: "analyzed",
      createdAt: new Date().toISOString(),
    };
    db.leads.set(lead.id, lead);
    res.json({ data: lead });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Proposal Routes ──────────────────────────────────────────────────────────
app.get("/proposals", authenticateToken, async (req: any, res) => {
  const proposals = [...db.proposals.values()].filter((p) => p.userId === req.user.id);
  res.json({ data: proposals });
});

app.post("/proposals/generate", authenticateToken, async (req: any, res) => {
  try {
    const proposalData = req.body;
    const proposal: Proposal = {
      id: randomUUID(),
      userId: req.user.id,
      ...proposalData,
      content: `Generated proposal for ${proposalData.clientName || "Client"}...`,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    db.proposals.set(proposal.id, proposal);
    res.json({ data: proposal });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Meeting Routes ───────────────────────────────────────────────────────────
app.get("/meetings", authenticateToken, async (req: any, res) => {
  const meetings = [...db.meetings.values()].filter((m) => m.userId === req.user.id);
  res.json({ data: meetings });
});



// ─── Freelancer Catalogue (seeded in-memory) ──────────────────────────────────

interface FreelancerProfile {
  id: string; name: string; role: string; bio: string;
  skills: string[]; experience: "beginner"|"intermediate"|"experienced"|"expert";
  yearsExp: number; hourlyRate: number; rating: number; reviews: number;
  projectsDone: number; availability: "full-time"|"part-time"|"small-projects";
  location: string; matchScore: number; avatarInitials: string;
  portfolio: string; github?: string; linkedin?: string; dribbble?: string;
  recentReviews: { author: string; rating: number; comment: string; date: string }[];
  createdAt: string;
}

const FREELANCER_SEEDS: FreelancerProfile[] = [
  { id:"fl-1", name:"Alex Martinez", role:"Senior Fullstack Developer", bio:"Fullstack dev with 8+ years building production-grade React/Node apps. Love solving hard problems.",
    skills:["React","Node.js","TypeScript","PostgreSQL","Docker","GraphQL"], experience:"expert", yearsExp:8, hourlyRate:85,
    rating:4.9, reviews:47, projectsDone:63, availability:"full-time", location:"Austin, TX", matchScore:95,
    avatarInitials:"AM", portfolio:"https://alexm.dev", github:"github.com/alexm", linkedin:"linkedin.com/in/alexm",
    recentReviews:[{author:"Sarah W.",rating:5,comment:"Alex delivered outstanding work, ahead of schedule.",date:"2026-02-10"},{author:"Mike T.",rating:5,comment:"Excellent communicator. Code quality is top notch.",date:"2026-01-20"}], createdAt:"2024-01-10T00:00:00Z"},
  { id:"fl-2", name:"Sarah Chen", role:"UI/UX Designer", bio:"Product designer crafting intuitive, beautiful interfaces. Ex-Google. Figma & Framer expert.",
    skills:["Figma","Framer","Tailwind CSS","Design Systems","Prototyping","User Research"], experience:"expert", yearsExp:7, hourlyRate:70,
    rating:4.8, reviews:32, projectsDone:41, availability:"full-time", location:"Toronto, CA", matchScore:88,
    avatarInitials:"SC", portfolio:"https://sarahchen.design", dribbble:"dribbble.com/sarahchen", linkedin:"linkedin.com/in/sarahchen",
    recentReviews:[{author:"Emma L.",rating:5,comment:"Sarah's designs are absolutely stunning. 10/10.",date:"2026-02-14"},{author:"Jake P.",rating:4,comment:"Great work, minor delays but quality was excellent.",date:"2026-01-30"}], createdAt:"2024-02-15T00:00:00Z"},
  { id:"fl-3", name:"James Okafor", role:"Mobile Developer", bio:"React Native & Swift specialist. 6 years shipping iOS/Android apps with 4.8+ App Store ratings.",
    skills:["React Native","Swift","Kotlin","Firebase","Redux","Expo"], experience:"experienced", yearsExp:6, hourlyRate:75,
    rating:4.7, reviews:28, projectsDone:34, availability:"part-time", location:"London, UK", matchScore:82,
    avatarInitials:"JO", portfolio:"https://jamesokafor.dev", github:"github.com/jamesokafor",
    recentReviews:[{author:"Lisa M.",rating:5,comment:"Fantastic mobile dev. Both apps scored 4.9 on App Store.",date:"2026-01-15"}], createdAt:"2024-03-01T00:00:00Z"},
  { id:"fl-4", name:"Priya Nair", role:"Backend Developer", bio:"API architect specialising in high-scale distributed systems. Python, Go, AWS.",
    skills:["Python","Go","AWS","PostgreSQL","Redis","Kafka"], experience:"expert", yearsExp:9, hourlyRate:90,
    rating:4.9, reviews:51, projectsDone:72, availability:"full-time", location:"Bangalore, IN", matchScore:79,
    avatarInitials:"PN", portfolio:"https://priyanair.io", github:"github.com/priyanair",
    recentReviews:[{author:"Raj S.",rating:5,comment:"Priya built our entire data pipeline. Flawless.",date:"2026-02-20"}], createdAt:"2024-01-20T00:00:00Z"},
  { id:"fl-5", name:"Marcus Lin", role:"DevOps / Cloud Engineer", bio:"CI/CD, K8s, Terraform wizard. Reduced deployment time by 70% on last 3 projects.",
    skills:["Kubernetes","Terraform","GitHub Actions","AWS","Docker","Prometheus"], experience:"experienced", yearsExp:5, hourlyRate:80,
    rating:4.6, reviews:19, projectsDone:22, availability:"small-projects", location:"Singapore", matchScore:74,
    avatarInitials:"ML", portfolio:"https://marcuslin.tech", github:"github.com/marcuslin",
    recentReviews:[{author:"Dan H.",rating:5,comment:"Marcus automated our entire infra. Brilliant!",date:"2026-02-05"}], createdAt:"2024-04-10T00:00:00Z"},
  { id:"fl-6", name:"Elena Volkov", role:"Frontend Developer", bio:"React + Vue specialist. Performance optimization nerd. 4 yrs building fast SPAs.",
    skills:["React","Vue.js","JavaScript","CSS","Webpack","Storybook"], experience:"intermediate", yearsExp:4, hourlyRate:55,
    rating:4.5, reviews:22, projectsDone:27, availability:"full-time", location:"Berlin, DE", matchScore:71,
    avatarInitials:"EV", portfolio:"https://elenavolkov.dev", github:"github.com/elenavolkov",
    recentReviews:[{author:"Chris P.",rating:5,comment:"Fast, clean code. Highly recommend!",date:"2026-01-25"}], createdAt:"2024-05-01T00:00:00Z"},
  { id:"fl-7", name:"David Park", role:"Graphic Designer", bio:"Brand identity & motion design. 5 years helping startups stand out.",
    skills:["Adobe Illustrator","After Effects","Photoshop","Blender","Brand Design"], experience:"experienced", yearsExp:5, hourlyRate:60,
    rating:4.7, reviews:35, projectsDone:48, availability:"part-time", location:"Seoul, KR", matchScore:68,
    avatarInitials:"DP", portfolio:"https://davidpark.design", dribbble:"dribbble.com/davidpark",
    recentReviews:[{author:"Anna K.",rating:5,comment:"David's brand work took our startup to the next level.",date:"2026-02-12"}], createdAt:"2024-03-15T00:00:00Z"},
  { id:"fl-8", name:"Fatima Al-Rashid", role:"Data Scientist", bio:"ML engineer with focus on NLP & computer vision. Published researcher.",
    skills:["Python","TensorFlow","PyTorch","Scikit-learn","SQL","Jupyter"], experience:"expert", yearsExp:7, hourlyRate:95,
    rating:4.8, reviews:16, projectsDone:18, availability:"small-projects", location:"Dubai, UAE", matchScore:65,
    avatarInitials:"FA", portfolio:"https://fatima.ai", github:"github.com/fatimarashid",
    recentReviews:[{author:"Tom B.",rating:5,comment:"Fatima's model beat our baseline by 18%. Incredible.",date:"2026-01-10"}], createdAt:"2024-06-01T00:00:00Z"},
  { id:"fl-9", name:"Bruno Costa", role:"Frontend Developer", bio:"3 yrs React. Fast learner, great communicator. Looking for medium-term projects.",
    skills:["React","TypeScript","SASS","Jest","Storybook"], experience:"intermediate", yearsExp:3, hourlyRate:40,
    rating:4.3, reviews:11, projectsDone:14, availability:"full-time", location:"Lisbon, PT", matchScore:60,
    avatarInitials:"BC", portfolio:"https://brunocosta.dev", github:"github.com/brunocosta",
    recentReviews:[{author:"Sophie L.",rating:4,comment:"Bruno delivered on time. Good code quality.",date:"2026-01-05"}], createdAt:"2024-07-01T00:00:00Z"},
  { id:"fl-10", name:"Yuki Tanaka", role:"Mobile Developer", bio:"Flutter & Dart expert. 4 yrs cross-platform. Available for urgent small projects.",
    skills:["Flutter","Dart","Firebase","BLoC","Provider"], experience:"experienced", yearsExp:4, hourlyRate:65,
    rating:4.6, reviews:20, projectsDone:25, availability:"small-projects", location:"Tokyo, JP", matchScore:57,
    avatarInitials:"YT", portfolio:"https://yukitanaka.dev", github:"github.com/yukitanaka",
    recentReviews:[{author:"Ben W.",rating:5,comment:"Yuki shipped our Flutter app in record time.",date:"2025-12-20"}], createdAt:"2024-08-01T00:00:00Z"},
  { id:"fl-11", name:"Chloe Smith", role:"UI/UX Designer", bio:"2 yrs UX research + wireframing. Strong portfolio in e-commerce & fintech.",
    skills:["Figma","Sketch","UserTesting","Wireframing","Prototyping"], experience:"beginner", yearsExp:2, hourlyRate:35,
    rating:4.2, reviews:8, projectsDone:10, availability:"part-time", location:"Chicago, IL", matchScore:50,
    avatarInitials:"CS", portfolio:"https://chloesmith.design", dribbble:"dribbble.com/chloesmith",
    recentReviews:[{author:"Mark H.",rating:4,comment:"Great UX thinking for someone just starting out.",date:"2025-12-10"}], createdAt:"2024-09-01T00:00:00Z"},
  { id:"fl-12", name:"Omar Hassan", role:"Web Developer", bio:"WordPress & Shopify specialist. 150+ stores launched.",
    skills:["JavaScript","PHP","Shopify","WordPress","WooCommerce","SEO"], experience:"experienced", yearsExp:6, hourlyRate:50,
    rating:4.5, reviews:60, projectsDone:150, availability:"full-time", location:"Cairo, EG", matchScore:45,
    avatarInitials:"OH", portfolio:"https://omarhassan.dev", github:"github.com/omarhassan",
    recentReviews:[{author:"Lena D.",rating:5,comment:"Omar built our Shopify store fast and flawlessly.",date:"2025-11-30"}], createdAt:"2024-10-01T00:00:00Z"},
];

const freelancerDb = new Map<string, FreelancerProfile>(FREELANCER_SEEDS.map((f)=>[f.id, f]));

// ─── Freelancer Routes ────────────────────────────────────────────────────────

/** GET /api/freelancers — filterable, sortable list */
app.get("/api/freelancers", authenticateToken, (req: any, res) => {
  const { role, experience, skills, minRate, maxRate, availability, minRating, sort, q } = req.query;
  let list = [...freelancerDb.values()];

  if (role) list = list.filter(f => f.role.toLowerCase().includes((role as string).toLowerCase()));
  if (experience && experience !== "all") list = list.filter(f => f.experience === experience);
  if (availability && availability !== "all") list = list.filter(f => f.availability === availability);
  if (minRate) list = list.filter(f => f.hourlyRate >= Number(minRate));
  if (maxRate) list = list.filter(f => f.hourlyRate <= Number(maxRate));
  if (minRating) list = list.filter(f => f.rating >= Number(minRating));
  if (q) { const s = (q as string).toLowerCase(); list = list.filter(f => f.name.toLowerCase().includes(s) || f.role.toLowerCase().includes(s) || f.skills.some(sk => sk.toLowerCase().includes(s))); }
  if (skills) { const sk = (skills as string).split(",").map(x=>x.trim().toLowerCase()); list = list.filter(f => sk.every(s => f.skills.some(fs=>fs.toLowerCase().includes(s)))); }

  switch (sort) {
    case "rating":   list.sort((a,b)=>b.rating-a.rating); break;
    case "rate-asc": list.sort((a,b)=>a.hourlyRate-b.hourlyRate); break;
    case "recent":   list.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()); break;
    default:         list.sort((a,b)=>b.matchScore-a.matchScore);
  }
  res.json({ data: list, total: list.length });
});

/** GET /api/freelancers/:id — full profile */
app.get("/api/freelancers/:id", authenticateToken, (req: any, res) => {
  const f = freelancerDb.get(req.params.id);
  if (!f) return res.status(404).json({ error: "Freelancer not found" });
  res.json({ data: f });
});

/** POST /api/inquiries — send an inquiry to a freelancer */
app.post("/api/inquiries", authenticateToken, (req: any, res) => {
  const { freelancerId, projectId, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message is required." });
  if (!freelancerId) return res.status(400).json({ error: "Freelancer ID is required." });
  res.status(201).json({ data: { id: randomUUID(), clientId: req.user.id, freelancerId, projectId: projectId||null, message: message.trim(), sentAt: new Date().toISOString() } });
});

// ─── Project Routes ───────────────────────────────────────────────────────────



// ─── Proposals (seeded in-memory) ─────────────────────────────────────────────

interface ClientProposal {
  id: string; clientId: string; freelancerId: string;
  freelancerName: string; freelancerRole: string; freelancerAvatarInitials: string;
  projectId: string; projectName: string; proposalText: string;
  priceMin: number; priceMax: number; timeline: string;
  status: "pending" | "accepted" | "rejected" | "revision_requested";
  comments: { author: string; text: string; createdAt: string }[];
  revisionNote?: string;
  createdAt: string; updatedAt: string;
}

const PROPOSAL_SEEDS: ClientProposal[] = [
  {
    id:"pr-1", clientId:"__seed__", freelancerId:"fl-1", freelancerName:"Alex Martinez",
    freelancerRole:"Senior Fullstack Developer", freelancerAvatarInitials:"AM",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    proposalText:"Hi! I've reviewed your project brief carefully. I have 8+ years building production-grade e-commerce platforms with React and Node.js. My approach:\n\n**Discovery (Week 1):** Full audit of your current system, user research, and wireframing.\n\n**Design (Week 2):** Figma prototypes for all key flows — cart, checkout, product pages — iterating with your feedback.\n\n**Development (Weeks 3-5):** Pixel-perfect implementation, API integration, performance optimisation (Lighthouse 95+).\n\n**QA & Launch (Week 6):** Cross-browser testing, load testing, staged deployment.\n\nI'm confident we can boost your conversion rate significantly. Happy to jump on a call this week!",
    priceMin:4800, priceMax:5500, timeline:"6 weeks",
    status:"pending", comments:[], createdAt:"2026-03-25T08:00:00Z", updatedAt:"2026-03-25T08:00:00Z",
  },
  {
    id:"pr-2", clientId:"__seed__", freelancerId:"fl-2", freelancerName:"Sarah Chen",
    freelancerRole:"UI/UX Designer", freelancerAvatarInitials:"SC",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    proposalText:"Hello! I'm a product designer with 7 years of experience, ex-Google. I specialise in conversion-optimised e-commerce UX.\n\n**What I'll deliver:**\n- Complete UX audit of your current store\n- User journey mapping & heatmap analysis\n- Figma designs: 30+ screens including mobile-first responsive layouts\n- Interactive prototype for stakeholder sign-off\n- Design system (components, typography, colours) for your dev team\n\nI've helped 3 similar brands increase checkout conversion by 18-32%. Would love to show you the case studies on a discovery call.",
    priceMin:3200, priceMax:3800, timeline:"4 weeks",
    status:"pending", comments:[], createdAt:"2026-03-24T14:00:00Z", updatedAt:"2026-03-24T14:00:00Z",
  },
  {
    id:"pr-3", clientId:"__seed__", freelancerId:"fl-3", freelancerName:"James Okafor",
    freelancerRole:"Mobile Developer", freelancerAvatarInitials:"JO",
    projectId:"proj-seed-2", projectName:"Mobile App Development",
    proposalText:"Hi! React Native specialist here with 6 years experience shipping iOS & Android apps with consistent 4.8+ App Store ratings.\n\n**Tech stack:** React Native + Expo, Redux Toolkit, Firebase, native modules where needed.\n\n**Timeline breakdown:**\n- Week 1-2: Architecture, design handoff review, core navigation\n- Week 3-5: All screens implemented, API integrations\n- Week 6: QA, TestFlight/Play Store internal testing\n- Week 7: App Store submission support\n\nI can start immediately. Let me know if you'd like to see my previous apps.",
    priceMin:5500, priceMax:6200, timeline:"7 weeks",
    status:"revision_requested", revisionNote:"Can you clarify if offline mode is required, and whether we need push notifications from day one?",
    comments:[{author:"You",text:"Please clarify the offline sync requirements in your revised proposal.",createdAt:"2026-03-25T10:00:00Z"}],
    createdAt:"2026-03-22T09:00:00Z", updatedAt:"2026-03-25T10:00:00Z",
  },
  {
    id:"pr-4", clientId:"__seed__", freelancerId:"fl-4", freelancerName:"Priya Nair",
    freelancerRole:"Backend Developer", freelancerAvatarInitials:"PN",
    projectId:"proj-seed-2", projectName:"Mobile App Development",
    proposalText:"Hello! I'm Priya, a backend architect. While I see this is a mobile project, I'd like to propose building the complete backend API that the app will rely on — REST + GraphQL, JWT auth, Postgres, Redis caching, and a CI/CD pipeline on AWS.\n\nThis would be complementary to your mobile developer. I can integrate tightly with whatever React Native dev you select.",
    priceMin:2800, priceMax:3500, timeline:"5 weeks",
    status:"rejected", comments:[], createdAt:"2026-03-21T16:00:00Z", updatedAt:"2026-03-23T11:00:00Z",
  },
  {
    id:"pr-5", clientId:"__seed__", freelancerId:"fl-6", freelancerName:"Elena Volkov",
    freelancerRole:"Frontend Developer", freelancerAvatarInitials:"EV",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    proposalText:"Hi there! I'm Elena, a React + Vue specialist based in Berlin. I've built 27+ SPAs over 4 years, many of them e-commerce focused.\n\nI'll deliver a fast, accessible, SEO-optimised frontend built on your preferred stack. I'm particularly strong in performance — all my builds score 95+ on Lighthouse. Timeline: 4 weeks including testing.",
    priceMin:2500, priceMax:3000, timeline:"4 weeks",
    status:"accepted", comments:[{author:"You",text:"Great portfolio! Looking forward to working together.",createdAt:"2026-03-24T12:00:00Z"}],
    createdAt:"2026-03-23T11:00:00Z", updatedAt:"2026-03-24T12:00:00Z",
  },
  {
    id:"pr-6", clientId:"__seed__", freelancerId:"fl-7", freelancerName:"David Park",
    freelancerRole:"Graphic Designer", freelancerAvatarInitials:"DP",
    projectId:"proj-seed-3", projectName:"Brand Identity Package",
    proposalText:"Hello! Brand identity is my speciality. Over 5 years I've helped 48 startups define their visual voice. For your project I'll deliver:\n\n- Logo (3 concepts + unlimited revisions on chosen direction)\n- Full colour palette with accessibility ratios\n- Typography system\n- Brand guidelines PDF (50+ pages)\n- Social media asset kit\n- Business card + letterhead templates\n\nAll files delivered in AI, EPS, SVG, and PNG formats.",
    priceMin:1800, priceMax:2200, timeline:"3 weeks",
    status:"pending", comments:[], createdAt:"2026-03-26T07:00:00Z", updatedAt:"2026-03-26T07:00:00Z",
  },
];

// Build per-user proposal store (seed maps to requesting user at runtime)
const proposalDb = new Map<string, ClientProposal>(PROPOSAL_SEEDS.map((p)=>[p.id,{...p}]));

// ─── Proposal Routes ──────────────────────────────────────────────────────────

/** GET /api/proposals — proposals for the authenticated client */
app.get("/api/proposals", authenticateToken, (req: any, res) => {
  const uid = req.user.id;
  const { status, projectId } = req.query;
  // Return seeds + any user-created ones (seeds use __seed__ as clientId for demo)
  let list = [...proposalDb.values()].filter(p => p.clientId === uid || p.clientId === "__seed__");
  if (status && status !== "all") list = list.filter(p => p.status === status);
  if (projectId) list = list.filter(p => p.projectId === projectId);
  list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ data: list, total: list.length });
});

/** GET /api/proposals/:id */
app.get("/api/proposals/:id", authenticateToken, (req: any, res) => {
  const p = proposalDb.get(req.params.id);
  if (!p) return res.status(404).json({ error: "Proposal not found" });
  res.json({ data: p });
});

/** PUT /api/proposals/:id — update status + optional revisionNote */
app.put("/api/proposals/:id", authenticateToken, (req: any, res) => {
  const p = proposalDb.get(req.params.id);
  if (!p) return res.status(404).json({ error: "Proposal not found" });
  const updated: ClientProposal = { ...p, ...req.body, id: p.id, updatedAt: new Date().toISOString() };
  proposalDb.set(p.id, updated);
  res.json({ data: updated });
});

/** POST /api/proposals/:id/comments — add a client note */
app.post("/api/proposals/:id/comments", authenticateToken, (req: any, res) => {
  const p = proposalDb.get(req.params.id);
  if (!p) return res.status(404).json({ error: "Proposal not found" });
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Comment text required" });
  const comment = { author: "You", text: text.trim(), createdAt: new Date().toISOString() };
  const updated = { ...p, comments: [...p.comments, comment], updatedAt: new Date().toISOString() };
  proposalDb.set(p.id, updated);
  res.json({ data: updated });
});


// ─── Meetings (seeded in-memory) ──────────────────────────────────────────────

interface MeetingRecord {
  id: string; clientId: string;
  freelancerId: string; freelancerName: string; freelancerAvatarInitials: string;
  projectId: string; projectName: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM" 24h
  duration: number; // minutes
  meetingLink: string;
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

const MEETING_SEEDS: MeetingRecord[] = [
  { id:"mt-1", clientId:"__seed__", freelancerId:"fl-1", freelancerName:"Alex Martinez", freelancerAvatarInitials:"AM",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    date:"2026-03-29", time:"15:00", duration:60, meetingLink:"https://meet.google.com/abc-defg-hij",
    notes:"Discuss architecture, timeline, and Figma handoff process.", status:"scheduled", createdAt:"2026-03-25T08:00:00Z" },
  { id:"mt-2", clientId:"__seed__", freelancerId:"fl-2", freelancerName:"Sarah Chen", freelancerAvatarInitials:"SC",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    date:"2026-04-02", time:"10:30", duration:30, meetingLink:"https://zoom.us/j/123456789",
    notes:"UX review session — bring the latest Figma mockups.", status:"scheduled", createdAt:"2026-03-24T14:00:00Z" },
  { id:"mt-3", clientId:"__seed__", freelancerId:"fl-3", freelancerName:"James Okafor", freelancerAvatarInitials:"JO",
    projectId:"proj-seed-2", projectName:"Mobile App Development",
    date:"2026-04-07", time:"14:00", duration:60, meetingLink:"https://meet.google.com/xyz-abcd-ijk",
    notes:"Q&A on offline sync requirements. Have the technical specs ready.", status:"scheduled", createdAt:"2026-03-22T09:00:00Z" },
  { id:"mt-4", clientId:"__seed__", freelancerId:"fl-6", freelancerName:"Elena Volkov", freelancerAvatarInitials:"EV",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    date:"2026-03-20", time:"16:00", duration:30, meetingLink:"https://zoom.us/j/987654321",
    notes:"Kickoff call — reviewed project scope and agreed on milestones.", status:"completed", createdAt:"2026-03-18T10:00:00Z" },
  { id:"mt-5", clientId:"__seed__", freelancerId:"fl-7", freelancerName:"David Park", freelancerAvatarInitials:"DP",
    projectId:"proj-seed-3", projectName:"Brand Identity Package",
    date:"2026-03-22", time:"11:00", duration:45, meetingLink:"https://meet.google.com/lmn-opqr-stu",
    notes:"Brand discovery session — discussed tone, audience, and competitors.", status:"completed", createdAt:"2026-03-21T08:00:00Z" },
  { id:"mt-6", clientId:"__seed__", freelancerId:"fl-4", freelancerName:"Priya Nair", freelancerAvatarInitials:"PN",
    projectId:"proj-seed-2", projectName:"Mobile App Development",
    date:"2026-03-18", time:"09:00", duration:30, meetingLink:"https://zoom.us/j/555444333",
    notes:"Initial scoping call.", status:"cancelled", createdAt:"2026-03-17T16:00:00Z" },
];

const meetingDb = new Map<string, MeetingRecord>(MEETING_SEEDS.map((m)=>[m.id,{...m}]));

// ─── Meeting Routes ───────────────────────────────────────────────────────────

/** GET /api/meetings — meetings for the authenticated client */
app.get("/api/meetings", authenticateToken, (req: any, res) => {
  const { filter } = req.query; // "upcoming" | "past" | "all"
  const now = new Date().toISOString().split("T")[0];
  let list = [...meetingDb.values()].filter(m => m.clientId === req.user.id || m.clientId === "__seed__");
  if (filter === "upcoming") list = list.filter(m => m.date >= now && m.status === "scheduled");
  else if (filter === "past") list = list.filter(m => m.date < now || m.status !== "scheduled");
  list.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  res.json({ data: list, total: list.length });
});

/** POST /api/meetings/schedule — create a new meeting */
app.post("/api/meetings/schedule", authenticateToken, (req: any, res) => {
  const { freelancerId, freelancerName, freelancerAvatarInitials="", projectId, projectName="",
          date, time, duration=30, meetingLink="", notes="" } = req.body;
  if (!freelancerId || !date || !time) return res.status(400).json({ error: "freelancerId, date, and time are required." });
  const today = new Date().toISOString().split("T")[0];
  if (date < today) return res.status(400).json({ error: "Meeting date must be in the future." });
  const hour = parseInt(time.split(":")[0]);
  if (hour < 8 || hour >= 20) return res.status(400).json({ error: "Meeting time must be between 8 AM and 8 PM." });
  const meeting: MeetingRecord = {
    id: randomUUID(), clientId: req.user.id, freelancerId,
    freelancerName: freelancerName || "Unknown", freelancerAvatarInitials,
    projectId: projectId || "", projectName: projectName || "",
    date, time, duration: Number(duration),
    meetingLink: meetingLink || `https://meet.google.com/${randomUUID().substring(0,3)}-${randomUUID().substring(0,4)}-${randomUUID().substring(0,3)}`,
    notes, status: "scheduled", createdAt: new Date().toISOString(),
  };
  meetingDb.set(meeting.id, meeting);
  // Production: trigger n8n webhook for Google Calendar + email
  res.status(201).json({ data: meeting });
});

/** PATCH /api/meetings/:id — update status or reschedule */
app.patch("/api/meetings/:id", authenticateToken, (req: any, res) => {
  const m = meetingDb.get(req.params.id);
  if (!m) return res.status(404).json({ error: "Meeting not found" });
  const updated = { ...m, ...req.body, id: m.id };
  meetingDb.set(m.id, updated);
  res.json({ data: updated });
});

/** GET /api/projects — list all projects for the authenticated client */
app.get("/api/projects", authenticateToken, (req: any, res) => {


  const projects = [...db.projects.values()].filter(
    (p) => p.clientId === req.user.id
  );
  // Sort by createdAt descending
  projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ data: projects });
});

/** POST /api/projects — create a new project */
app.post("/api/projects", authenticateToken, (req: any, res) => {
  try {
    const {
      title, description, type, budgetMin, budgetMax, deadline, priority,
      features = [], technologies = [], deliverables = [],
      problemStatement = "", targetAudience = "", references = [],
    } = req.body;

    if (!title || title.trim().length < 5)
      return res.status(400).json({ error: "Title must be at least 5 characters." });
    if (!budgetMin || !budgetMax || Number(budgetMin) >= Number(budgetMax))
      return res.status(400).json({ error: "Budget min must be less than max." });
    if (!deadline || new Date(deadline) <= new Date())
      return res.status(400).json({ error: "Deadline must be a future date." });
    if (features.length < 2)
      return res.status(400).json({ error: "Add at least 2 key features." });

    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      clientId: req.user.id,
      title: title.trim(),
      description: description || "",
      type: type || "Other",
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      deadline,
      priority: priority || "medium",
      status: "new_lead",
      features,
      technologies,
      deliverables,
      problemStatement,
      targetAudience,
      references,
      assignedFreelancers: [],
      proposalCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.set(project.id, project);
    res.status(201).json({ data: project });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/** GET /api/projects/:id — fetch single project by id */
app.get("/api/projects/:id", authenticateToken, (req: any, res) => {
  const project = db.projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  if (project.clientId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  res.json({ data: project });
});

/** PATCH /api/projects/:id — update project fields (status, priority, etc.) */
app.patch("/api/projects/:id", authenticateToken, (req: any, res) => {
  const project = db.projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  if (project.clientId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  const updated: Project = { ...project, ...req.body, id: project.id, clientId: project.clientId, updatedAt: new Date().toISOString() };
  db.projects.set(project.id, updated);
  res.json({ data: updated });
});

// ─── Dashboard Routes ─────────────────────────────────────────────────────────


/** GET /api/dashboard/stats — aggregated stats for the client overview */
app.get("/api/dashboard/stats", authenticateToken, (req: any, res) => {
  const uid = req.user.id;
  // In production these would be real DB aggregations; here we return
  // per-user seeded values so the same user always gets the same numbers.
  const seed = uid.charCodeAt(0) + uid.charCodeAt(1);
  res.json({
    data: {
      activeProjects: (seed % 5) + 1,
      proposalsReceived: (seed % 10) + 2,
      meetingsScheduled: (seed % 4) + 1,
      totalSpent: ((seed % 8) + 1) * 150000,

      proposalsDelta: "+1 from last month",
      projectsDelta: "+1 from last month",
      meetingsDelta: "Next: Tomorrow 2 PM",
      spentDelta: "Last 30 days",
    },
  });
});

/** POST /api/dashboard/ai-briefing — generate AI briefing for the logged-in client */
app.post("/api/dashboard/ai-briefing", authenticateToken, (req: any, res) => {
  const uid = req.user.id;
  const seed = uid.charCodeAt(0);
  const briefings = [
    "You have 3 active projects with a combined 12 proposals received. Top match Alex M. has a 95% compatibility score for your e-commerce project. Consider scheduling interviews this week to maintain momentum.",
    "Your mobile app project is progressing well with 4 shortlisted freelancers. Sarah K. (UI/UX, 91% match) has submitted a competitive proposal within budget. Recommend booking a discovery call today.",
    "Two of your projects haven't received proposals yet — consider updating their descriptions for better visibility. Meanwhile, Marcus L. (95% match) is available for immediate start on your web project.",
    "Strong pipeline this week: 7 new proposals across 2 projects. Top freelancer James O. has a 4.9 rating and 8+ years experience in React Native — exactly what your mobile project needs.",
  ];
  // Simulate slight delay to make the streaming UX feel authentic
  setTimeout(() => {
    res.json({ data: { briefing: briefings[seed % briefings.length] } });
  }, 600);
});

/** GET /api/dashboard/activity — 5 most recent events across collections */
app.get("/api/dashboard/activity", authenticateToken, (_req: any, res) => {
  // In production: query proposals, meetings, projects, invoices sorted by createdAt desc
  // For now: realistic static feed scoped to the signed-in user
  const now = Date.now();
  const h = (hours: number) => new Date(now - hours * 3600000).toISOString();
  res.json({
    data: [
      {
        id: "act-1",
        type: "proposal",
        title: "Proposal received from Alex Martinez",
        description: "Submitted $3,200 bid for the e-commerce redesign project.",
        createdAt: h(2),
        actionLabel: "View Proposal",
        actionPath: "/dashboard/client/proposals",
        isNew: true,
      },
      {
        id: "act-2",
        type: "meeting",
        title: "Meeting scheduled with Sarah Chen",
        description: "UX discovery call confirmed for Mar 29 at 3:00 PM.",
        createdAt: h(5),
        actionLabel: "Join Meeting",
        actionPath: "/dashboard/client/meetings",
        isNew: true,
      },
      {
        id: "act-3",
        type: "match",
        title: "New freelancer suggested",
        description: "Marcus L. (94% match) available for your web project.",
        createdAt: h(26),
        actionLabel: "View Profile",
        actionPath: "/dashboard/client/freelancers",
        isNew: false,
      },
      {
        id: "act-4",
        type: "project",
        title: "Project status changed",
        description: "Mobile App Redesign moved to 'In Progress'.",
        createdAt: h(30),
        actionLabel: "View Project",
        actionPath: "/dashboard/client/projects",
        isNew: false,
      },
      {
        id: "act-5",
        type: "invoice",
        title: "Invoice received",
        description: "Invoice #1042 for $1,800 — Web Audit completed.",
        createdAt: h(72),
        actionLabel: "View Invoice",
        actionPath: "/dashboard/client/invoices",
        isNew: false,
      },
    ],
  });
});

/** GET /api/dashboard/ai-recommendations — top freelancer matches for the client */
app.get("/api/dashboard/ai-recommendations", authenticateToken, (_req: any, res) => {
  res.json({
    data: [
      {
        id: "rec-1",
        name: "Alex Martinez",
        title: "Senior Fullstack Developer",
        skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
        matchScore: 95,
        rating: 4.9,
        reviews: 47,
        hourlyRate: 85,
        availability: "Immediate",
        avatarInitials: "AM",
      },
      {
        id: "rec-2",
        name: "Sarah Chen",
        title: "UI/UX Designer",
        skills: ["Figma", "Tailwind CSS", "Framer", "Design Systems"],
        matchScore: 88,
        rating: 4.8,
        reviews: 32,
        hourlyRate: 70,
        availability: "In 1 week",
        avatarInitials: "SC",
      },
      {
        id: "rec-3",
        name: "James Okafor",
        title: "Mobile Developer",
        skills: ["React Native", "Swift", "Kotlin", "Firebase"],
        matchScore: 82,
        rating: 4.7,
        reviews: 28,
        hourlyRate: 75,
        availability: "In 2 weeks",
        avatarInitials: "JO",
      },
    ],
  });
});


// ─── Messaging System ─────────────────────────────────────────────────────────

interface Conversation {
  id: string; clientId: string;
  freelancerId: string; freelancerName: string; freelancerAvatarInitials: string;
  lastMessage: string; lastMessageAt: string; unreadCount: number; topic: string;
  createdAt: string;
}

interface Message {
  id: string; conversationId: string;
  senderId: string; // "client" or freelancerId (simplification)
  senderType: "client" | "freelancer";
  senderName: string; senderAvatarInitials: string;
  text: string; createdAt: string; read: boolean;
}

const conversationDb = new Map<string, Conversation>();
const messageDb      = new Map<string, Message[]>(); // conversationId → messages

// Seed conversations
const CONV_SEEDS: Conversation[] = [
  { id:"conv-1", clientId:"__seed__", freelancerId:"fl-1", freelancerName:"Alex Martinez", freelancerAvatarInitials:"AM",
    lastMessage:"Sounds great, I'll send the initial wireframes by Thursday!", lastMessageAt:"2026-03-27T04:10:00Z",
    unreadCount:2, topic:"E-commerce Project Architecture", createdAt:"2026-03-25T08:00:00Z" },
  { id:"conv-2", clientId:"__seed__", freelancerId:"fl-2", freelancerName:"Sarah Chen", freelancerAvatarInitials:"SC",
    lastMessage:"Sure, I can adjust the colour palette. Do you have brand guidelines?", lastMessageAt:"2026-03-26T18:30:00Z",
    unreadCount:1, topic:"Design System Discussion", createdAt:"2026-03-24T14:00:00Z" },
  { id:"conv-3", clientId:"__seed__", freelancerId:"fl-3", freelancerName:"James Okafor", freelancerAvatarInitials:"JO",
    lastMessage:"The offline sync module will add about a week to the timeline.", lastMessageAt:"2026-03-25T11:00:00Z",
    unreadCount:0, topic:"Mobile App Offline Mode", createdAt:"2026-03-22T09:00:00Z" },
];

const MSG_SEEDS: Record<string, Message[]> = {
  "conv-1": [
    { id:"m-1-1", conversationId:"conv-1", senderId:"client", senderType:"client", senderName:"You", senderAvatarInitials:"ME",
      text:"Hi Alex! I reviewed your proposal and I'm really impressed. Can we hop on a quick call to discuss the architecture?", createdAt:"2026-03-25T08:10:00Z", read:true },
    { id:"m-1-2", conversationId:"conv-1", senderId:"fl-1", senderType:"freelancer", senderName:"Alex Martinez", senderAvatarInitials:"AM",
      text:"Hi! Absolutely, I'd love to. I was thinking we could use a microservices approach with a Next.js frontend and Node.js API gateway. What time works for you?", createdAt:"2026-03-25T08:45:00Z", read:true },
    { id:"m-1-3", conversationId:"conv-1", senderId:"client", senderType:"client", senderName:"You", senderAvatarInitials:"ME",
      text:"How about Thursday at 3 PM? I'll send a Google Meet link.", createdAt:"2026-03-25T09:00:00Z", read:true },
    { id:"m-1-4", conversationId:"conv-1", senderId:"fl-1", senderType:"freelancer", senderName:"Alex Martinez", senderAvatarInitials:"AM",
      text:"Thursday 3 PM works perfectly. Looking forward to it! In the meantime, I'll prepare a rough architecture diagram.", createdAt:"2026-03-25T09:15:00Z", read:true },
    { id:"m-1-5", conversationId:"conv-1", senderId:"client", senderType:"client", senderName:"You", senderAvatarInitials:"ME",
      text:"That would be amazing. Also, can you include your thoughts on the database schema for the product catalogue?", createdAt:"2026-03-27T03:50:00Z", read:true },
    { id:"m-1-6", conversationId:"conv-1", senderId:"fl-1", senderType:"freelancer", senderName:"Alex Martinez", senderAvatarInitials:"AM",
      text:"Of course! I'll cover the schema, API design, and hosting architecture. Sounds great, I'll send the initial wireframes by Thursday!", createdAt:"2026-03-27T04:10:00Z", read:false },
    { id:"m-1-7", conversationId:"conv-1", senderId:"fl-1", senderType:"freelancer", senderName:"Alex Martinez", senderAvatarInitials:"AM",
      text:"Also feel free to share any competitor sites you like — always helps with design direction.", createdAt:"2026-03-27T04:12:00Z", read:false },
  ],
  "conv-2": [
    { id:"m-2-1", conversationId:"conv-2", senderId:"client", senderType:"client", senderName:"You", senderAvatarInitials:"ME",
      text:"Hi Sarah! Your portfolio is stunning. I'd love to discuss a complete design system for our platform.", createdAt:"2026-03-24T14:30:00Z", read:true },
    { id:"m-2-2", conversationId:"conv-2", senderId:"fl-2", senderType:"freelancer", senderName:"Sarah Chen", senderAvatarInitials:"SC",
      text:"Thank you! I'd be excited to help. What's the primary colour palette you have in mind?", createdAt:"2026-03-24T15:00:00Z", read:true },
    { id:"m-2-3", conversationId:"conv-2", senderId:"client", senderType:"client", senderName:"You", senderAvatarInitials:"ME",
      text:"We're thinking something dark and modern — blues and purples. Something that feels premium.", createdAt:"2026-03-25T10:00:00Z", read:true },
    { id:"m-2-4", conversationId:"conv-2", senderId:"fl-2", senderType:"freelancer", senderName:"Sarah Chen", senderAvatarInitials:"SC",
      text:"I love that direction. I've done similar work for fintech clients. Do you want accessibility to be a priority (WCAG 2.1 AA)?", createdAt:"2026-03-26T18:00:00Z", read:true },
    { id:"m-2-5", conversationId:"conv-2", senderId:"fl-2", senderType:"freelancer", senderName:"Sarah Chen", senderAvatarInitials:"SC",
      text:"Sure, I can adjust the colour palette. Do you have brand guidelines?", createdAt:"2026-03-26T18:30:00Z", read:false },
  ],
  "conv-3": [
    { id:"m-3-1", conversationId:"conv-3", senderId:"client", senderType:"client", senderName:"You", senderAvatarInitials:"ME",
      text:"James, I wanted to follow up on the offline sync requirement — the client has confirmed it's critical.", createdAt:"2026-03-22T09:30:00Z", read:true },
    { id:"m-3-2", conversationId:"conv-3", senderId:"fl-3", senderType:"freelancer", senderName:"James Okafor", senderAvatarInitials:"JO",
      text:"Got it. For offline sync I'd use WatermelonDB with a Supabase backend. It's highly reliable for this kind of use case.", createdAt:"2026-03-22T10:00:00Z", read:true },
    { id:"m-3-3", conversationId:"conv-3", senderId:"client", senderType:"client", senderName:"You", senderAvatarInitials:"ME",
      text:"How much extra time would that add to the project?", createdAt:"2026-03-25T10:45:00Z", read:true },
    { id:"m-3-4", conversationId:"conv-3", senderId:"fl-3", senderType:"freelancer", senderName:"James Okafor", senderAvatarInitials:"JO",
      text:"The offline sync module will add about a week to the timeline.", createdAt:"2026-03-25T11:00:00Z", read:true },
  ],
};

CONV_SEEDS.forEach(c => conversationDb.set(c.id, {...c}));
Object.entries(MSG_SEEDS).forEach(([id, msgs]) => messageDb.set(id, msgs.map(m=>({...m}))));

// ─── Conversation Routes ───────────────────────────────────────────────────────

/** GET /api/conversations */
app.get("/api/conversations", authenticateToken, (req: any, res) => {
  const list = [...conversationDb.values()]
    .filter(c => c.clientId === req.user.id || c.clientId === "__seed__")
    .sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  res.json({ data: list });
});

/** POST /api/conversations — start a new conversation */
app.post("/api/conversations", authenticateToken, (req: any, res) => {
  const { freelancerId, freelancerName, freelancerAvatarInitials="", topic="", message } = req.body;
  if (!freelancerId || !message?.trim()) return res.status(400).json({ error: "freelancerId and message required." });
  const id = randomUUID();
  const now = new Date().toISOString();
  const conv: Conversation = { id, clientId: req.user.id, freelancerId, freelancerName: freelancerName||"Unknown",
    freelancerAvatarInitials, lastMessage: message.trim(), lastMessageAt: now, unreadCount: 0, topic, createdAt: now };
  const msg: Message = { id: randomUUID(), conversationId: id, senderId: req.user.id, senderType: "client",
    senderName: "You", senderAvatarInitials: "ME", text: message.trim(), createdAt: now, read: true };
  conversationDb.set(id, conv);
  messageDb.set(id, [msg]);
  res.status(201).json({ data: { conversation: conv, firstMessage: msg } });
});

/** GET /api/conversations/:id/messages */
app.get("/api/conversations/:id/messages", authenticateToken, (req: any, res) => {
  const c = conversationDb.get(req.params.id);
  if (!c) return res.status(404).json({ error: "Conversation not found" });
  res.json({ data: messageDb.get(req.params.id) ?? [] });
});

/** POST /api/conversations/:id/messages — send a message */
app.post("/api/conversations/:id/messages", authenticateToken, (req: any, res) => {
  const c = conversationDb.get(req.params.id);
  if (!c) return res.status(404).json({ error: "Conversation not found" });
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Message text required." });
  const now = new Date().toISOString();
  const msg: Message = { id: randomUUID(), conversationId: req.params.id, senderId: req.user.id,
    senderType: "client", senderName: "You", senderAvatarInitials: "ME", text: text.trim(), createdAt: now, read: true };
  const thread = messageDb.get(req.params.id) ?? [];
  thread.push(msg);
  messageDb.set(req.params.id, thread);
  conversationDb.set(req.params.id, { ...c, lastMessage: msg.text, lastMessageAt: now });
  res.status(201).json({ data: msg });
});

/** PATCH /api/conversations/:id/read — mark as read */
app.patch("/api/conversations/:id/read", authenticateToken, (req: any, res) => {
  const c = conversationDb.get(req.params.id);
  if (!c) return res.status(404).json({ error: "Conversation not found" });
  const updated = { ...c, unreadCount: 0 };
  conversationDb.set(req.params.id, updated);
  const msgs = (messageDb.get(req.params.id) ?? []).map(m => ({ ...m, read: true }));
  messageDb.set(req.params.id, msgs);
  res.json({ data: updated });
});


// ─── Invoices ─────────────────────────────────────────────────────────────────

interface InvoiceLineItem { id: string; description: string; rate: number; quantity: number; }

interface Invoice {
  id: string; clientId: string; invoiceNumber: string;
  freelancerId: string; freelancerName: string; freelancerAvatarInitials: string;
  projectId: string; projectName: string;
  lineItems: InvoiceLineItem[];
  subtotal: number; tax: number; total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  issueDate: string; dueDate: string;
  paidAt?: string; paymentMethod?: string; transactionId?: string;
  notes?: string; createdAt: string;
}

const INVOICE_SEEDS: Invoice[] = [
  { id:"inv-1", clientId:"__seed__", invoiceNumber:"INV-2026-001",
    freelancerId:"fl-6", freelancerName:"Elena Volkov", freelancerAvatarInitials:"EV",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    lineItems:[
      { id:"li-1", description:"UI Design – Homepage & Product Pages (30 hrs)", rate:90, quantity:30 },
      { id:"li-2", description:"React Component Development (40 hrs)", rate:90, quantity:40 },
      { id:"li-3", description:"QA & Cross-browser Testing (10 hrs)", rate:90, quantity:10 },
    ], subtotal:7200, tax:576, total:7776,
    status:"paid", issueDate:"2026-03-01", dueDate:"2026-03-15",
    paidAt:"2026-03-12T14:30:00Z", paymentMethod:"Visa ending in 4242", transactionId:"txn_3R8xKPLkdIwHu7Yx1aB9kWqZ",
    notes:"Thank you for the great work!", createdAt:"2026-03-01T09:00:00Z" },

  { id:"inv-2", clientId:"__seed__", invoiceNumber:"INV-2026-002",
    freelancerId:"fl-1", freelancerName:"Alex Martinez", freelancerAvatarInitials:"AM",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    lineItems:[
      { id:"li-4", description:"Architecture Consulting (8 hrs)", rate:120, quantity:8 },
      { id:"li-5", description:"Node.js API Development – Milestone 1 (50 hrs)", rate:120, quantity:50 },
      { id:"li-6", description:"AWS Infrastructure Setup", rate:500, quantity:1 },
    ], subtotal:7460, tax:596.8, total:8056.80,
    status:"sent", issueDate:"2026-03-20", dueDate:"2026-04-03",
    notes:"Payment due within 14 days of invoice date.", createdAt:"2026-03-20T10:00:00Z" },

  { id:"inv-3", clientId:"__seed__", invoiceNumber:"INV-2026-003",
    freelancerId:"fl-7", freelancerName:"David Park", freelancerAvatarInitials:"DP",
    projectId:"proj-seed-3", projectName:"Brand Identity Package",
    lineItems:[
      { id:"li-7", description:"Logo Design – 3 Concepts + Revisions", rate:1200, quantity:1 },
      { id:"li-8", description:"Brand Guidelines Document (50 pages)", rate:800, quantity:1 },
      { id:"li-9", description:"Social Media Asset Kit", rate:400, quantity:1 },
    ], subtotal:2400, tax:192, total:2592,
    status:"overdue", issueDate:"2026-02-15", dueDate:"2026-03-01",
    notes:"Payment is now overdue. Please remit at your earliest convenience.", createdAt:"2026-02-15T09:00:00Z" },

  { id:"inv-4", clientId:"__seed__", invoiceNumber:"INV-2026-004",
    freelancerId:"fl-3", freelancerName:"James Okafor", freelancerAvatarInitials:"JO",
    projectId:"proj-seed-2", projectName:"Mobile App Development",
    lineItems:[
      { id:"li-10", description:"Mobile Architecture & Boilerplate Setup (20 hrs)", rate:100, quantity:20 },
      { id:"li-11", description:"UI Implementation – 8 Screens (60 hrs)", rate:100, quantity:60 },
      { id:"li-12", description:"Firebase Integration (15 hrs)", rate:100, quantity:15 },
    ], subtotal:9500, tax:760, total:10260,
    status:"draft", issueDate:"2026-03-25", dueDate:"2026-04-08",
    createdAt:"2026-03-25T14:00:00Z" },

  { id:"inv-5", clientId:"__seed__", invoiceNumber:"INV-2026-005",
    freelancerId:"fl-2", freelancerName:"Sarah Chen", freelancerAvatarInitials:"SC",
    projectId:"proj-seed-1", projectName:"E-commerce Website Redesign",
    lineItems:[
      { id:"li-13", description:"UX Audit & Wireframing (20 hrs)", rate:80, quantity:20 },
      { id:"li-14", description:"Figma Prototype – 30 Screens (35 hrs)", rate:80, quantity:35 },
      { id:"li-15", description:"Design System Documentation", rate:600, quantity:1 },
    ], subtotal:5000, tax:400, total:5400,
    status:"sent", issueDate:"2026-03-22", dueDate:"2026-04-05",
    notes:"Milestone 1 payment — 50% of agreed project total.", createdAt:"2026-03-22T11:00:00Z" },
];

const invoiceDb = new Map<string, Invoice>(INVOICE_SEEDS.map((inv) => [inv.id, { ...inv }]));

// ─── Invoice Routes ────────────────────────────────────────────────────────────

/** GET /api/invoices */
app.get("/api/invoices", authenticateToken, (req: any, res) => {
  const { status } = req.query;
  let list = [...invoiceDb.values()].filter(inv => inv.clientId === req.user.id || inv.clientId === "__seed__");
  if (status && status !== "all") list = list.filter(inv => inv.status === status);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ data: list, total: list.length });
});

/** GET /api/invoices/:id */
app.get("/api/invoices/:id", authenticateToken, (req: any, res) => {
  const inv = invoiceDb.get(req.params.id);
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  res.json({ data: inv });
});

/** PATCH /api/invoices/:id — update status */
app.patch("/api/invoices/:id", authenticateToken, (req: any, res) => {
  const inv = invoiceDb.get(req.params.id);
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  const updated = { ...inv, ...req.body, id: inv.id };
  invoiceDb.set(inv.id, updated);
  res.json({ data: updated });
});

/** POST /api/invoices/:id/pay — simulate payment (integrate Stripe in production) */
app.post("/api/invoices/:id/pay", authenticateToken, (req: any, res) => {
  const inv = invoiceDb.get(req.params.id);
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  if (inv.status === "paid") return res.status(400).json({ error: "Invoice already paid." });
  const { cardLast4 = "4242" } = req.body;
  // Production: create Stripe PaymentIntent + confirm with token
  const updated: Invoice = { ...inv, status: "paid",
    paidAt: new Date().toISOString(),
    paymentMethod: `Visa ending in ${cardLast4}`,
    transactionId: `txn_${randomUUID().replace(/-/g,"").substring(0,24)}` };
  invoiceDb.set(inv.id, updated);
  res.json({ data: updated });
});


// ─── Client Profile ────────────────────────────────────────────────────────────

interface ClientProfile {
  uid: string; fullName: string; email: string;
  phone: string; location: string; companyName: string;
  companyWebsite: string; companySize: string; industry: string;
  companyDescription: string; logoUrl: string;
  notifications: {
    emailNewProposals: boolean; emailProposalReminders: boolean;
    emailMeetingReminders: boolean; emailInvoices: boolean;
    emailProjectUpdates: boolean; emailAiInsights: boolean;
    emailWeeklyDigest: boolean;
    pushNewProposals: boolean; pushMeetingReminders: boolean;
    pushMessages: boolean;
  };
  connectedAccounts: { google: boolean; github: boolean; outlook: boolean; zapier: boolean; };
  createdAt: string; updatedAt: string;
}

const clientProfileDb = new Map<string, ClientProfile>();

function getOrCreateProfile(uid: string, email = ""): ClientProfile {
  if (!clientProfileDb.has(uid)) {
    const now = new Date().toISOString();
    clientProfileDb.set(uid, {
      uid, fullName: "", email, phone: "", location: "", companyName: "",
      companyWebsite: "", companySize: "", industry: "", companyDescription: "", logoUrl: "",
      notifications: {
        emailNewProposals: true, emailProposalReminders: true, emailMeetingReminders: true,
        emailInvoices: true, emailProjectUpdates: true, emailAiInsights: false, emailWeeklyDigest: true,
        pushNewProposals: true, pushMeetingReminders: true, pushMessages: true,
      },
      connectedAccounts: { google: false, github: false, outlook: false, zapier: false },
      createdAt: now, updatedAt: now,
    });
  }
  return clientProfileDb.get(uid)!;
}

/** GET /api/clients/:uid */
app.get("/api/clients/:uid", authenticateToken, (req: any, res) => {
  const profile = getOrCreateProfile(req.params.uid, req.user.email);
  res.json({ data: profile });
});

/** PUT /api/clients/:uid */
app.put("/api/clients/:uid", authenticateToken, (req: any, res) => {
  const existing = getOrCreateProfile(req.params.uid, req.user.email);
  const updated: ClientProfile = { ...existing, ...req.body, uid: existing.uid, email: existing.email, updatedAt: new Date().toISOString() };
  clientProfileDb.set(existing.uid, updated);
  res.json({ data: updated });
});

/** DELETE /api/clients/:uid — account deletion */
app.delete("/api/clients/:uid", authenticateToken, (req: any, res) => {
  clientProfileDb.delete(req.params.uid);
  // Production: delete from Firestore, revoke tokens, cascade-delete all user data
  res.json({ success: true, message: "Account deleted. Goodbye." });
});

// ─── AI Chat (n8n Webhook) ───────────────────────────────────────────────────

/**
 * In-memory session store: sessionId → message history + context
 * shape: { messages: {role,content}[], context: {} }
 */
const chatSessions = new Map<string, {
  userId:   string;
  userRole: "client" | "freelancer";
  messages: { role: "user" | "assistant"; content: string }[];
  context:  Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
}>();


const N8N_WEBHOOK_URL      = process.env.N8N_WEBHOOK_URL       || "";
const N8N_LEAD_ANALYZE_URL = process.env.N8N_LEAD_ANALYZE_URL  || N8N_WEBHOOK_URL;
console.log(`🔗 n8n webhook: ${N8N_WEBHOOK_URL || "(none — local AI only)"}`);
console.log(`🔗 n8n lead-analyze: ${N8N_LEAD_ANALYZE_URL || "(none — local AI only)"}`);

/**
 * POST /api/chat
 * Body: { message: string; sessionId: string; userType: "client" | "freelancer" }
 * Response: { reply, matches?, meetingLink?, projectInfo?, quickActions? }
 *
 * Flow:
 *  1. Append user message to session history
 *  2. Detect intent from message keywords
 *  3. If N8N_WEBHOOK_URL set → forward to n8n, merge response
 *  4. Else → generate structured mock AI response
 *  5. Return combined reply + rich data
 */
app.post("/api/chat", authenticateToken, async (req: any, res) => {
  try {
    const { message, sessionId, userType = "client" } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "message is required" });
    }
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // ── Restore / init session ─────────────────────────────────────────────
    const now = new Date().toISOString();
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, {
        userId:      req.user.id,
        userRole:    userType as "client" | "freelancer",
        messages:    [],
        context:     {},
        createdAt:   now,
        updatedAt:   now,
        lastMessage: "",
      });
    }
    const session = chatSessions.get(sessionId)!;

    // Ownership check — only the session creator can write to it
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden — not your session" });
    }
    session.messages.push({ role: "user", content: message.trim() });

    // ── Intent detection ──────────────────────────────────────────────────
    const lower = message.toLowerCase();
    const intentFindFreelancer   = /find|looking|need|want|hire|freelancer|developer|designer|devops|data/i.test(lower);
    const intentSendProposal     = /send|proposal|bid|offer/i.test(lower);
    const intentSchedule         = /schedule|meeting|call|calendar|book/i.test(lower);
    const intentProjectDesc      = /project|budget|\$|timeline|requirement|deadline/i.test(lower);
    const intentAcceptJob        = /accept|take|confirm.*job|confirm.*project/i.test(lower);
    const intentViewProjects     = /show|list|available|open|active|project/i.test(lower);

    // Budget extraction
    const budgetMatch = lower.match(/(\$|\b)(\d[\d,]*)\s*(k|thousand)?\b/);
    const budget = budgetMatch
      ? `$${budgetMatch[2]}${budgetMatch[3] ? "k" : ""}`
      : undefined;

    // Tech stack extraction
    const techKeywords = ["react","node","typescript","python","flutter","ios","android","figma","aws","docker","go","vue","angular","nextjs","fastapi"];
    const detectedSkills = techKeywords.filter((k) => lower.includes(k));

    // ── n8n webhook call (optional) ───────────────────────────────────────
    let n8nReply: string | null   = null;
    let n8nMatches: unknown[]      = [];
    let n8nMeetingLink: string | null = null;
    let n8nStatus: string | null  = null;

    if (N8N_WEBHOOK_URL) {
      try {
        const n8nRes = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            sessionId,
            userType,
            userId: req.user.id,
            history: session.messages.slice(-10),
            context: session.context,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (n8nRes.ok) {
          const n8nData = (await n8nRes.json()) as {
            reply?: string;
            matches?: unknown[];
            meetingLink?: string;
            status?: string;
          };
          n8nReply      = n8nData.reply      ?? null;
          n8nMatches    = n8nData.matches    ?? [];
          n8nMeetingLink= n8nData.meetingLink?? null;
          n8nStatus     = n8nData.status     ?? null;
          console.log(`✅ [n8n] webhook responded status=${n8nStatus}`);
        }
      } catch (n8nErr: any) {
        console.warn(`⚠️  [n8n] webhook unreachable: ${n8nErr.message} — falling back to local AI`);
      }
    }

    // ── Local AI response (fallback / supplement) ─────────────────────────
    // Pull top freelancers from the seeded catalogue
    const allFreelancers = [...freelancerDb.values()];

    let reply = n8nReply ?? "";
    let matches: unknown[] = n8nMatches;
    let meetingLink = n8nMeetingLink;
    let projectInfo: Record<string, unknown> | undefined;
    let quickActions: string[] = [];

    if (!reply) {
      // ── Client intents ────────────────────────────────────────────────
      if (userType === "client") {
        if (intentFindFreelancer || intentProjectDesc) {
          // Filter by detected skills
          let filtered = detectedSkills.length > 0
            ? allFreelancers.filter((f) =>
                detectedSkills.some((sk) =>
                  f.skills.map((s) => s.toLowerCase()).includes(sk)
                )
              )
            : allFreelancers;
          if (filtered.length === 0) filtered = allFreelancers;

          // Top 3 by matchScore
          const top = filtered.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
          matches = top.map((f) => ({
            id:             f.id,
            name:           f.name,
            role:           f.role,
            skills:         f.skills,
            matchScore:     f.matchScore,
            rating:         f.rating,
            hourlyRate:     f.hourlyRate,
            availability:   f.availability,
            avatarInitials: f.avatarInitials,
            location:       f.location,
          }));

          const skillLine = detectedSkills.length > 0
            ? ` specialising in ${detectedSkills.map((s) => s[0].toUpperCase() + s.slice(1)).join(", ")}`
            : "";
          const budgetLine = budget ? ` with a budget of ${budget}` : "";

          reply = `I found **${top.length} top-matched freelancers**${skillLine}${budgetLine}. Here are my recommendations based on skills, rating, and availability:\n\n` +
            top.map((f, i) => `${i + 1}. **${f.name}** (${f.role}) — ${f.matchScore}% match, ⭐ ${f.rating}, $${f.hourlyRate}/hr`).join("\n") +
            `\n\nWould you like me to **send a proposal** to any of them or **schedule a meeting**?`;

          projectInfo = { title: `Project — ${detectedSkills.join("/") || "New"}`, budget, status: "new_lead" };
          session.context.lastMatches    = matches;
          session.context.lastProjectInfo = projectInfo;
          quickActions = ["Send proposal to top match", "Schedule meeting with all", "Show more freelancers"];
        } else if (intentSendProposal) {
          reply = `✅ Proposal workflow triggered!\n\nI've sent a proposal request to the matched freelancers via n8n. You'll receive email confirmations shortly.\n\nAnything else — would you like to **schedule a discovery call** or **track proposal status**?`;
          quickActions = ["Schedule meeting", "Track proposal status", "Find more freelancers"];
        } else if (intentSchedule) {
          meetingLink = `https://meet.google.com/${randomUUID().slice(0,3)}-${randomUUID().slice(0,4)}-${randomUUID().slice(0,3)}`;
          reply = `📅 Meeting scheduled!\n\nI've created a Google Meet link and notified all participants through n8n. Here's your meeting link:`;
          quickActions = ["Add to calendar", "Send reminder", "Find another time"];
        } else {
          reply = `Got it! How can I help you today? You can:\n\n• **Find a freelancer** — describe your project and budget\n• **Send a proposal** — I'll trigger the n8n workflow\n• **Schedule a meeting** — get an instant Meet link\n• **View your projects** — track status and proposals\n\nWhat would you like to do?`;
          quickActions = ["Find a React developer", "Schedule meeting", "Show my projects"];
        }
      } else {
        // ── Freelancer intents ──────────────────────────────────────────
        if (intentAcceptJob) {
          reply = `✅ Job accepted!\n\nI've notified the client and updated your project status via n8n. You should receive onboarding details via email shortly.\n\nWould you like to **send the client an intro message** or **schedule a kickoff call**?`;
          quickActions = ["Message client", "Schedule kickoff call", "View project brief"];
        } else if (intentSchedule) {
          meetingLink = `https://meet.google.com/${randomUUID().slice(0,3)}-${randomUUID().slice(0,4)}-${randomUUID().slice(0,3)}`;
          reply = `📅 Your meeting is scheduled!\n\nThe client has been notified. Here's the link:`;
          quickActions = ["Set reminder", "Add to Google Calendar"];
        } else if (intentViewProjects) {
          const openProjects = [...db.projects.values()].slice(0, 3);
          reply = openProjects.length > 0
            ? `Here are some open projects that match your profile:\n\n${openProjects.map((p, i) => `${i + 1}. **${p.title}** — Budget $${p.budgetMin}–$${p.budgetMax} · ${p.priority} priority`).join("\n")}\n\nWould you like to apply to any of these?`
            : `There are no open projects in the system right now. I'll notify you as soon as new projects are posted that match your skills.`;
          quickActions = ["Apply to first project", "Filter by tech stack", "Set job alerts"];
        } else {
          reply = `Hi! I'm your freelancer assistant. I can help you:\n\n• **Browse open projects** — find your next gig\n• **Accept job offers** — I'll handle the n8n workflow\n• **Schedule meetings** — get a meet link instantly\n• **Message clients** — through the messaging system\n\nWhat would you like to do?`;
          quickActions = ["Browse open projects", "My schedule today", "Check my earnings"];
        }
      }
    }

    // ── Append AI reply to session history ────────────────────────────────
    session.messages.push({ role: "assistant", content: reply });

    // Trim history to last 20 turns
    if (session.messages.length > 40) {
      session.messages = session.messages.slice(-40);
    }

    return res.json({
      reply,
      matches:     matches.length  > 0 ? matches      : undefined,
      meetingLink: meetingLink     ?? undefined,
      projectInfo: projectInfo     ?? undefined,
      quickActions: quickActions.length > 0 ? quickActions : undefined,
      status:      n8nStatus       ?? "ok",
      sessionId,
    });

  } catch (err) {
    console.error("[/api/chat] error:", err);
    res.status(500).json({ error: "AI chat error" });
  }
});

// ─── Lead Analyze (n8n primary webhook) ──────────────────────────────────────
/**
 * POST /api/lead-analyze
 *
 * Sends structured project details to the Crescent Black n8n webhook and
 * returns AI analysis + matched freelancers + meeting link.
 *
 * Body: { title, description, budget, timeline, clientName, clientEmail, sessionId? }
 *
 * Webhook: https://angrybaby.app.n8n.cloud/webhook-test/lead-analyze
 */

const LEAD_WEBHOOK_URL = process.env.N8N_LEAD_WEBHOOK_URL ||
  "https://angrybaby.app.n8n.cloud/webhook-test/lead-analyze";

app.post("/api/lead-analyze", authenticateToken, async (req: any, res) => {
  try {
    const {
      title       = "",
      description = "",
      budget      = "",
      timeline    = "",
      clientName  = "",
      clientEmail = "",
      sessionId   = randomUUID(),
    } = req.body;

    if (!description.trim()) {
      return res.status(400).json({ error: "description is required" });
    }

    const payload = {
      title:       title.trim()       || "Untitled Project",
      description: description.trim(),
      budget:      budget.trim()      || "Not specified",
      timeline:    timeline.trim()    || "Not specified",
      clientName:  clientName.trim()  || req.user.email,
      clientEmail: clientEmail.trim() || req.user.email,
      sessionId,
      userId:      req.user.id,
    };

    console.log(`[lead-analyze] → n8n | user=${req.user.id} project="${payload.title}"`);

    let n8nData: Record<string, unknown> | null = null;

    // ── Try the real n8n webhook ──────────────────────────────────────────────
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 12_000);

      const n8nRes = await fetch(LEAD_WEBHOOK_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
        signal:  controller.signal,
      });
      clearTimeout(t);

      if (n8nRes.ok) {
        const raw = await n8nRes.json();
        // n8n may return array or object
        n8nData = Array.isArray(raw) ? raw[0] : raw;
        console.log(`[lead-analyze] ← n8n OK | status=${(n8nData as any)?.status ?? "?"}`);
      } else {
        console.warn(`[lead-analyze] n8n returned HTTP ${n8nRes.status} — using local AI`);
      }
    } catch (fetchErr: any) {
      console.warn(`[lead-analyze] n8n unreachable: ${fetchErr.message} — using local AI`);
    }

    // ── Build response (n8n or rich local fallback) ───────────────────────────
    const allFreelancers = [...freelancerDb.values()];
    const topMatches = allFreelancers
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .map((f) => ({
        id:             f.id,
        name:           f.name,
        role:           f.role,
        skills:         f.skills,
        matchScore:     f.matchScore,
        rating:         f.rating,
        hourlyRate:     f.hourlyRate,
        availability:   f.availability,
        avatarInitials: f.avatarInitials,
        location:       f.location,
        matchReason:    `Strong ${f.skills.slice(0,2).join(" & ")} background with ${f.rating}★ rating`,
      }));

    const meetingLink = `https://meet.google.com/${randomUUID().slice(0,3)}-${randomUUID().slice(0,4)}-${randomUUID().slice(0,3)}`;

    // Merge n8n data with local data
    const reply = (n8nData as any)?.aiResponse
      || (n8nData as any)?.reply
      || (n8nData as any)?.message
      || `✅ **Lead Analysis Complete!**\n\nI've analysed your project **"${payload.title}"** and found **${topMatches.length} top freelancer matches**.\n\n${topMatches.map((m, i) => `${i + 1}. **${m.name}** (${m.role}) — ${m.matchScore}% match · ⭐ ${m.rating} · $${m.hourlyRate}/hr`).join("\n")}\n\nWould you like me to **send proposals** or **schedule discovery calls**?`;

    const matchedFreelancers = (n8nData as any)?.matchedFreelancers
      || (n8nData as any)?.matches
      || topMatches;

    const finalMeetingLink = (n8nData as any)?.meetingLink || meetingLink;

    const status = (n8nData as any)?.status || "analyzed";

    const analysis = {
      projectTitle:     payload.title,
      budget:           payload.budget,
      timeline:         payload.timeline,
      complexity:       (n8nData as any)?.complexity || "medium",
      recommendedRoles: topMatches.map((m) => m.role).filter((v, i, a) => a.indexOf(v) === i),
      estimatedCost:    (n8nData as any)?.estimatedCost || budget || "TBD",
    };

    const timelineSteps = (n8nData as any)?.timelineSteps || [
      { step: 1, label: "Lead Analyzed",        status: "done",    time: new Date().toISOString() },
      { step: 2, label: "Freelancers Matched",  status: "done",    time: new Date().toISOString() },
      { step: 3, label: "Proposals Sent",       status: "pending", time: null },
      { step: 4, label: "Meeting Scheduled",    status: "pending", time: null },
      { step: 5, label: "Project Kickoff",      status: "pending", time: null },
    ];

    const quickActions = (n8nData as any)?.quickActions
      || ["Send Proposals to All", "Schedule Meeting", "Refine Search", "View Full Analysis"];

    return res.json({
      reply,
      analysis,
      matchedFreelancers,
      meetingLink: finalMeetingLink,
      timelineSteps,
      status,
      sessionId,
      quickActions,
      n8nConnected: !!n8nData,
    });

  } catch (err) {
    console.error("[/api/lead-analyze] error:", err);
    res.status(500).json({ error: "Lead analysis failed — please try again" });
  }
});

// ─── Lead Analyzer endpoint (AIChatPage) ─────────────────────────────────────

/**
 * POST /api/lead-analyze
 * Used by AIChatPage for the "Project Brief" form submission.
 * Accepts { title, description, budget, timeline, clientName, clientEmail, sessionId }
 * Returns { reply, analysis, matchedFreelancers, meetingLink, timelineSteps, quickActions, n8nConnected }
 */
app.post("/api/lead-analyze", authenticateToken, async (req: any, res) => {
  try {
    const {
      title = "", description = "", budget = "",
      timeline = "", clientName = "", clientEmail = "",
      sessionId = `lead-${randomUUID().slice(0,8)}`,
    } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: "description is required" });
    }

    // ── Optional n8n forward ─────────────────────────────────────────────
    let n8nReply: string | null = null;
    let n8nFreelancers: unknown[] = [];
    let n8nConnected = false;

    const LEAD_URL = N8N_LEAD_ANALYZE_URL;
    if (LEAD_URL) {
      // Try both production and test URLs (n8n uses different paths for each)
      const urlsToTry = [
        LEAD_URL,
        LEAD_URL.replace("/webhook/", "/webhook-test/"),
      ];

      for (const url of urlsToTry) {
        if (n8nConnected) break; // already got a response
        console.log(`📡 [lead-analyze] Trying n8n: ${url}`);
        try {
          const n8nRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title, description, budget, timeline,
              clientName, clientEmail, sessionId,
              userId: req.user.id, type: "lead_analyze",
            }),
            signal: AbortSignal.timeout(15000),
          });
          console.log(`📡 [lead-analyze] n8n responded: HTTP ${n8nRes.status} from ${url}`);
          if (n8nRes.ok) {
            const n8nData = await n8nRes.json() as { reply?: string; matchedFreelancers?: unknown[]; output?: string; text?: string; message?: string };
            console.log(`✅ [lead-analyze] n8n data keys: ${Object.keys(n8nData).join(", ")}`);
            n8nReply       = n8nData.reply ?? n8nData.output ?? n8nData.text ?? n8nData.message ?? null;
            n8nFreelancers = n8nData.matchedFreelancers ?? [];
            n8nConnected   = true;
          } else if (n8nRes.status === 404) {
            console.warn(`⚠️  [lead-analyze] n8n 404 at ${url} — trying next URL`);
          } else {
            const errText = await n8nRes.text();
            console.warn(`⚠️  [lead-analyze] n8n HTTP ${n8nRes.status}: ${errText.slice(0, 200)}`);
          }
        } catch (n8nErr: any) {
          console.warn(`⚠️  [lead-analyze] n8n unreachable (${url}): ${n8nErr.message}`);
        }
      }

      if (!n8nConnected) {
        console.log(`ℹ️  [lead-analyze] n8n unavailable — using local AI fallback`);
      }
    } else {
      console.log(`ℹ️  [lead-analyze] No N8N_LEAD_ANALYZE_URL — using local AI`);
    }

    // ── Local AI fallback ────────────────────────────────────────────────
    const allFreelancers = [...freelancerDb.values()];
    const lower = `${title} ${description}`.toLowerCase();
    const techKeywords = ["react","node","typescript","python","flutter","ios","android","figma","aws","docker","go","vue","angular","nextjs","fastapi","java","swift","kotlin","php","ruby"];
    const detectedSkills = techKeywords.filter(k => lower.includes(k));
    const budgetMatch = lower.match(/(\$|€|£)?(\d[\d,]*)(\s*(k|thousand|usd))?/i);
    const budgetVal = budgetMatch ? `$${budgetMatch[2]}${budgetMatch[4] ? "k" : ""}` : budget || "Flexible";

    // Complexity estimation
    const wordCount = description.split(/\s+/).length;
    const complexity = wordCount < 30 ? "Simple" : wordCount < 80 ? "Medium" : "Complex";

    // Filter + rank freelancers by detected skills
    let filtered = detectedSkills.length > 0
      ? allFreelancers.filter(f => detectedSkills.some(sk => f.skills.map(s => s.toLowerCase()).includes(sk)))
      : allFreelancers;
    if (filtered.length < 2) filtered = allFreelancers;

    const top3 = [...filtered]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .map((f, i) => ({
        id:             f.id,
        name:           f.name,
        role:           f.role,
        skills:         f.skills,
        matchScore:     Math.min(98, f.matchScore + Math.floor(Math.random() * 5)),
        rating:         f.rating,
        hourlyRate:     f.hourlyRate,
        availability:   f.availability,
        avatarInitials: f.avatarInitials,
        location:       f.location,
        matchReason:    i === 0 ? "Best overall match for your tech stack and timeline" :
                        i === 1 ? "Strong portfolio + fast response time" :
                                  "Great value — high rating for the budget",
      }));

    const matchedFreelancers = (n8nFreelancers.length > 0 ? n8nFreelancers : top3) as typeof top3;

    const skillLine = detectedSkills.length > 0
      ? ` with ${detectedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")} expertise`
      : "";

    const reply = n8nReply ??
      `✅ **Lead Analysis Complete!**\n\nI've analyzed your project brief${title ? ` for **${title}**` : ""}${skillLine}.\n\n` +
      `**Complexity:** ${complexity} • **Budget:** ${budgetVal}${timeline ? ` • **Timeline:** ${timeline}` : ""}\n\n` +
      `I've matched **${matchedFreelancers.length} top freelancers** from our network. ` +
      `Review the cards on the right and send proposals or schedule discovery calls directly.\n\n` +
      `Want me to auto-send proposals to all matches? Just say the word!`;

    // Workflow timeline steps
    const now = new Date().toISOString();
    const timelineSteps = [
      { step: 1, label: "Brief received & parsed",    status: "done",    time: now },
      { step: 2, label: "Skills extracted by AI",     status: "done",    time: now },
      { step: 3, label: "Freelancer matching running", status: "done",    time: now },
      { step: 4, label: "Top 3 matches selected",     status: "done",    time: now },
      { step: 5, label: "n8n proposal automation",    status: n8nConnected ? "done" : "pending", time: n8nConnected ? now : null },
      { step: 6, label: "Email notifications",        status: "pending", time: null },
    ];

    // AI analysis summary
    const analysis = {
      projectTitle:     title || "Untitled Project",
      budget:           budgetVal,
      timeline:         timeline || "To be defined",
      complexity,
      recommendedRoles: detectedSkills.length > 0
        ? detectedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1) + " Developer")
        : matchedFreelancers.slice(0, 2).map(f => f.role),
      estimatedCost:    budget || "Based on freelancer rates",
    };

    const quickActions = [
      "Send proposal to all matches",
      "Schedule discovery call",
      "Refine project requirements",
      "See more freelancers",
    ];

    return res.json({
      reply,
      analysis,
      matchedFreelancers,
      timelineSteps,
      quickActions,
      n8nConnected,
      status: "ok",
      sessionId,
    });

  } catch (err) {
    console.error("[/api/lead-analyze] error:", err);
    res.status(500).json({ error: "Lead analysis failed — please try again" });
  }
});

// ─── Chat Session Management ─────────────────────────────────────────────────


/**
 * GET /api/chat/sessions
 * Returns a paginated list of the authenticated user's chat sessions.
 */
app.get("/api/chat/sessions", authenticateToken, (req: any, res) => {
  const limit  = Math.min(Number(req.query.limit)  || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const userSessions = [...chatSessions.entries()]
    .filter(([, s]) => s.userId === req.user.id)
    .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(offset, offset + limit)
    .map(([sessionId, s]) => ({
      sessionId,
      userRole:    s.userRole,
      lastMessage: s.lastMessage,
      createdAt:   s.createdAt,
      updatedAt:   s.updatedAt,
      messageCount: s.messages.length,
    }));

  res.json({ data: userSessions, total: userSessions.length, limit, offset });
});

/**
 * GET /api/chat/sessions/:sessionId
 * Returns full session with message history.
 */
app.get("/api/chat/sessions/:sessionId", authenticateToken, (req: any, res) => {
  const session = chatSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  res.json({
    data: {
      sessionId:   req.params.sessionId,
      userRole:    session.userRole,
      messages:    session.messages,
      context:     session.context,
      createdAt:   session.createdAt,
      updatedAt:   session.updatedAt,
    },
  });
});

/**
 * DELETE /api/chat/sessions/:sessionId
 * Deletes a session owned by the authenticated user.
 */
app.delete("/api/chat/sessions/:sessionId", authenticateToken, (req: any, res) => {
  const session = chatSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  chatSessions.delete(req.params.sessionId);
  res.json({ success: true });
});

/**
 * POST /api/chat/actions
 * Execute a structured action (send_proposal, schedule_meeting, accept_job)
 * within the context of a chat session.
 *
 * Body: { sessionId, action, params: { freelancerId?, projectId?, meetingTime? } }
 */
app.post("/api/chat/actions", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId, action, params = {} } = req.body;

    if (!sessionId || !action) {
      return res.status(400).json({ error: "sessionId and action are required" });
    }

    const session = chatSessions.get(sessionId);
    if (!session)                        return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user.id)  return res.status(403).json({ error: "Forbidden" });

    const VALID_ACTIONS = ["send_proposal", "schedule_meeting", "accept_job"];
    if (!VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ error: `Unknown action '${action}'. Valid: ${VALID_ACTIONS.join(", ")}` });
    }

    let actionResult: Record<string, unknown> = {};
    let nextMessage = "";

    if (action === "send_proposal") {
      // Call n8n webhook if configured, else use fallback message
      let proposalN8nMsg = "✅ Proposal sent! The freelancer will be notified shortly.";
      if (N8N_WEBHOOK_URL) {
        try {
          const r = await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `send_proposal to freelancer ${params.freelancerId ?? "unknown"}`, sessionId, userId: req.user.id, userRole: session.userRole, context: { action: "send_proposal", ...params } }),
            signal: AbortSignal.timeout(8000) });
          if (r.ok) { const d = await r.json() as { aiResponse?: string }; proposalN8nMsg = d.aiResponse ?? proposalN8nMsg; }
        } catch { /* fallback */ }
      }
      actionResult = { proposalId: randomUUID() };
      nextMessage  = proposalN8nMsg;

    } else if (action === "schedule_meeting") {
      const meetingLink = `https://meet.google.com/${randomUUID().slice(0,3)}-${randomUUID().slice(0,4)}-${randomUUID().slice(0,3)}`;
      let scheduleN8nMsg = `📅 Meeting scheduled! Join here: ${meetingLink}`;
      if (N8N_WEBHOOK_URL) {
        try {
          const r = await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `schedule_meeting at ${params.meetingTime ?? "TBD"}`, sessionId, userId: req.user.id, userRole: session.userRole, context: { action: "schedule_meeting", meetingLink, ...params } }),
            signal: AbortSignal.timeout(8000) });
          if (r.ok) { const d = await r.json() as { aiResponse?: string }; scheduleN8nMsg = d.aiResponse ?? scheduleN8nMsg; }
        } catch { /* fallback */ }
      }
      actionResult = { meetingLink, meetingId: randomUUID() };
      nextMessage  = scheduleN8nMsg;

    } else if (action === "accept_job") {
      // Update project status in db
      if (params.projectId) {
        const project = db.projects.get(params.projectId);
        if (project) {
          db.projects.set(params.projectId, { ...project, status: "in_progress" });
        }
      }
      let acceptN8nMsg = "✅ Job accepted! The client has been notified. Check your email for onboarding details.";
      if (N8N_WEBHOOK_URL) {
        try {
          const r = await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `accept_job for project ${params.projectId ?? "unknown"}`, sessionId, userId: req.user.id, userRole: session.userRole, context: { action: "accept_job", ...params } }),
            signal: AbortSignal.timeout(8000) });
          if (r.ok) { const d = await r.json() as { aiResponse?: string }; acceptN8nMsg = d.aiResponse ?? acceptN8nMsg; }
        } catch { /* fallback */ }
      }
      actionResult = { confirmed: true, projectId: params.projectId };
      nextMessage  = acceptN8nMsg;    }

    // Save action message into session history
    session.messages.push({ role: "assistant", content: nextMessage });
    session.updatedAt   = new Date().toISOString();
    session.lastMessage = nextMessage.slice(0, 80);

    console.log(`[/api/chat/actions] action=${action} user=${req.user.id} session=${sessionId}`);

    return res.json({ success: true, actionResult, nextMessage });

  } catch (err) {
    console.error("[/api/chat/actions] error:", err);
    res.status(500).json({ error: "Action failed — please try again" });
  }
});

// ─── Vite Integration ─────────────────────────────────────────────────────────

async function startServer() {
  // 1. Seed demo users BEFORE accepting any requests (eliminates race condition)
  await seedDemoUsers();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // 2. Guard: /api/* and /auth/* that weren't matched above → 404 JSON (not SPA HTML)
    // We use a regex for auth so that the exact '/auth' path falls through to the SPA.
    app.use(["/api", /^\/auth\/.+/], (_req, res) => {
      res.status(404).json({ error: "API route not found" });
    });
    // 3. Everything else → Vite SPA
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Initialize Socket.io on the shared HTTP server
  await initializeSocket(httpServer);

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`⚡ Socket.io /messaging namespace active`);
  });
}

startServer();
