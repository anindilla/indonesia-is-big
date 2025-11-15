import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), { ssr: false })

const INDONESIA_FACTS = [
  { label: 'Total Islands', value: '17,000+' },
  { label: 'Coastline', value: '~54,700 km' },
  { label: 'Total Area', value: '1.9 million km²' },
  { label: 'Population', value: '276 million+' }
]

const HISTORY_LIMIT = 4

export default function Home() {
  const [comparisonText, setComparisonText] = useState('Click any country to compare its size with Indonesia')
  const [showComparison, setShowComparison] = useState(false)
  const [history, setHistory] = useState([])

  const buildComparisonMessage = (countryName, ratio, isBigger) => {
    if (countryName && Number.isFinite(ratio) && ratio > 0) {
      if (isBigger && ratio > 1) {
        return `Indonesia is ${ratio.toFixed(1)} times bigger than ${countryName}`
      }
      if (!isBigger && ratio > 0) {
        return `Indonesia is ${(1 / ratio).toFixed(1)} times smaller than ${countryName}`
      }
    }
    return `No area data available for ${countryName || 'this country'}`
  }

  const handleCountryClick = (countryName, ratio, isBigger) => {
    try {
      const message = buildComparisonMessage(countryName, ratio, isBigger)
      setComparisonText(message)
      setShowComparison(true)
      if (countryName) {
        setHistory(prev => {
          const filtered = prev.filter(item => item.country !== countryName)
          const updated = [{ 
            country: countryName, 
            detail: message, 
            timestamp: Date.now() 
          }, ...filtered]
          return updated.slice(0, HISTORY_LIMIT)
        })
      }
    } catch (error) {
      console.error('Error in handleCountryClick:', error)
      setComparisonText(`Error comparing with ${countryName || 'this country'}`)
    }
  }

  const handleReset = () => {
    setComparisonText('Click any country to compare its size with Indonesia')
    setShowComparison(false)
    // Reset map overlay
    if (window.mapReset) {
      window.mapReset()
    }
  }

  return (
    <div className="container">
      <Map onCountryClick={handleCountryClick} />
      
      <div className="ui-overlay">
        <div className="comparison-display">
          <h1>Indonesia is Big</h1>
          <h3>I promise it&apos;s bigger than it looks. Here&apos;s the proof.</h3>
          <p className="comparison-text">{comparisonText}</p>
        </div>

        <div className="fact-panel">
          <div className="fact-card">
            <p className="fact-label">Indonesia quick facts</p>
            <ul className="fact-list">
              {INDONESIA_FACTS.map((fact) => (
                <li key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="history-card">
            <div className="history-header">
              <p>Recent comparisons</p>
              <span>Tap countries to build this list</span>
            </div>
            {history.length > 0 ? (
              <ul className="history-list">
                {history.map((item) => (
                  <li key={item.country}>
                    <div>
                      <strong>{item.country}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <span className="history-time">
                      {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="history-empty">No comparisons yet — click a country to start.</p>
            )}
          </div>
        </div>
        
        <div className="controls">
          <button id="reset-btn" onClick={handleReset}>Reset Comparison</button>
          <div className="instructions">
            <p>Click & drag to move the map</p>
            <p>Click any country to see Indonesia&apos;s size comparison</p>
          </div>
        </div>
      </div>
    </div>
  )
}
