# AuraList

A warm, dark-themed task manager with satisfying animations and smooth interactions

Built with [Builddy](https://builddy.dev) — AI-powered app builder using GLM 5.1.

## Features

- Add tasks with Enter key, clear input with Escape
- Toggle task completion with visual checkbox animation and strikethrough
- Delete individual tasks with collapse animation or clear all completed
- Filter tasks by All/Active/Completed status
- Animated progress bar showing completion percentage
- Drag-and-drop task reordering with persistent order
- Celebration confetti animation when all tasks completed
- Dark theme with warm amber/gold accent colors
- Smooth micro-animations for add, remove, and complete actions
- Responsive design with mobile-friendly layout

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Docker

```bash
docker compose up
```

### Deploy to Railway/Render

1. Push this directory to a GitHub repo
2. Connect to Railway or Render
3. It auto-detects the Dockerfile
4. Done!

## Tech Stack

- **Frontend**: HTML/CSS/JS + Tailwind CSS
- **Backend**: Express.js
- **Database**: SQLite
- **Deployment**: Docker