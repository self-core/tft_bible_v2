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
import { DetailedChampions } from './pages/DetailedChampions'
import { DetailedItems } from './pages/DetailedItems'

function App() {
  return (
      <ThemeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/compositions" element={<Compositions />} />
            <Route path="/compositions/:id" element={<CompositionDetail />} />
            <Route path="/champions" element={<Champions />} />
            <Route path="/items" element={<Items />} />
            <Route path="/augments" element={<Augments />} />
            <Route path="/asset-test" element={<AssetTestPage />} />
            <Route path="/detailed-champions" element={<DetailedChampions />} />
            <Route path="/detailed-items" element={<DetailedItems />} />
            <Route path="/team-builder" element={<TeamBuilder />} />
            <Route path="/patch-notes" element={<PatchNotes />} />
            <Route path="/theme-test" element={<ThemeTestPage />} />
            <Route path="/board-test" element={<BoardTestPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ThemeProvider>
  )
}

export default App