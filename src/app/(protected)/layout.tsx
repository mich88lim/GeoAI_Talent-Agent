import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Server-side guard: only active users reach protected routes.
// The middleware handles the redirect for most cases, but this adds
// a server-component layer of protection for the route group.
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

  return <>{children}</>
}
