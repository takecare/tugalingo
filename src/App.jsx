import Game from './components/Game'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>tugalingo</h1>
        <p>match the emoji to the Portuguese word</p>
      </header>
      <Game />
    </div>
  )
}

export default App
