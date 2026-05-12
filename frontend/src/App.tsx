import { Routes, Route } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { ThemeProvider } from './contexts/ThemeContext'
import { apolloClient } from './lib/apolloClient'
import Layout from './components/Layout'
import Home from './pages/Home'
import Compositions from './pages/Compositions'
import CompositionDetail from './pages/CompositionDetail'
import Champions from './pages/Champions'
import Items from './pages/Items'
import Traits from './pages/Traits'
import PatchNotes from './pages/PatchNotes'
import TeamBuilderPage from './pages/TeamBuilder'
import Augments from './pages/Augments'
import AssetTestPage from './pages/AssetTestPage'
import ThemeTestPage from './pages/ThemeTestPage'
import BoardTestPage from './pages/BoardTestPage'
import NotFound from './pages/NotFound'
import ImprovedTeamBuilder from './pages/ImprovedTeamBuilder';
import SetDetail from './pages/SetDetail'
import TraitTrackerPage from './pages/TraitTrackerPage'
import SetPatchInfoPage from './pages/SetPatchInfoPage'

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/compositions" element={<Compositions />} />
            <Route path="/compositions/:id" element={<CompositionDetail />} />
            <Route path="/champions" element={<Champions />} />
            <Route path="/items" element={<Items />} />
            <Route path="/traits" element={<Traits />} />
            <Route path="/augments" element={<Augments />} />
            <Route path="/builder" element={<ImprovedTeamBuilder />} />
            <Route path="/trait-tracker" element={<TraitTrackerPage />} />
            <Route path="/sets-info" element={<SetPatchInfoPage />} />
            <Route path="/sets/:setId" element={<SetDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </ApolloProvider>
  )
}

export default App