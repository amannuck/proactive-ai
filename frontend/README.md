# Proactive Pulse

An AI-powered emergency department surge prediction and resource management system.

## Tech Stack

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI component library
- **shadcn-ui** - Accessible component library
- **Tailwind CSS** - Utility-first CSS framework

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/) or [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js)

## Setup Instructions

Follow these steps to set up and run the project locally:

### 1. Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd proactive-pulse
```

### 2. Install dependencies

```sh
npm install
```

### 3. Start the development server

```sh
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Available Scripts

- **`npm run dev`** - Start the development server with hot reload
- **`npm run build`** - Build the project for production
- **`npm run preview`** - Preview the production build locally
- **`npm run lint`** - Run ESLint to check code quality

## Project Structure

```
proactive-pulse/
├── src/
│   ├── components/     # Reusable UI components
│   ├── data/          # JSON data files
│   ├── pages/         # Page components
│   ├── lib/           # Utility functions
│   └── hooks/         # Custom React hooks
├── public/            # Static assets
└── index.html         # Entry HTML file
```

## Features

- **Active Alerts** - AI-detected events with predicted ED impact
- **Surge Timeline** - 48-hour ED volume forecast with staffing alignment
- **Inventory Management** - Real-time stock level monitoring
- **Suppliers Directory** - Vendor relationship management
- **Past Incidents** - Historical surge events and supply depletion patterns
- **Purchases & Approvals** - AI-recommended purchase management
- **Staffing Schedule** - Shift management based on predicted demand
- **Analytics** - Historical data and AI prediction accuracy metrics
