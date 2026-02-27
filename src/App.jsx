import useVoiceDiary from './hooks/useVoiceDiary'
import RoleSelectionView from './views/RoleSelectionView'
import ElderlyView from './views/ElderlyView'
import RelativeView from './views/RelativeView'
import { SyncingOverlay, AuthLoadingScreen } from './components/SharedUI'

function App() {
  const state = useVoiceDiary()

  // Show loading while Firebase auth initializes
  if (!state.authReady) return <AuthLoadingScreen />

  // Determine which view to render
  const renderView = () => {
    const { currentView } = state

    if (currentView === 'ROLE_SELECTION') {
      return <RoleSelectionView onSelectRole={state.handleRoleSelect} />
    }

    if (currentView.startsWith('ELDERLY_')) {
      return <ElderlyView state={state} />
    }

    if (currentView.startsWith('RELATIVE_')) {
      return <RelativeView state={state} />
    }

    return <RoleSelectionView onSelectRole={state.handleRoleSelect} />
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-background-light shadow-2xl relative overflow-x-hidden">
      <SyncingOverlay show={state.isSyncing} />
      <div key={state.currentView} className="animate-fadeIn">
        {renderView()}
      </div>
    </div>
  )
}

export default App
