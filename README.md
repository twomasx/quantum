# Q.U.A.N.T.U.M. - Consciousness Research Platform

A futuristic web-based platform for exploring consciousness through quantum randomness experiments.

## 🚀 Live Demo

[View Live Site](#) _(Update with your Netlify URL)_

## 🎮 Features

- **Intention-Based Coin Flip**: Test your ability to influence random outcomes
- **Precognition: Predict-the-Bit**: Challenge your predictive abilities
- **Quantum Recall**: Memory game with intuition tracking
- **Futuristic UI**: Holographic effects, particle animations, and cyberpunk aesthetics

## 🛠️ Technology Stack

- Pure HTML5, CSS3, and JavaScript
- No external dependencies
- Cryptographically secure random number generation
- Fully responsive design

## 📦 Deployment to Netlify

### Method 1: Deploy with Git

1. Push this repository to GitHub/GitLab/Bitbucket
2. Log in to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Connect your repository
5. Deploy settings are pre-configured in `netlify.toml`
6. Click "Deploy site"

### Method 2: Drag & Drop

1. Log in to [Netlify](https://www.netlify.com/)
2. Drag the entire project folder to the deployment area
3. Your site will be live in seconds!

### Method 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## 🔧 Configuration

The `netlify.toml` file includes:
- Security headers
- Caching rules for optimal performance  
- Build settings
- Redirect rules

## 🌐 Custom Domain

1. In Netlify dashboard, go to "Domain settings"
2. Add your custom domain
3. Update DNS settings as instructed
4. Enable HTTPS (free SSL certificate)

## 📁 Project Structure

```
quantum/
├── index.html          # Main landing page
├── coinflip.html       # Coin flip experiment
├── flipthebit.html     # Bit prediction experiment
├── quantum_recall.html # Memory game
├── quantum_recall.js   # Game logic
├── quantum_recall.css  # Game styles
├── quantum_core.css    # Shared futuristic styles
├── netlify.toml        # Netlify configuration
├── _redirects          # Redirect rules
└── README.md          # This file
```

## 🎨 Customization

- Colors defined in CSS variables in `:root`
- Animations can be adjusted in `quantum_core.css`
- Game parameters can be modified in respective HTML files

## 📊 Features in Each Experiment

### Coin Flip
- Batch and single flip modes
- Real-time statistics tracking
- Control group simulation
- Streak probability calculations

### Predict-the-Bit
- Binary prediction (0 or 1)
- Success rate tracking
- Visual feedback with animations
- Intuition statistics

### Quantum Recall
- Customizable grid size (e.g., 4x4)
- Multi-player support (1-4 players)
- Intuitive match detection
- Real-time probability display

## 🔒 Privacy

- All randomness generated locally using Web Crypto API
- No data is sent to external servers
- Completely client-side application
- No cookies or tracking

## 📱 Browser Support

- Chrome/Edge (Recommended)
- Firefox
- Safari
- Mobile browsers (iOS/Android)

## 🐛 Troubleshooting

If animations appear choppy:
- Reduce particle count in index.html
- Disable some visual effects in CSS
- Check browser hardware acceleration

## 📄 License

This project is open source. Feel free to fork and modify!

---

Built with 💜 by Polymad Labs | Powered by quantum consciousness