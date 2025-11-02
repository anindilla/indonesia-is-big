# Indonesia is Big

An interactive 2D map that lets you click any country to see how Indonesia compares in size. Built with Leaflet.js and deployed as a static site.

## Features

- 🗺️ Interactive 2D world map with all country boundaries
- 🖱️ Click any country to see Indonesia's size overlay
- 📊 Real-time size comparisons with all countries
- 📱 Mobile-friendly touch controls
- 🎨 Beautiful, modern UI

## Live Demo

Visit the live site: [indonesia-is-big.vercel.app](https://indonesia-is-big.vercel.app)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/anindilla/indonesia-is-big.git
cd indonesia-is-big
```

2. Serve the files locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Open your browser to `http://localhost:8000`

## Deployment

### Vercel (Current)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy your site
4. Your site will be available at `https://indonesia-is-big.vercel.app`

### Netlify

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Set build command: (leave empty for static site)
4. Set publish directory: `.` (root)
5. Deploy!

### GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings > Pages
3. Select "Deploy from a branch" > "main"
4. Your site will be available at `https://anindilla.github.io/indonesia-is-big`

## Project Structure

```
indonesia-is-big/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── main.js            # Leaflet.js application
├── vercel.json        # Vercel deployment config
├── data/
│   └── country-areas.json # Country area data
└── README.md          # This file
```

## Technologies Used

- **Leaflet.js** - Lightweight 2D map library
- **Natural Earth Data** - Country boundaries GeoJSON
- **Vanilla JavaScript** - No frameworks needed
- **OpenStreetMap** - Map tiles

## How It Works

1. **2D Map**: Leaflet.js creates an interactive world map with country boundaries
2. **Country Clicking**: Click any country to trigger size comparison
3. **Indonesia Overlay**: Scaled Indonesia outline appears over the clicked country
4. **Size Comparison**: Pre-calculated country areas are compared to show ratios
5. **Visual Feedback**: Countries highlight on hover, Indonesia overlay shows actual size comparison

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for educational purposes.