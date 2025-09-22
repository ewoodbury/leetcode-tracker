.PHONY: help dev dev-backend dev-frontend start stop build build-backend build-frontend lint install install-backend install-frontend clean test

# Default target
help: ## Show this help message
	@echo "LeetCode Tracker - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make dev          # Start both frontend and backend in development mode"
	@echo "  make start        # Start production server"
	@echo "  make stop         # Stop running servers"

# Development commands
dev: ## Start both frontend and backend in development mode
	@echo "Starting development servers..."
	npm run dev:full

dev-backend: ## Start only the backend development server
	@echo "Starting backend development server..."
	npm run dev:backend

dev-frontend: ## Start only the frontend development server
	@echo "Starting frontend development server..."
	npm run dev

# Production commands
start: build ## Build and start production server
	@echo "Starting production server..."
	cd backend && npm start &
	@echo "Backend server started in background"
	@echo "Frontend built - serve the dist/ folder with your preferred web server"

stop: ## Stop running development servers
	@echo "Stopping development servers..."
	@pkill -f "vite" || true
	@pkill -f "tsx" || true
	@pkill -f "node.*server" || true
	@echo "Servers stopped"

# Build commands
build: build-backend build-frontend ## Build both frontend and backend for production

build-backend: ## Build backend for production
	@echo "Building backend..."
	npm run build:backend

build-frontend: ## Build frontend for production
	@echo "Building frontend..."
	npm run build

# Install commands
install: install-frontend install-backend ## Install all dependencies

install-frontend: ## Install frontend dependencies
	@echo "Installing frontend dependencies..."
	npm install

install-backend: ## Install backend dependencies
	@echo "Installing backend dependencies..."
	cd backend && npm install

# Utility commands
lint: ## Run linting on the codebase
	@echo "Running linter..."
	npm run lint

clean: ## Clean build artifacts and node_modules
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf backend/dist/
	rm -rf node_modules/
	rm -rf backend/node_modules/
	@echo "Clean complete"

# Quick setup for new development environment
setup: install build ## Complete setup: install dependencies and build
	@echo "Setup complete! Run 'make dev' to start development servers"
