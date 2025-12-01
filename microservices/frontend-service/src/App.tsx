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
import PatchNotes from './pages/PatchNotes'
import TeamBuilder from './pages/TeamBuilder'
import Augments from './pages/Augments'
import AssetTestPage from './pages/AssetTestPage'
import ThemeTestPage from './pages/ThemeTestPage'
import BoardTestPage from './pages/BoardTestPage'
import NotFound from './pages/NotFound'
import CustomBuilder from './components/Builder/CustomBuilder'

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
            <Route path="/builder" element={<CustomBuilder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </ApolloProvider>
  )
}

export default App