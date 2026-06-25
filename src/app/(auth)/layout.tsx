// Split-screen auth layout: left navy hero + right white form panel
import Image from 'next/image'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left hero panel ──────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-5/12 flex-col justify-between bg-ink-navy px-10 py-12">
        {/* Background decorative gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 30% 60%, #1E63C4 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, #12B5AC 0%, transparent 50%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/logo_dark.svg"
            alt="GEO-TALENT AGENT"
            width={200}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </div>

        {/* Centre copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal/20 px-3 py-1 text-xs font-medium text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              JPN Sarawak · ICT Unit
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight text-white">
              Geospatial Master Trainer Recommendation Platform
            </h1>
            <p className="text-sm leading-relaxed text-white/70">
              Intelligently map teacher expertise across Sarawak and recommend the right Master Trainers for every training engagement.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2">
            {['Interactive map', 'Smart matching', 'Travel estimates', 'Bilingual'].map(f => (
              <span
                key={f}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-xs text-white/40">
          Ministry of Education Malaysia · Sarawak State Education Department
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Image
              src="/logo_horizontal.svg"
              alt="GEO-TALENT AGENT"
              width={160}
              height={36}
              className="h-8 w-auto"
            />
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-16">
          <div className="w-full max-w-sm animate-fade-in">{children}</div>
        </div>
      </div>
    </div>
  )
}
