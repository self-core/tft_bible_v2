import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Compositions from './pages/Compositions'
import CompositionDetail from './pages/CompositionDetail'
import Champions from './pages/Champions'
import Items from './pages/Items'
import PatchNotes from './pages/PatchNotes'
import TeamBuilder from './pages/TeamBuilder'
import ThemeTestPage from './pages/ThemeTestPage'
import BoardTestPage from './pages/BoardTestPage'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/compositions" element={<Compositions />} />
            <Route path="/compositions/:id" element={<CompositionDetail />} />
            <Route path="/team-builder" element={<TeamBuilder />} />
            <Route path="/champions" element={<Champions />} />
            <Route path="/items" element={<Items />} />
            <Route path="/patch-notes" element={<PatchNotes />} />
            <Route path="/theme-test" element={<ThemeTestPage />} />
            <Route path="/board-test" element={<BoardTestPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App