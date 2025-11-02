import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), { ssr: false })

export default function Home() {
  const [comparisonText, setComparisonText] = useState('Click any country to compare its size with Indonesia')
  const [showComparison, setShowComparison] = useState(false)

  const handleCountryClick = (countryName, ratio, isBigger) => {
    try {
      if (countryName && ratio !== null && ratio !== undefined && !isNaN(ratio) && isFinite(ratio) && ratio > 0) {
        if (isBigger && ratio > 1) {
          setComparisonText(`Indonesia is ${ratio.toFixed(1)} times bigger than ${countryName}`)
        } else if (!isBigger && ratio > 0) {
          setComparisonText(`Indonesia is ${(1/ratio).toFixed(1)} times smaller than ${countryName}`)
        } else {
          setComparisonText(`No area data available for ${countryName}`)
        }
      } else {
        setComparisonText(`No area data available for ${countryName || 'this country'}`)
      }
      setShowComparison(true)
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
