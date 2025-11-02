# Indonesia is Big

An interactive 2D map that lets you click any country to see how Indonesia compares in size. Built with **Next.js** (React) and **Leaflet.js**, deployed on Vercel.

## Features

- 🗺️ Interactive 2D world map with all country boundaries
- 🖱️ Click any country to see Indonesia's size overlay
- 📊 Real-time size comparisons with all countries
- 📱 Mobile-friendly touch controls
- 🎨 Beautiful, modern UI
- ⚛️ Built with Next.js and React

## Live Demo

Visit the live site: [indonesia-is-big.vercel.app](https://indonesia-is-big.vercel.app)

## Tech Stack

- **Next.js 14** - React framework with static site generation
- **React 18** - UI library
- **Leaflet.js** - Lightweight 2D map library
- **Natural Earth Data** - Country boundaries GeoJSON
- **OpenStreetMap** - Map tiles

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/anindilla/indonesia-is-big.git
cd indonesia-is-big
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will automatically detect Next.js and deploy
4. Your site will be available at `https://indonesia-is-big.vercel.app`

The `vercel.json` is already configured for optimal deployment.

## Project Structure

```
indonesia-is-big/
├── pages/
│   ├── _app.js       # Next.js app wrapper
│   └── index.js      # Home page component
├── components/
│   └── Map.js        # Leaflet map component
├── styles/
│   └── globals.css   # Global styles
├── public/
│   └── data/
│       └── country-areas.json  # Country area data
├── next.config.js    # Next.js configuration
├── package.json      # Dependencies
└── vercel.json       # Vercel deployment config
```

## How It Works

1. **2D Map**: Leaflet.js creates an interactive world map with country boundaries
2. **Country Clicking**: Click any country to trigger size comparison
3. **Indonesia Overlay**: Scaled Indonesia outline appears over the clicked country
4. **Size Comparison**: Pre-calculated country areas are compared to show ratios
5. **Visual Feedback**: Countries highlight on hover, Indonesia overlay shows actual size comparison

## Technologies Used

- **Next.js** - React framework with static site generation
- **React** - UI library
- **Leaflet.js** - Lightweight 2D map library
- **Natural Earth Data** - Country boundaries GeoJSON
- **OpenStreetMap** - Map tiles

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for educational purposes.