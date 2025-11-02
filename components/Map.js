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
  // Ensure onCountryClick is a function
  const safeOnCountryClick = typeof onCountryClick === 'function' ? onCountryClick : () => {
    console.warn('onCountryClick callback not provided')
  }
  
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const countryLayersRef = useRef({})
  const overlayRef = useRef(null)
  const countryAreasRef = useRef({})
  const indonesiaDataRef = useRef(null)

  useEffect(() => {
    // Ensure mapRef is available
    if (!mapRef.current) {
      console.error('Map ref not available')
      return
    }
    
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
      console.log('Starting data load...')
      
      // Load country areas
      console.log('Fetching country areas...')
      const areasResponse = await fetch('/data/country-areas.json')
      if (!areasResponse || !areasResponse.ok) {
        throw new Error(`Failed to load country areas: ${areasResponse?.status || 'unknown'}`)
      }
      const areasData = await areasResponse.json()
      if (!areasData || typeof areasData !== 'object' || Array.isArray(areasData)) {
        throw new Error('Invalid country areas data format')
      }
      countryAreasRef.current = areasData || {}
      const areaKeys = countryAreasRef.current ? Object.keys(countryAreasRef.current) : []
      console.log('Country areas loaded:', areaKeys.length || 0)

      // Load countries data - use direct GeoJSON source
      console.log('Fetching countries GeoJSON...')
      
      // Use a reliable GeoJSON source
      const countriesResponse = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      if (!countriesResponse || !countriesResponse.ok) {
        throw new Error(`Failed to load countries: ${countriesResponse?.status || 'unknown'}`)
      }
      const countriesData = await countriesResponse.json()

      console.log('Countries data received:', !!countriesData)
      console.log('Countries data type:', countriesData?.type || 'unknown')
      
      // Validate data structure step by step
      if (!countriesData) {
        throw new Error('Countries data is null or undefined')
      }
      
      if (typeof countriesData !== 'object' || Array.isArray(countriesData)) {
        throw new Error('Countries data is not a valid object')
      }
      
      const features = countriesData?.features
      console.log('Features exists?', !!features)
      console.log('Features type:', Array.isArray(features) ? 'array' : typeof features)
      
      if (!features) {
        throw new Error('No features property in countries data. Available keys: ' + Object.keys(countriesData || {}).join(', '))
      }
      
      if (!Array.isArray(features)) {
        throw new Error('Features is not an array. Type: ' + typeof features)
      }
      
      const featuresLength = features ? features.length : 0
      if (featuresLength === 0) {
        throw new Error('Features array is empty')
      }

      console.log('✅ Created GeoJSON with', featuresLength, 'features')

      // Find Indonesia - safely
      if (Array.isArray(features) && features.length > 0) {
        indonesiaDataRef.current = features.find(
          feature => feature && feature.properties && (
            feature.properties.NAME === 'Indonesia' || 
            feature.properties.name === 'Indonesia' ||
            feature.properties.NAME_EN === 'Indonesia'
          )
        )

        if (indonesiaDataRef.current) {
          console.log('✅ Indonesia data found:', indonesiaDataRef.current.properties)
        } else {
          console.error('❌ Indonesia not found in countries data')
          const sampleNames = features.slice(0, Math.min(10, features.length))
            .map(f => f?.properties?.NAME || f?.properties?.name || f?.properties?.NAME_EN || 'Unknown')
            .filter(n => n !== 'Unknown')
          console.log('Available country names (first 10):', sampleNames)
        }
      } else {
        console.error('❌ Features array is invalid for Indonesia search')
      }

      // Create proper GeoJSON object
      const geoJsonData = {
        type: 'FeatureCollection',
        features: features
      }

      // Add countries to map
      console.log('Adding countries to map...')
      addCountryBoundaries(geoJsonData)
      console.log('✅ Countries added to map')
    } catch (error) {
      console.error('❌ Error loading data:', error)
      if (error && typeof error === 'object') {
        console.error('Error message:', error.message || 'Unknown error')
        console.error('Error stack:', error.stack || 'No stack trace')
        console.error('Error name:', error.name || 'Unknown')
      } else {
        console.error('Error value:', error)
      }
      // Don't crash the app - just log the error
    }
  }

  const addCountryBoundaries = (countriesData) => {
    if (!countriesData || !countriesData.features || !Array.isArray(countriesData.features)) {
      console.error('❌ Invalid countries data structure:', countriesData)
      return
    }
    
    console.log('Creating GeoJSON layer with', countriesData.features.length, 'countries')
    
    if (!mapInstanceRef.current) {
      console.error('❌ Map instance not available!')
      return
    }
    
    const countryLayer = L.geoJSON(countriesData, {
      style: (feature) => {
        const name = feature.properties?.NAME || 
                     feature.properties?.name || 
                     feature.properties?.NAME_EN ||
                     feature.properties?.NAME_LONG ||
                     ''
        return {
          fillColor: name === 'Indonesia' ? '#ff4444' : '#ffffff',
          fillOpacity: name === 'Indonesia' ? 0.7 : 0.3,
          color: '#000000',
          weight: 1,
          opacity: 0.8
        }
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties?.NAME || 
                     feature.properties?.name || 
                     feature.properties?.NAME_EN ||
                     feature.properties?.NAME_LONG ||
                     'Unknown'
        
        if (!name || name === 'Unknown') {
          console.warn('Country without name:', feature.properties)
        }
        
        // Store layer reference
        countryLayersRef.current[name] = layer
        
        // Only log first few to avoid console spam
        const countryIndex = Object.keys(countryLayersRef.current).length - 1
        if (countryIndex < 5) {
          console.log(`Processing country ${countryIndex}: ${name}`)
        }
        
        // Ensure layer is interactive (clickable)
        if (layer.setInteractive) {
          layer.setInteractive(true)
        }
        
        // Add tooltip
        layer.bindTooltip(name, {
          permanent: false,
          direction: 'center',
          className: 'country-tooltip'
        })
        
        // Track if this was a drag or click
        let isDragging = false
        let mouseDownPos = null
        
        layer.on('mousedown', (e) => {
          isDragging = false
          if (e.originalEvent) {
            mouseDownPos = {
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY
            }
            // Stop map dragging when clicking on country
            L.DomEvent.stopPropagation(e)
          }
        })
        
        layer.on('mousemove', (e) => {
          if (mouseDownPos && e.originalEvent) {
            const moved = Math.abs(e.originalEvent.clientX - mouseDownPos.x) > 3 ||
                         Math.abs(e.originalEvent.clientY - mouseDownPos.y) > 3
            if (moved) {
              isDragging = true
            }
          }
        })
        
        // Single click handler for countries
        layer.on('click', (e) => {
          console.log(`🔵 Click event fired on: ${name}`, e)
          
          // Only handle if it wasn't a drag
          if (isDragging) {
            console.log('Ignored drag on country:', name)
            return
          }
          
          // Stop event from reaching map
          L.DomEvent.stopPropagation(e)
          L.DomEvent.preventDefault(e)
          if (e.originalEvent) {
            e.originalEvent.stopPropagation()
            e.originalEvent.preventDefault()
          }
          
          console.log('✅ Country clicked:', name)
          handleCountryClick(name, feature)
        })
        
        // Test if layer is actually clickable
        console.log(`Layer for ${name} created, interactive:`, layer.options?.interactive !== false)
        
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
    })
    
    console.log('GeoJSON layer created, adding to map...')
    countryLayer.addTo(mapInstanceRef.current)
    console.log('✅ GeoJSON layer added to map')
    
    const layerKeys = countryLayersRef.current ? Object.keys(countryLayersRef.current) : []
    console.log('Country layers stored:', layerKeys.length)
    if (layerKeys.length > 0) {
      console.log('Sample countries:', layerKeys.slice(0, 5))
    }
    
    // Verify layers are on the map
    setTimeout(() => {
      const mapLayers = mapInstanceRef.current._layers
      let geoJsonLayerCount = 0
      for (let id in mapLayers) {
        if (mapLayers[id] instanceof L.GeoJSON) {
          geoJsonLayerCount++
        }
      }
      console.log('GeoJSON layers on map:', geoJsonLayerCount)
    }, 1000)
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
      safeOnCountryClick(countryName, ratio, isBigger)
    } else {
      console.warn('Missing area data for comparison')
      safeOnCountryClick(countryName, null, null)
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
    if (overlayRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(overlayRef.current)
      overlayRef.current = null
    }

    if (!countryLayersRef.current) return
    
    Object.values(countryLayersRef.current).forEach(layer => {
      if (!layer || !layer.feature || !layer.feature.properties) return
      
      const name = layer.feature.properties.NAME || 
                   layer.feature.properties.name ||
                   layer.feature.properties.NAME_EN ||
                   ''
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
