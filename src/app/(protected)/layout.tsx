import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shell/AppShell'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role, full_name, ppd_district, preferred_language')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.status !== 'active') {
    redirect('/awaiting-approval')
  }

  return (
    <AppShell
      userName={profile.full_name ?? null}
      userRole={profile.role ?? 'user'}
    >
      {children}
    </AppShell>
  )
}
