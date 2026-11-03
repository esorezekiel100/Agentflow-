import { lazy, useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { useNoIndex } from '../lib/seo'
import { AdminLoginPage } from './AdminLoginPage'

const AdminPage = lazy(() => import('./AdminPage'))

function NotFound() {
  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-[#172234]">Page not found</h1>
        <p className="mt-3 text-[#526172]">The page you are looking for does not exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-[#1f493b] px-5 py-3 text-sm font-semibold text-white">Go home</Link>
      </div>
    </Layout>
  )
}

export default function AdminRoute() {
  useNoIndex()
  const { pathname, key } = useLocation()
  const [authorization, setAuthorization] = useState<{ path: string; key: string; allowed: boolean } | null>(null)
  const [loginAuthorization, setLoginAuthorization] = useState<{ path: string; key: string; hasSession: boolean; isAdmin: boolean } | null>(null)

  useEffect(() => {
    let active = true
    if (pathname === '/admin/login') {
      if (!isSupabaseConfigured) {
        return () => { active = false }
      }

      const checkLoginAccess = async () => {
        try {
          const client = getSupabaseClient()
          const { data: { session }, error: sessionError } = await client.auth.getSession()
          if (sessionError) throw sessionError
          if (!session) {
            if (active) setLoginAuthorization({ path: pathname, key, hasSession: false, isAdmin: false })
            return
          }
          const { data, error } = await client.rpc('has_role', {
            _user_id: session.user.id,
            _role: 'admin',
          })
          if (error) throw error
          if (active) setLoginAuthorization({ path: pathname, key, hasSession: true, isAdmin: data === true })
        } catch (error) {
          console.error('Unable to verify admin login access:', error)
          if (active) setLoginAuthorization({ path: pathname, key, hasSession: true, isAdmin: false })
        }
      }
      void checkLoginAccess()
      return () => { active = false }
    }

    if (pathname !== '/admin' || !isSupabaseConfigured) {
      return () => { active = false }
    }

    const verifyAdmin = async () => {
      try {
        const client = getSupabaseClient()
        const { data: { session }, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (!session) {
          if (active) setAuthorization({ path: pathname, key, allowed: false })
          return
        }

        const { data, error } = await client.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin',
        })
        if (error) throw error
        if (active) setAuthorization({ path: pathname, key, allowed: data === true })
      } catch (error) {
        console.error('Unable to verify admin role:', error)
        if (active) setAuthorization({ path: pathname, key, allowed: false })
      }
    }

    void verifyAdmin()
    return () => { active = false }
  }, [key, pathname])

  if (pathname === '/admin/login') {
    if (!isSupabaseConfigured) return <AdminLoginPage />
    if (loginAuthorization?.path !== pathname || loginAuthorization.key !== key) {
      return <main className="grid min-h-screen place-items-center bg-[#111827] text-sm text-slate-300">Loading page...</main>
    }
    if (loginAuthorization.hasSession) {
      return loginAuthorization.isAdmin ? <Navigate to="/admin" replace /> : <NotFound />
    }
    return <AdminLoginPage />
  }

  if (pathname !== '/admin' || !isSupabaseConfigured || (authorization?.path === pathname && authorization.key === key && !authorization.allowed)) {
    return <NotFound />
  }

  if (authorization?.path !== pathname || authorization.key !== key || !authorization.allowed) {
    return <main className="grid min-h-screen place-items-center bg-[#111827] text-sm text-slate-300">Loading page...</main>
  }

  return (
    <section className="min-h-screen bg-[#111827] text-slate-100">
      <AdminPage />
    </section>
  )
}
