import { useEffect, useRef } from 'react'
import L from 'leaflet'

// Fix for default marker icon issue in Leaflet with Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function Map({ onCountryClick }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const countryLayersRef = useRef({})
  const overlayRef = useRef(null)
  const countryAreasRef = useRef({})
  const indonesiaDataRef = useRef(null)

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [-0.7893, 113.9213],
        zoom: 3,
        minZoom: 2,
        maxZoom: 10,
        doubleClickZoom: true,
        dragging: true,
        scrollWheelZoom: true
      })
      
      // Prevent click events on map from interfering
      mapInstanceRef.current.on('click', (e) => {
        // Only handle if clicking on empty space (not a country)
        console.log('Map clicked (empty space)')
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)
      
      // Disable click on tile layer to allow map interactions
      mapInstanceRef.current.on('click', function(e) {
        // This only fires if no country was clicked (event propagation was stopped)
        // So we can safely ignore empty map clicks
      })

      // Load data and add countries
      loadData()
    }

    // Reset function for global access
    window.mapReset = () => {
      hideComparison()
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [])

  const loadData = async () => {
    try {
      // Load country areas
      const areasResponse = await fetch('/data/country-areas.json')
      countryAreasRef.current = await areasResponse.json()

      // Load countries data
      const countriesResponse = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      const countriesData = await countriesResponse.json()

      console.log('Loaded countries:', countriesData.features.length)

      // Find Indonesia
      indonesiaDataRef.current = countriesData.features.find(
        feature => feature.properties.NAME === 'Indonesia'
      )

      if (indonesiaDataRef.current) {
        console.log('Indonesia data found:', indonesiaDataRef.current.properties.NAME)
      } else {
        console.error('Indonesia not found in countries data')
      }

      // Add countries to map
      addCountryBoundaries(countriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addCountryBoundaries = (countriesData) => {
    const countryLayer = L.geoJSON(countriesData, {
      style: (feature) => {
        const name = feature.properties.NAME
        return {
          fillColor: name === 'Indonesia' ? '#ff4444' : '#ffffff',
          fillOpacity: name === 'Indonesia' ? 0.7 : 0.3,
          color: '#000000',
          weight: 1,
          opacity: 0.8
        }
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties.NAME
        
        // Store layer reference
        countryLayersRef.current[name] = layer
        
        // Add tooltip
        layer.bindTooltip(name, {
          permanent: false,
          direction: 'center',
          className: 'country-tooltip'
        })
        
        // Click handler - only for countries, not map
        layer.on('click', (e) => {
          // Stop event from bubbling to map
          if (e.originalEvent) {
            e.originalEvent.stopPropagation()
            e.originalEvent.preventDefault()
          }
          L.DomEvent.stopPropagation(e)
          handleCountryClick(name, feature)
        })
        
        // Prevent map dragging when clicking country
        layer.on('mousedown', (e) => {
          if (e.originalEvent) {
            e.originalEvent.stopPropagation()
          }
          L.DomEvent.stopPropagation(e)
        })
        
        // Hover effects
        layer.on('mouseover', function() {
          this.setStyle({
            fillOpacity: 0.6,
            weight: 2
          })
        })
        
        layer.on('mouseout', function() {
          const isIndonesia = name === 'Indonesia'
          this.setStyle({
            fillColor: isIndonesia ? '#ff4444' : '#ffffff',
            fillOpacity: isIndonesia ? 0.7 : 0.3,
            weight: 1
          })
        })
      }
    }).addTo(mapInstanceRef.current)
  }

  const handleCountryClick = (countryName, countryFeature) => {
    console.log('Country clicked:', countryName)
    
    if (countryName === 'Indonesia') {
      hideComparison()
      return
    }

    showIndonesiaOverlay(countryName, countryFeature)
    
    // Calculate and show comparison
    const indonesiaArea = countryAreasRef.current['Indonesia']
    const otherArea = countryAreasRef.current[countryName]

    console.log('Areas - Indonesia:', indonesiaArea, 'Other:', otherArea)

    if (indonesiaArea && otherArea) {
      const ratio = indonesiaArea / otherArea
      const isBigger = ratio > 1
      onCountryClick(countryName, ratio, isBigger)
    } else {
      console.warn('Missing area data for comparison')
      onCountryClick(countryName, null, null)
    }
  }

  const showIndonesiaOverlay = (countryName, countryFeature) => {
    console.log('Showing overlay for:', countryName)
    
    // Remove previous overlay
    if (overlayRef.current) {
      mapInstanceRef.current.removeLayer(overlayRef.current)
      overlayRef.current = null
    }

    if (!indonesiaDataRef.current) {
      console.error('Indonesia data not loaded')
      return
    }

    const indonesiaArea = countryAreasRef.current['Indonesia']
    const countryArea = countryAreasRef.current[countryName]

    if (!indonesiaArea || !countryArea) {
      console.warn('Area data missing:', { indonesiaArea, countryArea })
      return
    }

    const scaleFactor = Math.sqrt(countryArea / indonesiaArea)
    console.log('Scale factor:', scaleFactor)

    // Get country center using the feature's geometry directly
    const countryGeoJSON = L.geoJSON(countryFeature)
    const countryBounds = countryGeoJSON.getBounds()
    const countryCenter = countryBounds.getCenter()

    // Get Indonesia center
    const indonesiaGeoJSON = L.geoJSON(indonesiaDataRef.current)
    const indonesiaBounds = indonesiaGeoJSON.getBounds()
    const indonesiaCenter = indonesiaBounds.getCenter()

    console.log('Country center:', countryCenter)
    console.log('Indonesia center:', indonesiaCenter)

    // Scale and translate Indonesia geometry
    const scaledIndonesia = scaleAndTranslateGeoJSON(
      indonesiaDataRef.current,
      scaleFactor,
      countryCenter,
      indonesiaCenter
    )

    console.log('Scaled Indonesia created')

    // Create overlay with proper z-index
    overlayRef.current = L.geoJSON(scaledIndonesia, {
      style: {
        fillColor: '#ff0000',
        fillOpacity: 0.7,
        color: '#ff0000',
        weight: 4,
        opacity: 1.0
      }
    }).addTo(mapInstanceRef.current)

    // Bring overlay to front
    overlayRef.current.bringToFront()

    // Highlight clicked country
    const clickedLayer = countryLayersRef.current[countryName]
    if (clickedLayer) {
      clickedLayer.setStyle({
        fillOpacity: 0.5,
        weight: 2
      })
      clickedLayer.bringToFront()
    }

    console.log('Overlay added to map')
  }

  const scaleAndTranslateGeoJSON = (geojson, scale, targetCenter, sourceCenter) => {
    const scaled = JSON.parse(JSON.stringify(geojson))

    const processCoordinates = (coords) => {
      if (Array.isArray(coords[0]) && !Array.isArray(coords[0][0])) {
        // Array of coordinate pairs
        return coords.map(processCoordinates)
      }
      
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        // Nested arrays (MultiPolygon)
        return coords.map(poly => poly.map(processCoordinates))
      }

      // Single coordinate pair [lon, lat]
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const lon = coords[0]
        const lat = coords[1]
        
        // Calculate offset from source center
        const dLon = lon - sourceCenter.lng
        const dLat = lat - sourceCenter.lat
        
        // Scale the offset
        const scaledDLon = dLon * scale
        const scaledDLat = dLat * scale
        
        // Translate to target center
        const newLon = targetCenter.lng + scaledDLon
        const newLat = targetCenter.lat + scaledDLat
        
        return [newLon, newLat]
      }

      return coords
    }

    if (scaled.geometry.type === 'Polygon') {
      scaled.geometry.coordinates = scaled.geometry.coordinates.map(ring => 
        ring.map(coord => processCoordinates(coord))
      )
    } else if (scaled.geometry.type === 'MultiPolygon') {
      scaled.geometry.coordinates = scaled.geometry.coordinates.map(polygon =>
        polygon.map(ring =>
          ring.map(coord => processCoordinates(coord))
        )
      )
    }

    return scaled
  }

  const hideComparison = () => {
    if (overlayRef.current) {
      mapInstanceRef.current.removeLayer(overlayRef.current)
      overlayRef.current = null
    }

    Object.values(countryLayersRef.current).forEach(layer => {
      const name = layer.feature.properties.NAME
      const isIndonesia = name === 'Indonesia'
      layer.setStyle({
        fillColor: isIndonesia ? '#ff4444' : '#ffffff',
        fillOpacity: isIndonesia ? 0.7 : 0.3,
        weight: 1
      })
    })
  }

  return <div ref={mapRef} className="map" />
}
