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
        maxZoom: 10
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)

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

      // Find Indonesia
      indonesiaDataRef.current = countriesData.features.find(
        feature => feature.properties.NAME === 'Indonesia'
      )

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
        
        // Click handler
        layer.on('click', (e) => {
          e.originalEvent.stopPropagation()
          handleCountryClick(name, feature)
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
    if (countryName === 'Indonesia') {
      hideComparison()
      return
    }

    showIndonesiaOverlay(countryName, countryFeature)
    
    // Calculate and show comparison
    const indonesiaArea = countryAreasRef.current['Indonesia']
    const otherArea = countryAreasRef.current[countryName]

    if (indonesiaArea && otherArea) {
      const ratio = indonesiaArea / otherArea
      const isBigger = ratio > 1
      onCountryClick(countryName, ratio, isBigger)
    } else {
      onCountryClick(countryName, null, null)
    }
  }

  const showIndonesiaOverlay = (countryName, countryFeature) => {
    // Remove previous overlay
    if (overlayRef.current) {
      mapInstanceRef.current.removeLayer(overlayRef.current)
    }

    if (!indonesiaDataRef.current) {
      return
    }

    const indonesiaArea = countryAreasRef.current['Indonesia']
    const countryArea = countryAreasRef.current[countryName]

    if (!indonesiaArea || !countryArea) {
      return
    }

    const scaleFactor = Math.sqrt(countryArea / indonesiaArea)

    // Get country center
    const bounds = L.geoJSON(countryFeature).getBounds()
    const countryCenter = bounds.getCenter()

    // Get Indonesia center
    const indonesiaBounds = L.geoJSON(indonesiaDataRef.current).getBounds()
    const indonesiaCenter = indonesiaBounds.getCenter()

    // Scale and translate Indonesia geometry
    const scaledIndonesia = scaleAndTranslateGeoJSON(
      indonesiaDataRef.current,
      scaleFactor,
      countryCenter,
      indonesiaCenter
    )

    // Create overlay
    overlayRef.current = L.geoJSON(scaledIndonesia, {
      style: {
        fillColor: '#ff0000',
        fillOpacity: 0.6,
        color: '#ff0000',
        weight: 3,
        opacity: 0.9
      }
    }).addTo(mapInstanceRef.current)

    // Highlight clicked country
    const clickedLayer = countryLayersRef.current[countryName]
    if (clickedLayer) {
      clickedLayer.setStyle({
        fillOpacity: 0.5,
        weight: 2
      })
    }
  }

  const scaleAndTranslateGeoJSON = (geojson, scale, targetCenter, sourceCenter) => {
    const scaled = JSON.parse(JSON.stringify(geojson))

    const processCoordinates = (coords) => {
      if (Array.isArray(coords[0])) {
        return coords.map(processCoordinates)
      }

      const lat = coords[1] * Math.PI / 180
      const lon = coords[0] * Math.PI / 180

      const dLat = lat - (sourceCenter.lat * Math.PI / 180)
      const dLon = lon - (sourceCenter.lng * Math.PI / 180)

      const scaledDLat = dLat * scale
      const scaledDLon = dLon * scale

      const newLat = (targetCenter.lat * Math.PI / 180) + scaledDLat
      const newLon = (targetCenter.lng * Math.PI / 180) + scaledDLon

      return [newLon * 180 / Math.PI, newLat * 180 / Math.PI]
    }

    if (scaled.geometry.type === 'Polygon') {
      scaled.geometry.coordinates = scaled.geometry.coordinates.map(processCoordinates)
    } else if (scaled.geometry.type === 'MultiPolygon') {
      scaled.geometry.coordinates = scaled.geometry.coordinates.map(poly =>
        poly.map(processCoordinates)
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
