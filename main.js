// Indonesia Size Comparator using Leaflet.js (2D Map Approach)
class IndonesiaGlobe {
    constructor() {
        this.map = null;
        this.countryAreas = {};
        this.countriesData = null;
        this.indonesiaData = null;
        this.currentOverlay = null;
        this.countryLayers = {};
        
        this.init();
    }

    async init() {
        console.log('Initializing Indonesia Size Comparator with Leaflet.js...');
        await this.loadData();
        this.setupMap();
        this.addCountryBoundaries();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            console.log('Loading country areas...');
            const areasResponse = await fetch('data/country-areas.json');
            this.countryAreas = await areasResponse.json();
            console.log('Country areas loaded:', Object.keys(this.countryAreas).length);

            console.log('Loading countries data...');
            // Load Natural Earth countries data
            const countriesResponse = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
            this.countriesData = await countriesResponse.json();
            console.log('Countries data loaded:', this.countriesData.features.length);
            
            // Extract Indonesia data
            this.indonesiaData = this.countriesData.features.find(
                feature => feature.properties.NAME === 'Indonesia'
            );
            
            if (this.indonesiaData) {
                console.log('Indonesia found:', this.indonesiaData.properties.NAME);
            } else {
                console.warn('Indonesia not found in country data');
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    setupMap() {
        console.log('Setting up Leaflet map...');
        
        // Initialize map centered on Indonesia
        this.map = L.map('map', {
            center: [-0.7893, 113.9213],
            zoom: 3,
            minZoom: 2,
            maxZoom: 10
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        console.log('Map initialized');
    }

    addCountryBoundaries() {
        console.log('Adding country boundaries to map...');
        
        if (!this.countriesData) {
            console.error('Countries data not loaded');
            return;
        }

        // Create a GeoJSON layer for all countries
        this.countryLayer = L.geoJSON(this.countriesData, {
            style: (feature) => {
                const name = feature.properties.NAME;
                return {
                    fillColor: name === 'Indonesia' ? '#ff4444' : '#ffffff',
                    fillOpacity: name === 'Indonesia' ? 0.7 : 0.3,
                    color: '#000000',
                    weight: 1,
                    opacity: 0.8
                };
            },
            onEachFeature: (feature, layer) => {
                const name = feature.properties.NAME;
                
                // Store layer reference
                this.countryLayers[name] = layer;
                
                // Add tooltip with country name
                layer.bindTooltip(name, {
                    permanent: false,
                    direction: 'center',
                    className: 'country-tooltip'
                });
                
                // Add click handler
                layer.on('click', (e) => {
                    e.originalEvent.stopPropagation();
                    this.compareWithCountry(name, feature);
                });
                
                // Highlight on hover
                layer.on('mouseover', function() {
                    this.setStyle({
                        fillOpacity: 0.6,
                        weight: 2
                    });
                });
                
                layer.on('mouseout', function() {
                    const isIndonesia = name === 'Indonesia';
                    this.setStyle({
                        fillColor: isIndonesia ? '#ff4444' : '#ffffff',
                        fillOpacity: isIndonesia ? 0.7 : 0.3,
                        weight: 1
                    });
                });
            }
        }).addTo(this.map);
        
        console.log('Country boundaries added');
    }

    compareWithCountry(countryName, countryFeature) {
        console.log('Comparing Indonesia with:', countryName);
        
        // Skip if clicking on Indonesia itself
        if (countryName === 'Indonesia') {
            this.hideComparison();
            return;
        }
        
        // Show Indonesia overlay on this country
        this.showIndonesiaOverlay(countryName, countryFeature);
        
        // Show size comparison
        this.showComparison(countryName);
    }

    showIndonesiaOverlay(countryName, countryFeature) {
        console.log('Showing Indonesia overlay on:', countryName);
        
        // Remove previous overlay
        if (this.currentOverlay) {
            this.map.removeLayer(this.currentOverlay);
        }
        
        if (!this.indonesiaData) {
            console.error('Indonesia data not available');
            return;
        }
        
        // Calculate scale factor based on area ratio
        const indonesiaArea = this.countryAreas['Indonesia'];
        const countryArea = this.countryAreas[countryName];
        
        if (!indonesiaArea || !countryArea) {
            console.warn('Area data not available for comparison');
            return;
        }
        
        const scaleFactor = Math.sqrt(countryArea / indonesiaArea);
        
        // Get country's center for positioning
        const bounds = L.geoJSON(countryFeature).getBounds();
        const countryCenter = bounds.getCenter();
        
        // Get Indonesia's center
        const indonesiaBounds = L.geoJSON(this.indonesiaData).getBounds();
        const indonesiaCenter = indonesiaBounds.getCenter();
        
        // Scale and translate Indonesia geometry to overlay on country
        const scaledIndonesia = this.scaleAndTranslateGeoJSON(
            this.indonesiaData,
            scaleFactor,
            countryCenter,
            indonesiaCenter
        );
        
        // Create overlay layer
        this.currentOverlay = L.geoJSON(scaledIndonesia, {
            style: {
                fillColor: '#ff0000',
                fillOpacity: 0.6,
                color: '#ff0000',
                weight: 3,
                opacity: 0.9
            }
        }).addTo(this.map);
        
        // Highlight the clicked country
        const clickedLayer = this.countryLayers[countryName];
        if (clickedLayer) {
            clickedLayer.setStyle({
                fillOpacity: 0.5,
                weight: 2
            });
        }
    }

    scaleAndTranslateGeoJSON(geojson, scale, targetCenter, sourceCenter) {
        // Create a deep copy of the GeoJSON
        const scaled = JSON.parse(JSON.stringify(geojson));
        
        // Process coordinates
        const processCoordinates = (coords) => {
            if (Array.isArray(coords[0])) {
                return coords.map(processCoordinates);
            }
            
            // Convert to radians
            const lat = coords[1] * Math.PI / 180;
            const lon = coords[0] * Math.PI / 180;
            
            // Calculate offset from source center
            const dLat = lat - (sourceCenter.lat * Math.PI / 180);
            const dLon = lon - (sourceCenter.lng * Math.PI / 180);
            
            // Scale
            const scaledDLat = dLat * scale;
            const scaledDLon = dLon * scale;
            
            // Translate to target center
            const newLat = (targetCenter.lat * Math.PI / 180) + scaledDLat;
            const newLon = (targetCenter.lng * Math.PI / 180) + scaledDLon;
            
            // Convert back to degrees
            return [newLon * 180 / Math.PI, newLat * 180 / Math.PI];
        };
        
        if (scaled.geometry.type === 'Polygon') {
            scaled.geometry.coordinates = scaled.geometry.coordinates.map(processCoordinates);
        } else if (scaled.geometry.type === 'MultiPolygon') {
            scaled.geometry.coordinates = scaled.geometry.coordinates.map(poly => 
                poly.map(processCoordinates)
            );
        }
        
        return scaled;
    }

    showComparison(countryName) {
        console.log('Showing comparison for:', countryName);
        
        const indonesiaArea = this.countryAreas['Indonesia'];
        const otherArea = this.countryAreas[countryName];
        
        if (indonesiaArea && otherArea) {
            const ratio = indonesiaArea / otherArea;
            let comparisonText;
            
            if (ratio > 1) {
                comparisonText = `Indonesia is ${ratio.toFixed(1)} times bigger than ${countryName}`;
            } else {
                comparisonText = `Indonesia is ${(1/ratio).toFixed(1)} times smaller than ${countryName}`;
            }
            
            document.getElementById('comparison-text').textContent = comparisonText;
            console.log('Showing comparison:', comparisonText);
        } else {
            document.getElementById('comparison-text').textContent = `No area data available for ${countryName}`;
            console.log('No area data found for:', countryName);
        }
    }

    hideComparison() {
        // Remove overlay
        if (this.currentOverlay) {
            this.map.removeLayer(this.currentOverlay);
            this.currentOverlay = null;
        }
        
        // Reset country styles
        Object.values(this.countryLayers).forEach(layer => {
            const name = layer.feature.properties.NAME;
            const isIndonesia = name === 'Indonesia';
            layer.setStyle({
                fillColor: isIndonesia ? '#ff4444' : '#ffffff',
                fillOpacity: isIndonesia ? 0.7 : 0.3,
                weight: 1
            });
        });
        
        document.getElementById('comparison-text').textContent = 'Click any country to compare its size with Indonesia';
    }

    setupEventListeners() {
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.hideComparison();
            console.log('Reset comparison');
        });
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('Loading Indonesia Size Comparator...');
    new IndonesiaGlobe();
});
