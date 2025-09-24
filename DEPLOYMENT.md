# 📊 Auto-Trading Dashboard

A professional web-based trading dashboard with automated build and deployment pipeline for portfolio management and trade execution.

![Trading Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![Build](https://img.shields.io/github/workflow/status/username/trading-dashboard/Build%20and%20Deploy)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## 🚀 Features

- **Real-time Portfolio Management** - Monitor your total portfolio value, daily P&L, and positions
- **Trade Execution** - Place buy/sell orders with built-in validation and confirmation
- **Performance Analytics** - Visual portfolio allocation and performance metrics
- **Responsive Design** - Works perfectly on desktop and mobile devices
- **Persistent Data** - Your portfolio and trading history is automatically saved
- **Professional UI** - Clean, financial-grade interface built with shadcn/ui

## 🏗️ Build & Deployment System

### Automated CI/CD Pipeline

This project includes a complete build and deployment system using GitHub Actions:

- **Continuous Integration** - Automatic testing and linting on every push
- **Automated Builds** - Production-ready builds with optimization and versioning
- **Release Management** - Automated release packages with downloadable artifacts
- **Staging Deployment** - Automatic staging deployments on main branch pushes

### Build Tools

- `deploy-script.sh` - Automated deployment script with packaging
- `version-info.js` - Version management and build information utilities
- `build-config.json` - Build configuration and deployment settings
- GitHub Actions workflow in `ci-workflow.yml`

## 📦 Quick Start

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd trading-dashboard
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   
3. **Open in Browser**
   Navigate to `http://localhost:5173`

### Production Build

1. **Create Production Build**
   ```bash
   npm run build
   ```

2. **Generate Deployment Package**
   ```bash
   chmod +x deploy-script.sh
   ./deploy-script.sh
   ```

This creates optimized production files and deployment packages ready for hosting.

## 🌐 Deployment Guide

### Option 1: GitHub Actions (Recommended)

1. **Enable GitHub Actions** in your repository settings
2. **Push to main branch** - Automatic build and staging deployment
3. **Create a Release** - Generates production deployment packages

### Option 2: Manual Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider:
   - **Vercel**: Connect your GitHub repo
   - **Netlify**: Drag & drop the `dist` folder
   - **AWS S3**: Upload `dist` contents to your S3 bucket
   - **Traditional Web Host**: Upload `dist` via FTP/SFTP

### Option 3: Self-Hosted

1. **Use the deployment script**:
   ```bash
   ./deploy-script.sh
   ```

2. **Extract the generated archive** on your server:
   ```bash
   unzip trading-dashboard-YYYYMMDD_HHMMSS.zip -d /var/www/html/
   ```

3. **Configure your web server** (Apache/Nginx) to serve the files

## ⚙️ Configuration

### Build Configuration

Edit `build-config.json` to customize:
- Output directory
- Asset inclusion/exclusion rules
- Optimization settings
- Deployment URLs

### Version Management

```bash
# Display version information
node version-info.js info

# Write version file
node version-info.js write

# Bump version (patch/minor/major)
node version-info.js bump patch

# Create git tag
node version-info.js tag
```

## 📁 Project Structure

```
trading-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── TradingDashboard.tsx
│   │   ├── TradeDialog.tsx
│   │   └── PortfolioChart.tsx
│   ├── lib/
│   │   ├── mockData.ts      # Sample trading data
│   │   └── utils.ts         # Utility functions
│   └── App.tsx              # Main application
├── build-config.json        # Build configuration
├── deploy-script.sh         # Deployment automation
├── version-info.js          # Version management
└── ci-workflow.yml          # GitHub Actions workflow
```

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Generate version info
node version-info.js write

# Create deployment package
./deploy-script.sh
```

## 🔧 Technologies Used

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **Icons**: Phosphor Icons
- **Build Tool**: Vite
- **CI/CD**: GitHub Actions
- **Data Persistence**: Spark KV Store

## 📊 Features Overview

### Portfolio Management
- Real-time portfolio value tracking
- Daily profit/loss calculation
- Available cash monitoring
- Position management with current prices

### Trading Interface
- Buy/sell order placement
- Position-based selling (only sell what you own)
- Order validation and confirmation
- Trade history with status tracking

### Analytics Dashboard
- Portfolio allocation pie chart
- Performance metrics display
- Position-level gain/loss tracking
- Responsive data visualization

## 🔒 Security & Best Practices

- No sensitive data in source code
- Client-side data persistence using Spark KV
- Input validation for all trading operations
- Professional-grade error handling
- Type-safe TypeScript implementation

## 📈 Production Considerations

- **Performance**: Optimized production builds with tree-shaking
- **Caching**: Static asset caching for fast load times  
- **SEO**: Proper meta tags and structured HTML
- **Monitoring**: Build status and deployment tracking
- **Scalability**: Component-based architecture for feature expansion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Create an issue for bug reports or feature requests
- Check the GitHub Actions logs for build/deployment issues
- Review the browser console for runtime errors
- Use the version info tools for troubleshooting deployments

---

**Ready to trade?** Start the development server with `npm run dev` and begin building your portfolio! 🚀