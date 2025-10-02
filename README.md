# Canvas Animation

A JavaScript-based Canvas animation project featuring an interactive game with asteroids, explosions, and a controllable spaceship.

## Description

This project demonstrates HTML5 Canvas animation capabilities using ES6 JavaScript. It features:
- Animated asteroids falling from the top of the screen
- Sprite-based animations for explosions
- A controllable spaceship
- Smooth animation using `requestAnimationFrame`
- Object-oriented animation framework

## How to Run the Sample

Since this is a client-side HTML5/JavaScript application, you can run it in several ways:

### Option 1: Using a Local Web Server (Recommended)

The application requires a web server to properly load resources. You can use any of these methods:

**Using Python:**
```bash
# Python 3.x
cd public_html
python -m http.server 8000

# Python 2.x
cd public_html
python -m SimpleHTTPServer 8000
```

**Using Node.js (with http-server):**
```bash
npm install -g http-server
cd public_html
http-server -p 8000
```

**Using PHP:**
```bash
cd public_html
php -S localhost:8000
```

Then open your browser and navigate to: `http://localhost:8000`

### Option 2: Using a Modern Browser

Some modern browsers allow you to open HTML files directly, but this may have limitations with resource loading:

1. Navigate to the `public_html` directory
2. Open `index.html` in your web browser

### Controls

- Use arrow keys or WASD to control the spaceship
- Click the "Stop Animation" button to pause/resume the animation

## Project Structure

```
.
├── public_html/
│   ├── index.html          # Main HTML file
│   ├── js/
│   │   ├── animation.js    # Animation framework
│   │   ├── base.js         # Base utilities
│   │   ├── game.js         # Game logic
│   │   └── setupObjects.js # Setup animations
│   ├── img/                # Image assets (sprites)
│   └── css/                # Stylesheets
```

## Technologies Used

- HTML5 Canvas
- ES6 JavaScript
- requestAnimationFrame for smooth animations
- Sprite-based graphics

## Browser Compatibility

Works best in modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- requestAnimationFrame

## Deployment to GitHub Pages

To deploy the latest ES6 refactored code to GitHub Pages (gh-pages branch):

```bash
# Make sure you're on the master branch with latest changes
git checkout master
git pull origin master

# Merge changes to gh-pages branch
git checkout gh-pages
git merge master --no-ff -m "Merge ES6 refactored code to gh-pages"

# Push to GitHub Pages
git push origin gh-pages
```

**Note:** The gh-pages branch currently contains ES5 code. Merging from master will bring in the ES6 refactored JavaScript files (animation.js, base.js, game.js, setupObjects.js) along with this README.

The site will be available at: `https://huberp.github.io/CanvasAnimation/public_html/`

## Credits

- Game assets from [Free Game Assets](http://freegameassets.blogspot.de/)
- Additional resources from [Shoot'em Up .NET](http://www.codeproject.com/Articles/677417/Shootem-Up-NET)
