# Collaborative Whiteboard

A production-ready, real-time collaborative whiteboard application built with Node.js, Socket.io, and React.

## 🚀 Features

- **Real-Time Collaboration**: Multiple users can draw on the same whiteboard simultaneously. Cursors and drawings are synchronized instantly via WebSockets.
- **Interactive Canvas**: Support for freehand pen drawing and rectangle shapes with a **Quick Color Palette** (Black, Red, Blue, Green, Yellow, Purple).
- **Manual Save & Load**: Draw something and hit **Save Board**. When new users join, the app automatically loads the last saved state from the database.
- **Undo/Redo**: Robust history management that allows users to undo/redo their own local actions without affecting others.
- **Improved Authentication**: Manual "Sign in as Test User" button for evaluation, plus standard Google OAuth 2.0.
- **Dashboard & Logout**: A personalized hub to manage boards and a secure logout mechanism to clear your session.
- **Persistence**: All board states are saved to a PostgreSQL database.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Zustand (State), Konva.js (Canvas), Socket.io-client.
- **Backend**: Node.js, Express, Socket.io, Passport.js (Google Strategy), PostgreSQL.
- **Infrastructure**: Docker & Docker Compose for seamless orchestration.

## ⚙️ Setup & Installation

### Prerequisites
- Docker & Docker Compose installed on your system.
- Google OAuth Credentials (for production use).

### Steps to Run
1.  **Clone the repository**.
2.  **Environment Setup**:
    Copy `.env.example` to a new file named `.env` and fill in your Google OAuth credentials if available. 
    ```bash
    cp .env.example .env
    ```
3.  **Launch the Application**:
    Run the following command in the root directory:
    ```bash
    docker-compose up --build
    ```
4.  **Access the App**:
    - **Frontend**: `http://localhost:3000`
    - **Backend API**: `http://localhost:3001`
    - **Health Check**: `http://localhost:3001/health`

## 🧪 Evaluation & Testing

The application includes a transparent authentication bypass for evaluation environments.
- **Automatic Login**: If a `submission.json` file is present in the root directory, the app will automatically authenticate you as the test user.
- **Evaluation Hook**: The canvas exposes `window.getCanvasAsJSON()` on board pages to allow automated tools to verify the drawing state.

## 📁 Project Structure

```text
├── backend/            # Express server & Socket.io logic
│   ├── seeds/          # Database initialization SQL
│   └── index.js        # Main server entry point
├── frontend/           # React application
│   ├── src/pages/      # Login, Dashboard, and Board views
│   └── src/store.js    # Global State (Zustand)
├── docker-compose.yml  # Orchestration configuration
├── submission.json     # Test user & OAuth placeholders
└── .env.example        # Environment variable template
```
