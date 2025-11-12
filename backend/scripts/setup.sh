#!/bin/bash

# Kerala Horizon Backend Setup Script
set -e

echo "🔧 Setting up Kerala Horizon Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p scripts

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install development dependencies
echo "📦 Installing development dependencies..."
npm install --save-dev

# Set up environment file
echo "⚙️ Setting up environment..."
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp config.example.js .env
    echo "⚠️ Please update .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Set up Firebase
echo "🔥 Setting up Firebase..."
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "🔑 Please login to Firebase..."
    firebase login
fi

# Initialize Firebase (if not already initialized)
if [ ! -f "firebase.json" ]; then
    echo "🚀 Initializing Firebase..."
    firebase init functions
    firebase init firestore
    firebase init hosting
fi

# Set up Redis (if available)
echo "🔴 Checking Redis..."
if command -v redis-server &> /dev/null; then
    echo "✅ Redis is available"
    if ! pgrep -x "redis-server" > /dev/null; then
        echo "🚀 Starting Redis server..."
        redis-server --daemonize yes
    fi
else
    echo "⚠️ Redis is not installed. Caching will use in-memory storage."
fi

# Set up log rotation
echo "📊 Setting up log rotation..."
if [ -f "/etc/logrotate.d/kerala-horizon" ]; then
    echo "✅ Log rotation already configured"
else
    echo "📝 Creating log rotation configuration..."
    sudo tee /etc/logrotate.d/kerala-horizon > /dev/null <<EOF
/var/log/kerala-horizon/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
fi

# Set up PM2 for production
echo "🔄 Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create PM2 ecosystem file
echo "📝 Creating PM2 ecosystem file..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'kerala-horizon-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# Set up monitoring
echo "📈 Setting up monitoring..."
if ! command -v htop &> /dev/null; then
    echo "📦 Installing system monitoring tools..."
    sudo apt-get update && sudo apt-get install -y htop iotop
fi

# Create startup script
echo "🚀 Creating startup script..."
cat > start.sh <<EOF
#!/bin/bash
echo "🚀 Starting Kerala Horizon Backend..."

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "🔴 Starting Redis..."
    redis-server --daemonize yes
fi

# Start the application
if [ "\$NODE_ENV" = "production" ]; then
    echo "🏭 Starting in production mode..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
else
    echo "🔧 Starting in development mode..."
    npm run dev
fi
EOF

chmod +x start.sh

# Create stop script
echo "🛑 Creating stop script..."
cat > stop.sh <<EOF
#!/bin/bash
echo "🛑 Stopping Kerala Horizon Backend..."
pm2 stop kerala-horizon-backend
pm2 delete kerala-horizon-backend
EOF

chmod +x stop.sh

# Create restart script
echo "🔄 Creating restart script..."
cat > restart.sh <<EOF
#!/bin/bash
echo "🔄 Restarting Kerala Horizon Backend..."
pm2 restart kerala-horizon-backend
EOF

chmod +x restart.sh

# Set up SSL (if certificates are available)
echo "🔒 Checking SSL certificates..."
if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    echo "✅ SSL certificates found"
else
    echo "⚠️ SSL certificates not found. HTTPS will not be available."
    echo "📝 To enable HTTPS, place your SSL certificates in ssl/ directory:"
    echo "   - ssl/cert.pem (certificate file)"
    echo "   - ssl/key.pem (private key file)"
fi

# Final setup
echo "🎯 Final setup..."

# Make scripts executable
chmod +x scripts/*.sh

# Create systemd service (optional)
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/kerala-horizon.service > /dev/null <<EOF
[Unit]
Description=Kerala Horizon Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the backend:"
echo "   Development: npm run dev"
echo "   Production:  ./start.sh"
echo ""
echo "🛑 To stop the backend:"
echo "   ./stop.sh"
echo ""
echo "🔄 To restart the backend:"
echo "   ./restart.sh"
echo ""
echo "📊 To monitor the backend:"
echo "   pm2 monit"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Set up Firebase project and configure authentication"
echo "3. Configure external API keys (Google Maps, payment gateways, etc.)"
echo "4. Run 'npm run dev' to start development server"
echo "5. Run './start.sh' to start production server"













