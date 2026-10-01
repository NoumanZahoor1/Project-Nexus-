import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Breadcrumbs from '../common/Breadcrumbs'
import PageTransition from '../common/PageTransition'

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">
        <Navbar onMenuClick={() => setSidebarOpen(v => !v)} />
        <div className="app-content">
          <Breadcrumbs />
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
