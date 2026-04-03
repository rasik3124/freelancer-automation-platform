import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/Button";
import { ROUTES, APP_NAME } from "../constants";
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Play,
  FileText,
  Calendar,
  Search,
  Layout,
  MessageSquare,
  TrendingUp,
  Plus,
  ChevronRight,
  ArrowUpRight,
  Globe,
  Shield,
  Cpu
} from "lucide-react";
import { Counter } from "../components/Counter";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base text-text-primary selection:bg-accent selection:text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16 border-b border-border">
        <div className="absolute inset-0 z-0 opacity-20 grid-pattern" />
        <div className="noise-bg" />
        <div className="scanline z-0" />
        
        <div className="container relative z-10 mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-accent" />
                <span className="mono-label text-accent">SYSTEM STATUS: OPERATIONAL <span className="terminal-cursor" /></span>
              </div>
              
              <h1 className="text-5xl font-display font-bold leading-[0.9] md:text-8xl tracking-tighter">
                THE <span className="glow-text italic">A.I.</span> <br />
                OPERATING <br />
                SYSTEM.
              </h1>
              
              <p className="mt-8 max-w-lg text-lg text-text-secondary leading-relaxed font-sans border-l-2 border-accent/30 pl-6">
                A high-density automation layer for elite freelancers. 
                Analyze leads, generate technical proposals, and manage 
                global operations from a single mission control.
              </p>
              
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => navigate(ROUTES.AUTH)}
                  className="px-10 font-bold uppercase tracking-widest text-[11px] technical-border shadow-glow"
                >
                  Initialize System
                </Button>
                <button className="flex items-center gap-3 rounded-sm border border-border bg-elevated px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-text-primary transition-all hover:bg-border group relative overflow-hidden">
                  <div className="absolute inset-0 bg-accent/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                  <Play className="relative z-10 h-4 w-4 fill-current group-hover:text-accent" />
                  <span className="relative z-10">System Overview</span>
                </button>
              </div>

              <div className="mt-16 grid grid-cols-2 gap-px bg-border border border-border lg:grid-cols-4">
                {[
                  { label: "UPTIME", val: 99.99, suffix: "%", status: "OK" },
                  { label: "LATENCY", val: 12, suffix: "ms", status: "LOW" },
                  { label: "NODES", val: 1240, status: "ACTIVE" },
                  { label: "REGION", val: 14, suffix: " NODES", status: "SYNC" }
                ].map(stat => (
                  <div key={stat.label} className="bg-base p-4 hover-glow transition-all">
                    <div className="mono-label flex justify-between">
                      {stat.label}
                      <span className="text-accent/50">{stat.status}</span>
                    </div>
                    <div className="mt-1 font-mono text-sm font-bold text-text-primary">
                      <Counter value={stat.val} suffix={stat.suffix} decimals={stat.label === "UPTIME" ? 2 : 0} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="technical-border z-10 overflow-hidden bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-border bg-elevated px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500/50" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                    <div className="h-2 w-2 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-8 bg-accent/20 rounded-full overflow-hidden">
                      <div className="h-full bg-accent animate-[scan_2s_linear_infinite]" />
                    </div>
                    <span className="mono-label text-[8px]">CRESCENT_OS_V2.4.EXE</span>
                  </div>
                </div>
                <div className="relative aspect-video">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200" 
                    alt="Dashboard Preview" 
                    className="w-full h-full object-cover opacity-80 mix-blend-screen"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-base/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating UI elements */}
                  <div className="absolute top-4 right-4 technical-border bg-base/80 backdrop-blur-sm p-3 scale-75 origin-top-right">
                    <div className="mono-label mb-2">NETWORK_LOAD</div>
                    <div className="flex gap-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`h-4 w-1 ${i < 5 ? 'bg-accent' : 'bg-border'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-10 z-0 rounded-full bg-accent/5 blur-3xl animate-pulse" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Section (The Evolution) */}
      <section className="border-b border-border py-32 bg-surface/30 relative">
        <div className="noise-bg" />
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-4 bg-accent" />
                <span className="mono-label text-accent">BENCHMARK_ANALYSIS</span>
              </div>
              <h2 className="text-4xl font-bold uppercase tracking-tight leading-[0.9] md:text-6xl">SYSTEM <br /><span className="text-accent">EVOLUTION</span></h2>
              <p className="mt-6 text-text-secondary leading-relaxed border-l border-border pl-6">
                Legacy workflows are the primary bottleneck for scale. 
                Crescent Black replaces manual overhead with a 
                deterministic automation layer.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="h-2 w-2 bg-accent" />
                <div className="h-2 w-2 bg-border" />
                <div className="h-2 w-2 bg-border" />
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
              {/* Old Way */}
              <div className="bg-surface p-8 opacity-40 grayscale hover:opacity-60 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 mono-label text-[8px] opacity-20">LEGACY_V1.0</div>
                <div className="flex items-center gap-3 text-red-500/80 mb-8">
                  <XCircle className="h-5 w-5" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">MANUAL_OVERHEAD</h3>
                </div>
                <div className="space-y-4">
                  {[
                    "Manual proposals (2 hrs each)",
                    "Endless email coordination",
                    "Chaos of disconnected spreadsheets",
                    "Missed leads from slow responses"
                  ].map(item => (
                    <div key={item} className="flex items-center justify-between border-b border-border/30 pb-4">
                      <span className="text-[10px] font-mono text-text-secondary">{item}</span>
                      <div className="h-1 w-1 bg-red-500/30" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Crescent Black Way */}
              <div className="bg-elevated p-8 shadow-glow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 mono-label text-[8px] text-accent">CRESCENT_OS_ACTIVE</div>
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 text-accent mb-8 relative z-10">
                  <Zap className="h-5 w-5 flicker" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">AUTOMATION_LAYER</h3>
                </div>
                <div className="space-y-4 relative z-10">
                  {[
                    "Instant AI-generated proposals",
                    "Automated smart scheduling",
                    "Centralized AI dashboard",
                    "24/7 AI lead analysis & triage"
                  ].map(item => (
                    <div key={item} className="flex items-center justify-between border-b border-accent/20 pb-4">
                      <span className="text-[10px] font-mono text-text-primary">{item}</span>
                      <CheckCircle2 className="h-3 w-3 text-accent glow-text" />
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-accent/20 flex justify-between items-center relative z-10">
                  <span className="mono-label text-accent">EFFICIENCY_GAIN</span>
                  <span className="font-mono text-xl font-bold text-accent">+850%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 relative overflow-hidden border-b border-border">
        <div className="noise-bg" />
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-4 bg-accent" />
                <span className="mono-label text-accent">PIPELINE_WORKFLOW</span>
              </div>
              <h2 className="text-4xl font-bold uppercase tracking-tight md:text-6xl">DETERMINISTIC <br />EXECUTION</h2>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 border border-border flex items-center justify-center text-[10px] font-mono hover:border-accent transition-colors cursor-crosshair">01</div>
              <div className="h-10 w-10 border border-border flex items-center justify-center text-[10px] font-mono hover:border-accent transition-colors cursor-crosshair">02</div>
              <div className="h-10 w-10 border border-accent flex items-center justify-center text-[10px] font-mono text-accent glow-text">03</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {[
              { id: "01", title: "Lead Intake", desc: "Smart submission forms that capture exactly what you need to price accurately.", img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600" },
              { id: "02", title: "AI Analysis", desc: "Our engine dissects project scope, estimates hours, and identifies potential risks.", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600" },
              { id: "03", title: "Proposal Gen", desc: "One-click generation of high-converting, professional PDF or web proposals.", img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600" },
              { id: "04", title: "Auto-Comms", desc: "Automated follow-ups and client onboarding sequences start immediately.", img: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600" },
              { id: "05", title: "Smart Booking", desc: "Synced calendars and intelligent booking links end appointment fatigue.", img: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600" },
              { id: "06", title: "Milestone Sync", desc: "Real-time profitability tracking and milestone management from one view.", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600" },
            ].map((step) => (
              <div key={step.id} className="group bg-base p-8 hover:bg-elevated hover-glow transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[10px] text-accent">{step.id}</span>
                  <div className="h-px flex-1 mx-4 bg-border group-hover:bg-accent/30 transition-colors" />
                  <Plus className="h-3 w-3 text-text-disabled group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight mb-4 group-hover:text-accent transition-colors">{step.title}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed mb-8 h-12 overflow-hidden">{step.desc}</p>
                <div className="aspect-video overflow-hidden technical-border grayscale group-hover:grayscale-0 transition-all duration-500">
                  <img 
                    src={step.img} 
                    alt={step.title} 
                    className="h-full w-full object-cover opacity-20 group-hover:opacity-60 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Command Center Section */}
      <section className="bg-base py-32 border-b border-border relative">
        <div className="absolute inset-0 z-0 opacity-5 grid-pattern" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <Layout className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-bold uppercase tracking-tight">MISSION_CONTROL_V2</h2>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-3">
              <span className="mono-label">REAL_TIME_DATA</span>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          <div className="bento-grid">
            {/* Main Stats */}
            <div className="md:col-span-4 bento-card">
              <div className="flex justify-between items-start mb-4">
                <span className="mono-label">ACTIVE_LEADS</span>
                <TrendingUp className="h-3 w-3 text-accent" />
              </div>
              <div>
                <div className="font-mono text-5xl font-bold text-text-primary tracking-tighter">
                  <Counter value={128} />
                </div>
                <div className="mt-2 font-mono text-[10px] text-accent">+12% VS LAST_PERIOD</div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="mission-control-detail">NODE_ID: 0x882_ALPHA</div>
                <div className="mission-control-detail">STATUS: PROCESSING</div>
              </div>
            </div>

            <div className="md:col-span-4 bento-card">
              <div className="flex justify-between items-start mb-4">
                <span className="mono-label">CONVERSION_RATE</span>
                <div className="h-1 w-12 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[42%]" />
                </div>
              </div>
              <div>
                <div className="font-mono text-5xl font-bold text-text-primary tracking-tighter">
                  <Counter value={42.5} suffix="%" decimals={1} />
                </div>
                <div className="mt-2 font-mono text-[10px] text-accent">+5.2% VS LAST_PERIOD</div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="mission-control-detail">ALGO: NEURAL_TRIAGE_V4</div>
                <div className="mission-control-detail">CONFIDENCE: 0.982</div>
              </div>
            </div>

            <div className="md:col-span-4 bento-card">
              <div className="flex justify-between items-start mb-4">
                <span className="mono-label">AVG_DEAL_SIZE</span>
                <span className="text-accent text-[10px] font-mono">OPTIMIZED</span>
              </div>
              <div>
                <div className="font-mono text-5xl font-bold text-text-primary tracking-tighter">
                  <Counter value={8.4} prefix="$" suffix="K" decimals={1} />
                </div>
                <div className="mt-2 font-mono text-[10px] text-accent">+$1.2K VS LAST_PERIOD</div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="mission-control-detail">CURRENCY: USD</div>
                <div className="mission-control-detail">MARKET_SYNC: ACTIVE</div>
              </div>
            </div>

            {/* Analytics Graph */}
            <div className="md:col-span-8 bento-card">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <h4 className="font-mono text-[10px] uppercase tracking-widest">THROUGHPUT_ANALYTICS</h4>
                </div>
                <div className="flex gap-4">
                  {['1H', '24H', '7D'].map(t => (
                    <span key={t} className={`mono-label cursor-pointer transition-colors ${t === '24H' ? 'text-accent' : 'hover:text-accent'}`}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="h-64 w-full flex items-end gap-1 border-l border-b border-border p-2">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-accent/10 border-t border-accent/40 hover:bg-accent/60 transition-all group relative" 
                    style={{ height: `${20 + Math.random() * 80}%` }} 
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-accent text-base text-[8px] font-mono px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.floor(Math.random() * 100)}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                {['00:00', '06:00', '12:00', '18:00', '23:59'].map(t => (
                  <span key={t} className="mono-label">{t}</span>
                ))}
              </div>
            </div>

            {/* Logs & Nodes */}
            <div className="md:col-span-4 space-y-4">
              <div className="technical-border bg-surface p-6 h-[calc(50%-8px)]">
                <h4 className="mono-label text-accent mb-6 flex justify-between">
                  SYSTEM_LOGS
                  <span className="animate-pulse">●</span>
                </h4>
                <div className="space-y-3 font-mono text-[9px]">
                  {[
                    { time: "14:22:01", msg: "LEAD_ID_882 ANALYZED: SCORE 9.2", color: "text-accent" },
                    { time: "14:20:45", msg: "PROPOSAL_V4 GENERATED FOR 'ACME_CORP'", color: "text-text-primary" },
                    { time: "14:18:12", msg: "MEETING_SYNC: 4 CONFLICTS RESOLVED", color: "text-text-muted" },
                    { time: "14:15:30", msg: "PAYMENT_GATEWAY: $4,200.00 SETTLED", color: "text-green-500" },
                    { time: "14:12:05", msg: "NEW_LEAD: INBOUND FROM WEB_FORM_A", color: "text-accent" },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-2 border-l border-border pl-2 hover:border-accent transition-colors">
                      <span className="text-text-disabled shrink-0">{log.time}</span>
                      <span className={`${log.color} truncate`}>{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="technical-border bg-surface p-6 h-[calc(50%-8px)]">
                <h4 className="mono-label mb-6">ACTIVE_NODES</h4>
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className={`h-2 rounded-sm ${Math.random() > 0.2 ? 'bg-accent/40' : 'bg-border'} hover:bg-accent transition-colors cursor-help`} />
                  ))}
                </div>
                <div className="mt-6 flex justify-between items-center border-t border-border pt-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-text-muted uppercase">LOAD_BALANCER</span>
                    <span className="text-[10px] font-mono text-accent">OPTIMAL</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-text-muted uppercase">CPU_USAGE</span>
                    <span className="text-[10px] font-mono text-text-primary">24.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Engine Section */}
      <section className="py-32 bg-surface relative overflow-hidden">
        <div className="noise-bg" />
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="absolute -inset-20 bg-accent/5 blur-[120px] rounded-full animate-pulse" />
              <div className="relative z-10 technical-border bg-base p-12 overflow-hidden group hover-glow transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 mono-label text-accent/20 group-hover:text-accent transition-colors">ENGINE_CORE_V4</div>
                <div className="flex items-center gap-4 mb-12">
                  <div className="p-2 border border-accent/30 bg-accent/5">
                    <Search className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">NEURAL_WORKFLOW_ENGINE</h3>
                </div>
                
                <div className="space-y-12">
                  {[
                    { title: "Intelligent Triage", desc: "Automatically scores leads based on historical project success data and budget alignment.", stat: "98.2% ACCURACY", code: "TR_01" },
                    { title: "Contextual Proposal Gen", desc: "Crafted-intent proposal generation that matches your past work to each new client effectively.", stat: "INSTANT_GEN", code: "PG_02" },
                    { title: "Biometric Scheduling", desc: "The engine schedules meetings during your peak-energy hours based on biometric inputs.", stat: "SYNCED", code: "BS_03" },
                  ].map((item, i) => (
                    <div key={i} className="group/item">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-px w-8 bg-border group-hover/item:w-12 group-hover/item:bg-accent transition-all" />
                        <h4 className="font-bold uppercase tracking-tight text-sm group-hover/item:text-accent transition-colors">{item.title}</h4>
                        <span className="mono-label text-[8px] ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity">{item.stat}</span>
                      </div>
                      <p className="pl-12 text-[11px] text-text-muted leading-relaxed mb-2">{item.desc}</p>
                      <div className="pl-12 flex gap-4">
                        <span className="text-[8px] font-mono text-accent/40 uppercase">MODULE: {item.code}</span>
                        <span className="text-[8px] font-mono text-accent/40 uppercase">LATENCY: 4ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-1 w-8 bg-accent" />
                <span className="mono-label text-accent">ENGINE_ARCHITECTURE</span>
              </div>
              <h2 className="text-5xl font-bold uppercase tracking-tight leading-[0.9] md:text-7xl">THE <br /> <span className="glow-text">SILENT</span> <br /> PARTNER</h2>
              <p className="text-text-secondary leading-relaxed max-w-md border-l border-border pl-6">
                Our proprietary automation layer connects every aspect of your business, 
                ensuring nothing falls through the cracks while you sleep.
              </p>
              
              <div className="pt-8 border-t border-border grid grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-sm border border-border flex items-center justify-center group hover:border-accent transition-colors">
                    <ArrowUpRight className="h-4 w-4 text-text-disabled group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-tight">Deterministic Scaling</div>
                    <div className="text-[9px] font-mono text-text-muted">Zero-latency execution.</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-sm border border-border flex items-center justify-center group hover:border-accent transition-colors">
                    <Zap className="h-4 w-4 text-text-disabled group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-tight">Neural Sync</div>
                    <div className="text-[9px] font-mono text-text-muted">Real-time learning.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-32 border-b border-border relative">
        <div className="absolute inset-0 z-0 opacity-10 grid-pattern" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-accent" />
              <span className="mono-label text-accent">USER_PROFILES</span>
              <div className="h-px w-8 bg-accent" />
            </div>
            <h2 className="text-4xl font-bold uppercase tracking-tight md:text-6xl">ENGINEERED FOR <br /><span className="text-accent">ELITE TALENT</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {[
              { title: "Developers", desc: "Automate technical scoping.", img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600", code: "DEV_MODE_01" },
              { title: "Designers", desc: "Seamless visual approvals.", img: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=600", code: "VIS_MODE_02" },
              { title: "Marketers", desc: "Campaign ROI dashboard.", img: "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=600", code: "MKT_MODE_03" },
              { title: "Agencies", desc: "Multi-talent operations.", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600", code: "AGN_MODE_04" },
            ].map((persona) => (
              <div key={persona.title} className="group relative aspect-[3/4] overflow-hidden bg-base cursor-crosshair hover-glow transition-all duration-300">
                <img 
                  src={persona.img} 
                  alt={persona.title} 
                  className="h-full w-full object-cover opacity-10 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-40 group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
                <div className="absolute top-4 right-4 mono-label text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">{persona.code}</div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <div className="h-px w-12 bg-accent mb-6 group-hover:w-full transition-all duration-700" />
                  <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-accent transition-colors">{persona.title}</h3>
                  <p className="mt-2 text-[10px] text-text-muted font-mono uppercase tracking-widest">{persona.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-surface/50 relative">
        <div className="noise-bg" />
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              { 
                quote: "The AI proposal engine alone saved me 15 hours last month. It captures my tone perfectly and my closing rate has jumped 30%.", 
                author: "Marcus Thorne", 
                role: "LEAD_DEV",
                id: "REF_001"
              },
              { 
                quote: "Lead analysis changed how I vet clients. I no longer waste time on discovery calls that aren't a fit. Truly my business concierge.", 
                author: "Elena Vance", 
                role: "MARKETING_STRAT",
                id: "REF_002"
              },
              { 
                quote: "The workflow efficiency is unparalleled. I'm managing twice the client load with half the stress. Crescent Black is essential.", 
                author: "Julian Reed", 
                role: "CREATIVE_DIR",
                id: "REF_003"
              },
            ].map((t, i) => (
              <div key={i} className="technical-border bg-base p-10 group hover:bg-elevated hover-glow transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 mono-label text-[8px] opacity-20">{t.id}</div>
                <div className="flex gap-1 mb-8">
                  {[1, 2, 3, 4, 5].map(s => <Zap key={s} className="h-3 w-3 fill-accent text-accent flicker" style={{ animationDelay: `${s * 0.1}s` }} />)}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed italic mb-10 relative z-10">"{t.quote}"</p>
                <div className="flex items-center gap-4 border-t border-border pt-8 relative z-10">
                  <div className="h-10 w-10 rounded-sm bg-elevated border border-border flex items-center justify-center font-mono text-[10px] text-accent">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-tight group-hover:text-accent transition-colors">{t.author}</div>
                    <div className="text-[10px] font-mono text-accent/60">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-48 text-center relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0 opacity-10 grid-pattern" />
        <div className="noise-bg" />
        <div className="container relative z-10 mx-auto px-6">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-accent" />
            <span className="mono-label text-accent">THE_LONG_VIEW</span>
            <div className="h-px w-12 bg-accent" />
          </div>
          <h2 className="text-5xl font-display font-bold leading-[0.9] md:text-9xl uppercase tracking-tighter">
            GLOBAL <br />
            <span className="glow-text italic">INDEPENDENCE.</span>
          </h2>
          <p className="mx-auto mt-12 max-w-2xl text-lg text-text-secondary leading-relaxed font-sans border-y border-border/30 py-8">
            Our vision is to empower every freelancer on earth with a digital brain that 
            handles the mundane, so they can focus on the masterpiece. We're building 
            the infrastructure for the next billion-dollar solopreneurs.
          </p>
          <div className="mt-12 flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="mono-label">EST_2024</span>
              <div className="h-1 w-1 bg-accent mt-2" />
            </div>
            <div className="flex flex-col items-center">
              <span className="mono-label">V_4.0_STABLE</span>
              <div className="h-1 w-1 bg-accent mt-2" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="technical-border bg-surface p-12 text-center md:p-24 overflow-hidden relative group">
            <div className="noise-bg" />
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-accent/10 blur-[120px] group-hover:bg-accent/20 transition-colors" />
            <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="h-2 w-2 bg-accent animate-pulse" />
                <span className="mono-label text-accent">INITIALIZE_ONBOARDING</span>
              </div>
              <h2 className="text-4xl font-bold md:text-7xl uppercase tracking-tight leading-[0.9]">
                START RUNNING <br /><span className="glow-text">SMARTER.</span>
              </h2>
              <p className="mt-8 text-text-secondary max-w-md mx-auto font-mono text-xs uppercase tracking-widest">
                Join 10,000+ elite freelancers who've automated their way to freedom.
              </p>
              
              <div className="mt-12 flex flex-wrap justify-center gap-6">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => navigate(ROUTES.AUTH)}
                  className="px-12 font-bold uppercase tracking-widest text-[11px] technical-border shadow-glow"
                >
                  Create Account
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(ROUTES.AUTH)}
                  className="px-12 font-bold uppercase tracking-widest text-[11px] border-border hover:border-accent transition-colors"
                >
                  Platform Docs
                </Button>
              </div>

              <div className="mt-16 flex justify-center gap-12 border-t border-border/30 pt-12">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono">
                    <Counter value={10} suffix="K+" />
                  </span>
                  <span className="mono-label">USERS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono">
                    <Counter value={50} suffix="M+" />
                  </span>
                  <span className="mono-label">PROCESSED</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono">
                    <Counter value={24} suffix="/7" />
                  </span>
                  <span className="mono-label">UPTIME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-sm bg-accent shadow-glow" />
                <span className="text-sm font-display font-bold tracking-tight uppercase">{APP_NAME}</span>
              </div>
              <p className="mt-6 text-sm text-text-muted leading-relaxed">
                The elegant automation layer for the world's most talented independents.
              </p>
            </div>
            
            <div>
              <h4 className="mono-label mb-6">Features</h4>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-accent transition-colors">AI Analyzer</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Workflows</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Reviews</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mono-label mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-accent transition-colors">Vision</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Terms</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mono-label mb-6">Subscribe to The Midnight Brief</h4>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="email@address.com" 
                  className="flex-1 rounded-sm border border-border bg-base px-4 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <Button variant="gold" size="sm" className="px-4 font-bold uppercase tracking-widest text-[10px]">Join</Button>
              </div>
            </div>
          </div>
          
          <div className="mt-20 border-t border-border pt-8 text-center text-[10px] text-text-disabled uppercase tracking-widest">
            © 2026 Crescent Black. Redefining the modern freelance economy. Built for the machine.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
