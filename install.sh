#!/bin/bash

# Mesh CLI Installation Script

echo "Installing Mesh CLI..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if pnpm is installed
if command -v pnpm &> /dev/null; then
    echo "Using pnpm to install Mesh CLI..."
    
    # Configure pnpm to use GitHub Packages
    echo "Configuring pnpm to use GitHub Packages..."
    pnpm config set @instruxi-io:registry https://npm.pkg.github.com
    
    # Install the CLI
    echo "Installing @instruxi-io/mesh-cli..."
    pnpm add @instruxi-io/mesh-cli
else
    echo "Using npm to install Mesh CLI..."
    
    # Configure npm to use GitHub Packages
    echo "Configuring npm to use GitHub Packages..."
    npm config set @instruxi-io:registry https://npm.pkg.github.com
    
    # Install the CLI
    echo "Installing @instruxi-io/mesh-cli..."
    npm install @instruxi-io/mesh-cli
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update the .env file with your API key and private key."
fi

echo "Installation complete!"
echo "You can now use the Mesh CLI with the npm/pnpm scripts defined in package.json."
echo "For example, run: npm run auth:login"
