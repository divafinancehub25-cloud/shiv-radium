import Link from "next/link";
import {
  TrendingUp, Shield, Users, Zap, ArrowRight, CheckCircle,
  Star, Globe, Lock, BarChart3, Gift, ChevronRight,
} from "lucide-react";

const stats = [
  { value: "₹50Cr+", label: "Assets Managed" },
  { value: "10,000+", label: "Active Investors" },
  { value: "18-24%", label: "Annual Returns" },
  { value: "99.9%", label: "Uptime" },
];

const features = [
  { icon: TrendingUp, title: "Smart Portfolio", desc: "AI-driven portfolio management with real-time tracking and automated rebalancing.", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
  { icon: Shield, title: "Bank-Grade Security", desc: "256-bit encryption, multi-factor authentication and full KYC verification.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: BarChart3, title: "Live Analytics", desc: "Executive dashboards, KPI monitoring and detailed financial reports at a glance.", color: "text-blue-400", bg: "bg-blue-400/10" },
  { icon: Users, title: "Referral Rewards", desc: "Earn points, badges and credits for every successful referral you bring in.", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: Gift, title: "Achievements", desc: "Unlock exclusive badges and tier upgrades as you grow your investment journey.", color: "text-pink-400", bg: "bg-pink-400/10" },
  { icon: Zap, title: "Instant Processing", desc: "Lightning-fast deposit and withdrawal processing with real-time notifications.", color: "text-orange-400", bg: "bg-orange-400/10" },
];

const steps = [
  { step: "01", title: "Create Account", desc: "Register in 2 minutes with your email and basic details." },
  { step: "02", title: "Complete KYC", desc: "Upload your documents for quick identity verification." },
  { step: "03", title: "Make First Deposit", desc: "Fund your portfolio with crypto — USDT, BTC and more." },
  { step: "04", title: "Watch it Grow", desc: "Track your returns live with our executive dashboard." },
];

const testimonials = [
  { name: "Rahul M.", city: "Mumbai", text: "Best investment platform I've used. Returns are consistently above 20%.", stars: 5 },
  { name: "Priya S.", city: "Delhi", text: "The referral program is incredible. Earned ₹50,000 just by inviting friends.", stars: 5 },
  { name: "Arjun K.", city: "Bangalore", text: "KYC was done in 24 hours. Dashboard is beautiful and easy to use.", stars: 5 },
];

export default function StickoLandingPage() {
  return (
    <div className="text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">STICKO</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Testimonials"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-white/50 hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/diva-app/login" className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors px-4 py-2">Login</Link>
            <Link href="/diva-app/register" className="text-sm font-semibold bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black px-5 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#D4AF37]/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-xs text-[#D4AF37] font-medium mb-8">
            <Star className="w-3 h-3 fill-[#D4AF37]" /> Trusted by 10,000+ investors across India
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Grow Your Wealth
            <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] bg-clip-text text-transparent">
              The Smart Way
            </span>
          </h1>

          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            STICKO Growth Capital is India's premium fintech investment platform offering 18-24% annual returns, real-time portfolio tracking, and institutional-grade security.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/diva-app/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black font-bold text-base hover:opacity-90 transition-opacity">
              Start Investing Today <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/diva-app/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/[0.1] text-white/70 font-medium text-base hover:bg-white/[0.04] transition-colors">
              Login to Dashboard
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
            {[
              { icon: Shield, text: "KYC Verified" },
              { icon: Lock, text: "256-bit Encrypted" },
              { icon: Globe, text: "Pan India" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2 text-white/30 text-xs">
                <b.icon className="w-3.5 h-3.5" /> {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] bg-clip-text text-transparent">{s.value}</p>
              <p className="text-white/40 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest mb-3">Why STICKO</p>
            <h2 className="text-4xl font-black">Everything You Need to <br className="hidden sm:block" />Invest Confidently</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white/[0.01] border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-4xl font-black">Start in 4 Easy Steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-5 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <span className="text-4xl font-black text-[#D4AF37]/20 shrink-0 leading-none">{s.step}</span>
                <div>
                  <h3 className="text-white font-bold mb-1">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl font-black">What Our Investors Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/30 text-xs">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-b from-[#D4AF37]/5 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/[0.03] to-transparent pointer-events-none" />
            <h2 className="text-4xl font-black mb-4 relative">Ready to Start Growing?</h2>
            <p className="text-white/50 mb-8 relative">Join thousands of smart investors on STICKO Growth Capital today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
              <Link href="/diva-app/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black font-bold hover:opacity-90 transition-opacity">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/diva-app/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white/60 hover:bg-white/[0.04] transition-colors">
                Login <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="font-bold text-white">STICKO Growth Capital</span>
          </div>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} STICKO Growth Capital. All rights reserved.</p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Support"].map((l) => (
              <a key={l} href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
