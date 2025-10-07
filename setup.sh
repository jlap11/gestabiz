#!/bin/bash

# Bookio Complete Setup Script
# This script helps set up the complete Bookio ecosystem

echo "🚀 Bookio Setup Script"
echo "=============================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    echo -e "\n${BLUE}Checking prerequisites...${NC}"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 16+ from https://nodejs.org"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm installed: $NPM_VERSION"
    else
        print_error "npm not found. Please install npm"
        exit 1
    fi
    
    # Check if Supabase CLI is installed
    if command -v supabase &> /dev/null; then
        print_status "Supabase CLI found"
    else
        print_warning "Supabase CLI not found. Installing..."
        npm install -g supabase
    fi
    
    # Check if Expo CLI is installed
    if command -v expo &> /dev/null; then
        print_status "Expo CLI found"
    else
        print_warning "Expo CLI not found. Installing..."
        npm install -g @expo/cli
    fi
    
    # Check if Vercel CLI is installed
    if command -v vercel &> /dev/null; then
        print_status "Vercel CLI found"
    else
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
}

# Setup web application
setup_web_app() {
    echo -e "\n${BLUE}Setting up Web Application...${NC}"
    
    # Install dependencies
    print_info "Installing web app dependencies..."
    npm install
    
    # Create environment file template
    if [ ! -f .env.local ]; then
        print_info "Creating .env.local template..."
        cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Bookio

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@your-domain.com
EOL
        print_warning "Please update .env.local with your actual Supabase credentials"
    else
        print_status ".env.local already exists"
    fi
    
    print_status "Web application setup complete"
}

# Setup mobile application
setup_mobile_app() {
    echo -e "\n${BLUE}Setting up Mobile Application...${NC}"
    
    if [ ! -d "mobile" ]; then
        print_info "Creating Expo mobile app..."
        npx create-expo-app mobile --template blank-typescript
        
        cd mobile
        
        # Install dependencies
        print_info "Installing mobile app dependencies..."
        npm install @supabase/supabase-js expo-auth-session expo-crypto expo-notifications
        npm install @react-navigation/native @react-navigation/stack
        npm install react-native-screens react-native-safe-area-context
        
        # Create app config
        print_info "Creating app configuration..."
        cat > app.config.js << 'EOL'
import 'dotenv/config'

export default {
  expo: {
    name: "Bookio",
    slug: "Bookio",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1a1a1a"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.Bookio"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1a1a"
      },
      package: "com.yourcompany.Bookio"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: ["expo-notifications"],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
}
EOL
        
        # Create environment file
        cat > .env << EOL
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
EXPO_PUBLIC_APP_URL=https://your-app-domain.com
EOL
        
        cd ..
        print_status "Mobile application setup complete"
    else
        print_status "Mobile app directory already exists"
    fi
}

# Setup Supabase project
setup_supabase() {
    echo -e "\n${BLUE}Setting up Supabase...${NC}"
    
    # Initialize Supabase (if not already done)
    if [ ! -f "supabase/config.toml" ]; then
        print_info "Initializing Supabase project..."
        supabase init
    else
        print_status "Supabase already initialized"
    fi
    
    # Copy our custom config
    if [ -f "src/supabase/config.toml" ]; then
        print_info "Updating Supabase configuration..."
        cp src/supabase/config.toml supabase/config.toml
    fi
    
    # Start local Supabase (optional)
    read -p "Do you want to start local Supabase development environment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Starting local Supabase..."
        supabase start
        print_status "Supabase started locally"
        print_info "Local dashboard: http://localhost:54323"
    fi
    
    print_status "Supabase setup complete"
}

# Package browser extension
package_extension() {
    echo -e "\n${BLUE}Packaging Browser Extension...${NC}"
    
    if [ -d "src/browser-extension" ]; then
        # Create extension package directory
        mkdir -p dist/extension
        
        # Copy extension files
        cp -r src/browser-extension/* dist/extension/
        
        # Create icons directory (you'll need to add actual icon files)
        mkdir -p dist/extension/icons
        
        print_info "Extension files copied to dist/extension/"
        print_warning "Don't forget to add icon files (16x16, 32x32, 48x48, 128x128) to dist/extension/icons/"
        print_warning "Update manifest.json with your actual domain URLs"
        
        # Create zip file for Chrome Web Store
        cd dist
        zip -r Bookio-extension.zip extension/
        cd ..
        
        print_status "Extension packaged as dist/Bookio-extension.zip"
    else
        print_error "Extension source not found"
    fi
}

# Deploy to production
deploy_production() {
    echo -e "\n${BLUE}Production Deployment Guide...${NC}"
    
    print_info "To deploy to production:"
    echo "1. Web App (Vercel):"
    echo "   - Run: vercel"
    echo "   - Add environment variables in Vercel dashboard"
    echo ""
    echo "2. Database (Supabase):"
    echo "   - Run: supabase db push"
    echo "   - Deploy edge functions: supabase functions deploy"
    echo ""
    echo "3. Mobile App (Expo):"
    echo "   - Run: eas build --platform all"
    echo "   - Submit: eas submit"
    echo ""
    echo "4. Browser Extension:"
    echo "   - Upload dist/Bookio-extension.zip to Chrome Web Store"
    echo ""
    print_warning "Make sure to update all environment variables with production values!"
}

# Main setup flow
main() {
    echo "Select setup options:"
    echo "1. Full setup (all components)"
    echo "2. Web app only"
    echo "3. Mobile app only"
    echo "4. Browser extension only"
    echo "5. Supabase only"
    echo "6. Package extension"
    echo "7. Production deployment guide"
    echo "8. Exit"
    
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            check_prerequisites
            setup_web_app
            setup_mobile_app
            setup_supabase
            package_extension
            deploy_production
            ;;
        2)
            check_prerequisites
            setup_web_app
            ;;
        3)
            check_prerequisites
            setup_mobile_app
            ;;
        4)
            package_extension
            ;;
        5)
            check_prerequisites
            setup_supabase
            ;;
        6)
            package_extension
            ;;
        7)
            deploy_production
            ;;
        8)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}🎉 Setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update environment variables with your actual credentials"
    echo "2. Run the database schema in Supabase SQL Editor"
    echo "3. Test the application locally"
    echo "4. Deploy to production when ready"
    echo ""
    echo "For detailed instructions, see:"
    echo "- src/docs/deployment-guide.md"
    echo "- src/docs/environment-setup.md"
}

# Run main function
main