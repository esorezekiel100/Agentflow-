import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AgentPage } from './pages/AgentPage'
import { AuthPage } from './pages/AuthPage'
import { BrowsePage } from './pages/BrowsePage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OpportunityDetailPage } from './pages/OpportunityDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { ReportOpportunityPage } from './pages/ReportOpportunityPage'
import { SubmitOpportunityPage } from './pages/SubmitOpportunityPage'
import { TrackerPage } from './pages/TrackerPage'

const AdminRoute = lazy(() => import('./pages/AdminRoute'))

function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [hash, key, pathname, search])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/auth" element={<Layout><AuthPage /></Layout>} />
        <Route path="/onboarding" element={<Layout><OnboardingPage /></Layout>} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="/tracker" element={<Layout><TrackerPage /></Layout>} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/agent" element={<Layout><AgentPage /></Layout>} />
        <Route path="/admin/*" element={<Suspense fallback={null}><AdminRoute /></Suspense>} />
        <Route path="/submit-opportunity" element={<Layout><SubmitOpportunityPage /></Layout>} />
        <Route path="/report/:slug" element={<Layout><ReportOpportunityPage /></Layout>} />
        <Route path="/opportunities" element={<Layout><BrowsePage /></Layout>} />
        <Route path="/category/:slug" element={<Layout><BrowsePage /></Layout>} />
        <Route path="/opportunity/:slug" element={<Layout><OpportunityDetailPage /></Layout>} />
        <Route path="*" element={<Layout><div className="mx-auto max-w-4xl px-4 py-16 text-center"><h1 className="text-3xl font-bold text-[#172234]">Page not found</h1><p className="mt-3 text-[#526172]">The page you are looking for does not exist.</p></div></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
