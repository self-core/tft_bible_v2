import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Compositions from './pages/Compositions'
import CompositionDetail from './pages/CompositionDetail'
import Champions from './pages/Champions'
import Items from './pages/Items'
import PatchNotes from './pages/PatchNotes'
import TeamBuilder from './pages/TeamBuilder'
import Augments from './pages/Augments'
import AssetTestPage from './pages/AssetTestPage'
import ThemeTestPage from './pages/ThemeTestPage'
import BoardTestPage from './pages/BoardTestPage'
import NotFound from './pages/NotFound'
import RiotProfile from './pages/RiotProfile'
import SummonerSearch from './pages/SummonerSearch'
import CustomBuilder from './components/Builder/CustomBuilder'

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
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compositions" element={<Compositions />} />
          <Route path="/compositions/:id" element={<CompositionDetail />} />
          <Route path="/champions" element={<Champions />} />
          <Route path="/items" element={<Items />} />
          <Route path="/summoner-search" element={<SummonerSearch />} />
          <Route path="/riot-profile/:puuid" element={<RiotProfile />} />
          <Route path="/builder" element={<CustomBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </QueryClientProvider>
  )
}

export default App