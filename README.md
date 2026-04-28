# 🔮 ElectIQ : AI Election Forecasting Bot

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)
![AI](https://img.shields.io/badge/AI_Engine-Groq%20%7C%20Gemini-orange.svg)

**🔴 Live Demo:** [https://aielectionforecastingbot-1.onrender.com](https://aielectionforecastingbot-1.onrender.com)

**ElectIQ** is a highly advanced, full-stack interactive election forecasting tool. It deploys a sophisticated "Neural Swarm" of AI agents to analyze live web data, historical trends, regional sentiment, and demographic shifts, providing real-time predictive modeling for any global political election.

---

## 🏗️ 1. System Architecture & High-Level Flow

ElectIQ operates on a decoupled client-server architecture designed for speed, security, and real-time feedback.

1. **User Input:** The user submits a natural language query (e.g., *"2024 US Presidential Election"*).
2. **Input Validation:** The Node.js backend intercepts the request and runs a strict Regex-based validation to ensure the query is explicitly related to politics/elections, preventing abuse of the AI API.
3. **Caching Layer:** The backend checks an in-memory cache (60-minute TTL). If the exact query was run recently, it returns the cached forecast instantly.
4. **AI Processing Pipeline:** 
   - **Primary Engine:** The backend queries the **Groq API** (`llama-3.3-70b-versatile`) for blazing-fast inference via Streaming.
   - **Fallback Engine:** If Groq fails or hits rate limits, the system seamlessly falls back to **Google Gemini** (`gemini-2.5-flash`) utilizing Google Search grounding to gather real-time web data.
5. **Streaming Telemetry (SSE):** As the AI generates its response, raw text chunks are streamed back to the frontend via **Server-Sent Events (SSE)**, creating a "hacker-style" live telemetry terminal.
6. **Data Parsing & UI Rendering:** Once the stream concludes, the backend extracts the structured JSON. The frontend uses this JSON to render interactive charts, dynamic candidate profiles, and geographic maps.

---

## 💻 2. Frontend Application (Client)

The frontend is built for maximum visual impact, utilizing a modern tech stack focused on smooth micro-interactions, "glassmorphism", and premium aesthetics.

### **Tech Stack:**
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS (configured for complex gradients, drop shadows, and dark mode)
- **State Management:** Zustand (`useElectionStore.js` for centralized, predictable state without prop-drilling)
- **Animations:** Framer Motion (page transitions, component mounting, hover effects)
- **Visualizations:** Recharts (pie charts, custom gauges)

### **Core Components:**
- `SearchBar.jsx`: The primary entry point. Handles the animated input field, triggers the Fetch API via SSE, and renders the live streaming telemetry console.
- `CompletedElectionDashboard.jsx`: The main layout container for the forecast results.
- `PartyLogo.jsx`: A dynamic component that intercepts candidate party names and automatically queries the **Wikipedia API** to fetch and render high-resolution SVG party logos in real-time. Includes an in-memory cache to prevent redundant API calls.
- `ProbabilityGauge.jsx`: A custom SVG visualization using Recharts to display a candidate's win probability as a glowing, circular gauge.
- `SentimentMeter.jsx`: A visual bar indicating positive/negative public sentiment based on AI web scraping.
- `AIExplanation.jsx`: Renders the qualitative AI data, including decisive factors, historical comparisons, and critical risk vectors.

---

## ⚙️ 3. Backend Application (Server)

The Node.js server acts as a secure proxy, API gateway, and stream manager.

### **Tech Stack:**
- **Runtime:** Node.js, Express.js
- **Middleware:** CORS, Express Rate Limit (DDoS protection)
- **AI SDKs:** `groq-sdk`, native `fetch` for Gemini REST API

### **Key Server Mechanics:**
- **Concurrency Mutex (Lock):** Implements a global `isRequestInProgress` boolean flag. This ensures that only **one** heavy AI forecast can be processed at any given time globally, strictly preventing API rate-limit exhaustion and controlling server costs.
- **Server-Sent Events (SSE):** Instead of making the user wait 10-15 seconds for a massive JSON payload, the server pipes the AI's internal "thought process" back to the client chunk-by-chunk using `res.write()`.
- **System Prompting:** The AI is strictly prompted to return a specific JSON schema, enforcing that candidates, margin of victory, and explanations are perfectly structured for the React frontend to parse.
- **Deep Diagnostics:** Implements a custom `debugLog` function that writes all server events (uncaught exceptions, stream events, fallback triggers) to a persistent `server-debug.log` file.

---

## 🧬 4. Data Structures & Schema

The AI is forced to return data in the exact following schema, which binds the Backend to the Frontend:

```json
{
  "election_status": "upcoming" | "ongoing" | "completed",
  "actual_result": { "winner": "Name", "winner_party": "Party", "vote_share": 51.5, "margin": "1.2%" },
  "candidates": [
    { 
      "name": "Candidate A", 
      "party": "Party Name", 
      "winProbability": 65.5, 
      "projectedVoteShare": 51.2, 
      "momentum": "rising", 
      "sentimentScore": 75 
    }
  ],
  "confidenceLevel": "high" | "medium" | "low",
  "marginOfVictoryEstimate": "String representation",
  "explanation": {
    "summary": "2 sentence context.",
    "topDecisiveFactors": [{"factor": "Economy", "impact": 8.5}],
    "historicalComparison": "Context against previous election.",
    "riskFactors": ["Wildcard event 1", "Wildcard event 2"]
  }
}
```

---

## 🚀 5. Deployment Guide (Render)

This application is fully containerized and configured for zero-downtime deployment on [Render](https://render.com/).

### **Step A: Deploy the Node.js Backend**
1. Log in to Render and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the build:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. **Required Environment Variables:**
   - `GEMINI_API_KEY`: Your Google AI Studio Key
   - `GROQ_API_KEY`: Your Groq API Key
   - `FRONTEND_URL`: The URL where your React app will live (e.g., `https://my-frontend.onrender.com`). This is required for CORS.
5. Deploy. Once live, copy the `onrender.com` backend URL.

### **Step B: Deploy the React Frontend**
1. Create a new **Static Site** on Render.
2. Connect your GitHub repository.
3. Configure the build:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **Required Environment Variables:**
   - `VITE_API_URL`: Paste the backend URL you generated in Step A.
5. Deploy.

---

## 💻 6. Local Development Setup

To run, modify, or contribute to ElectIQ locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bluedevil605/cypher-guard.git
   cd cypher-guard
   ```

2. **Configure Environment Variables:**
   - In `/server`, create a `.env` file based on `.env.example`. Add your `GEMINI_API_KEY` and `GROQ_API_KEY`.
   - In `/client`, create a `.env.local` file with `VITE_API_URL=http://localhost:5000`.

3. **Start the Backend:**
   ```bash
   cd server
   npm install
   npm start
   ```

4. **Start the Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *The application will be available at `http://localhost:5173`. Any changes to the React code will hot-reload automatically.*

---
*Disclaimer: ElectIQ provides predictive modeling based on publicly available data, LLM web scraping, and AI inference. It does not guarantee actual election results and should be used for analytical and entertainment purposes.*
