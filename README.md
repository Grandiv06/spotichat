# SpotiChat

SpotiChat is a modern, responsive, Telegram-like messaging frontend built with React, Vite, and Tailwind CSS. It uses `shadcn/ui` components for a premium look and is ready to be connected to a real NestJS + WebSocket backend. Currently, it runs entirely on an interactive mock service layer.

## Features

- **Auth Flow (Mock):** Phone entry and OTP verification via fake API.
- **Main Chat Interface:**
  - Sidebar with Chat List, Contact Search, and Profile sections.
  - Active Chat view with distinct sent/received message bubbles.
  - Seen/Delivered receipts.
- **Premium Theming:** Seamless Dark and Light mode powered by CSS variables and `tailwind-animate`.
- **State Management:** Fully managed by `zustand` (auth, themes, modals, selected chats).
- **Responsive:** Scales down beautifully to mobile views.

## Tech Stack

- **Framework:** React 18 + Vite (TypeScript)
- **Styling:** Tailwind CSS V4 + shadcn/ui
- **Icons:** Lucide React
- **State & Routing:** Zustand, React Router v6
- **Forms:** react-hook-form + zod

## Quick Start (Development)

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` to see the app.
   
*(For mock login, you can pass any 10-digit phone number, and ANY 5-digit code e.g. `12345` to enter.)*

## Docker Deployment (Production)

The repository includes a multi-stage `Dockerfile` and an `nginx.conf` designed for serving the frontend compactly.

1. **Build the image**
   ```bash
   docker build -t spotichat .
   ```
2. **Run the container**
   ```bash
   docker run -d -p 8080:80 --name spotichat-app spotichat
   ```
3. Open `http://localhost:8080` to see the production build!

## Future Improvements

- Connect `services/` layers to real Axios/fetch instances and WebSockets.
- Complete mobile-specific animations (swipe to close sidebar).
- Add real file handling via multipart form uploads.
