'use client'

import { Container, GlassButton } from '@/components/ui'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Repeat2,
  Settings,
  Sparkles,
  User,
  WalletCards,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/dashboard/recurring', label: 'Recurring', icon: Repeat2 },
  { href: '/dashboard/upcoming', label: 'Upcoming', icon: CalendarDays },
  { href: '/dashboard/budgets', label: 'Budgets', icon: WalletCards },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/affordability', label: 'Afford It?', icon: CircleHelp },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#FEFBFE]">
      {/* Top Bar - liquid glass */}
      <div className="sticky top-0 z-40 border-b border-white/70 bg-white/50 backdrop-blur-[34px] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_40px_rgba(31,45,90,0.1)]">
        <Container className="py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/finlo-logo-horizontal.png" alt="Finlo" width={140} height={47} className="object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </GlassButton>
          </div>
        </Container>
      </div>

      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex w-60 flex-col h-[calc(100vh-65px)] sticky top-[65px] border-r border-white/60 bg-white/65 backdrop-blur-xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.7)]">
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${pathname === item.href ? 'bg-[#0A193D]/12 text-[#0A193D] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]' : 'text-[#66718a] hover:bg-[#f1f4f9]'}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="m-4 rounded-xl bg-[#EEF1F8] p-3">
            <p className="text-xs font-bold text-[#0A193D]">Premium insights</p>
            <p className="mt-1 text-[11px] leading-4 text-[#707ba0]">Unlock deeper cash flow analytics.</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-0">
          {children}

          {/* Mobile Glass Navigation */}
          <div className="fixed left-3 right-3 bottom-3 z-40 md:hidden rounded-[26px] border border-white/65 bg-white/72 px-2 py-2 shadow-[0_14px_44px_rgba(31,45,90,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
            <div className="flex justify-around items-center">
              {navigation.slice(0, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-all duration-200 ${pathname === item.href ? 'bg-[#0A193D]/15 text-[#0A193D] shadow-[0_6px_16px_rgba(10,25,61,0.25)]' : 'text-[#8b95aa]'}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
