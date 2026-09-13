import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'Finlo | Personal Finance & Expense Management',
  description:
    'Finlo helps you track expenses, manage income, organize recurring bills, and understand your finances in one simple dashboard. A product by ELVA.',
  alternates: {
    canonical: 'https://finlo.site',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://finlo.site',
    title: 'Finlo | Personal Finance & Expense Management',
    description:
      'Finlo helps you track expenses, manage income, organize recurring bills, and understand your finances in one simple dashboard. A product by ELVA.',
    siteName: 'Finlo',
    images: [
      {
        url: 'https://finlo.site/finlo-app-icon-512.png',
        width: 512,
        height: 512,
        alt: 'Finlo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Finlo | Personal Finance & Expense Management',
    description:
      'Finlo helps you track expenses, manage income, organize recurring bills, and understand your finances in one simple dashboard. A product by ELVA.',
    images: ['https://finlo.site/finlo-app-icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default async function Home() {
  let hasUser = false
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    hasUser = Boolean(data.user)
  } catch {
    // If Supabase configuration is unavailable at build/runtime edge cases,
    // treat the visitor as public so the landing page always renders.
    hasUser = false
  }
  if (hasUser) redirect('/dashboard')
  return <LandingPage />
}