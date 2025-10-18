# Canvas Animation

A JavaScript-based Canvas animation project featuring an interactive game with asteroids, explosions, and a controllable spaceship.

## Description

This project demonstrates HTML5 Canvas animation capabilities using ES6 JavaScript. It features:
- Animated asteroids falling from the top of the screen
- Sprite-based animations for explosions
- A controllable spaceship
- Smooth animation using `requestAnimationFrame`
- Object-oriented animation framework
- **NEW**: 2D bounding shape utility for collision detection (see [BOUNDING_SHAPE_README.md](BOUNDING_SHAPE_README.md))

## How to Run the Sample

Since this is a client-side HTML5/JavaScript application, you can run it in several ways:

### Option 1: Using a Local Web Server (Recommended)

The application requires a web server to properly load ES6 modules. You can use any of these methods:

**Using Python:**
```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

**Using Node.js (with http-server):**
```bash
npm install -g http-server
http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

Then open your browser and navigate to: `http://localhost:8000`

### Option 2: Using a Modern Browser

Some modern browsers allow you to open HTML files directly, but this may have limitations with ES6 module loading:

1. Open `index.html` in your web browser

### Controls

- Use arrow keys or WASD to control the spaceship
- Click the "Stop Animation" button to pause/resume the animation

## Project Structure

```
.
├── index.html          # Main HTML file
├── bounding-shape-demo.html  # Bounding shape demonstration
├── css/
│   └── style.css      # Minimal custom styles
├── js/
│   ├── animation.js    # Animation framework
│   ├── base.js         # Base utilities
│   ├── game.js         # Game logic
│   ├── boundingShape.js # Bounding shape utility for collision detection
│   └── setupObjects.js # Setup animations
├── img/                # Image assets (sprites)
│   └── meta/          # Generated bounding shape metadata
├── utils/             # Utilities for generating metadata
│   ├── boundingShapeNode.js  # Node.js bounding shape algorithms
│   ├── generateBoundingShapeMeta.js  # Metadata generator
│   ├── processAllSpriteSheets.js  # Batch processor
│   └── README.md      # Utility documentation
├── research/
│   └── research_result.md  # Research on collision detection algorithms
├── package.json        # Project metadata
├── BOUNDING_SHAPE_README.md  # Documentation for bounding shape utility
└── .github/workflows/  # CI/CD workflows
```

## Technologies Used

- HTML5 Canvas
- ES6 JavaScript
- requestAnimationFrame for smooth animations
- Sprite-based graphics

## Bounding Shape Metadata Generator

The project includes a utility to generate bounding shape metadata for sprite sheets:

```bash
# Generate metadata for a single sprite sheet
npm run generate-meta img/asteroid4_32x32.png 32 32 5 19

# Generate metadata for all sprite sheets
npm run generate-all-meta
```

The utility computes bounding shapes using three algorithms (Marching Squares, Convex Hull, Simplified Convex Hull) at three accuracy levels (low, mid, high), and creates visual screenshots of the results.

See [utils/README.md](utils/README.md) for detailed documentation.

## Browser Compatibility

Works best in modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- requestAnimationFrame

## Continuous Integration & Deployment

This project uses GitHub Actions for automated testing and deployment:

### Automated Testing
Every push and pull request to the master branch triggers automated tests that:
- Validate JavaScript syntax
- Check HTML files
- Verify project structure
- Ensure all required files exist

### Automated Deployment to GitHub Pages

Changes pushed to the master branch are automatically deployed to GitHub Pages (gh-pages branch).

The deployment workflow:
1. Fetches the latest changes from master
2. Merges them into the gh-pages branch using the `theirs` strategy
3. Pushes the updated gh-pages branch

**Note:** The gh-pages branch currently contains ES5 code. The merge strategy `-X theirs` ensures that the ES6 refactored JavaScript files (animation.js, base.js, game.js, setupObjects.js) from master replace the ES5 versions in case of conflicts.

The site will be available at: `https://huberp.github.io/CanvasAnimation/`

### Manual Deployment (Alternative)

If you prefer to deploy manually, you can still use the traditional approach:

```bash
# Make sure you're on the master branch with latest changes
git checkout master
git pull origin master

# Merge changes to gh-pages branch
git checkout gh-pages

# Use the theirs strategy to prefer ES6 code over ES5 in case of conflicts
git merge master --allow-unrelated-histories -X theirs -m "Merge ES6 refactored code to gh-pages"

# Push to GitHub Pages
git push origin gh-pages
```

## Credits

- Game assets from [Free Game Assets](http://freegameassets.blogspot.de/)
- Additional resources from [Shoot'em Up .NET](http://www.codeproject.com/Articles/677417/Shootem-Up-NET)
