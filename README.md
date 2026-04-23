# 🔮 Cypher Guard: AI Election Forecasting Bot

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)
![AI](https://img.shields.io/badge/AI_Engine-Groq%20%7C%20Gemini-orange.svg)

**Cypher Guard** is a highly advanced, full-stack interactive election forecasting tool. It deploys a sophisticated "Neural Swarm" of AI agents to analyze live web data, historical trends, regional sentiment, and demographic shifts, providing real-time predictive modeling for any global political election.

---

## 🌟 Key Features

- **Live Intelligence Gathering:** Scrapes real-time data from search engines and news sources to ground its predictions in reality.
- **Dual AI Processing Pipeline:** Utilizes ultra-fast **Groq API** as the primary engine with a robust fallback to **Google Gemini**.
- **Dynamic Streaming Telemetry:** Watch the AI's thought process unfold in real-time as it synthesizes data, calibrates historical bias, and renders its forecast.
- **Interactive UI Dashboard:** Built with React, Tailwind CSS, Framer Motion, and Recharts, offering an incredibly premium, "glassmorphism" aesthetic.
- **Dynamic Party Logos:** Automatically fetches and caches high-quality SVG party logos directly from the Wikipedia API.

---

## 📥 Input Capabilities

The system allows for highly flexible, natural language interactions:

- **Free-form Natural Language Search:** Users can input any election scenario into the search bar (e.g., *"United Kingdom General Election 2024"*, *"Bihar Assembly Election 2025"*).
- **Input Validation & Scoping:** A strict validation layer ensures the bot exclusively processes election-related queries. If a user asks a non-political question, the system instantly rejects it, preserving API quotas.
- **Targeted Parameters:** The backend automatically identifies the region, level of government, and time period from the user's string to tailor its web-scraping logic.

---

## 📤 Output & Analytics Dashboard

Upon processing the data, the system generates a comprehensive, JSON-structured response that is seamlessly rendered into the dashboard:

### 1. **Candidate Profiling**
- **Detailed Metrics:** Displays the candidate's name, political party, dynamically fetched party logo, win probability (%), projected vote share, and momentum (rising/stable/falling).
- **Sentiment Meter:** A visual gauge representing the public sentiment score toward the candidate based on recent news and web data.

### 2. **Macro Forecasting**
- **Win Probability Gauges:** High-quality circular progress indicators for visual comparison.
- **Margin of Victory:** Estimates the specific margin between the top candidates.
- **Confidence Level:** Indicates the model's confidence (High/Medium/Low) based on the volatility of the ingested data.

### 3. **AI Explanations & Risk Factors**
- **Decisive Factors:** A ranked list of key issues influencing the election (e.g., "Economic Anxiety", "Incumbency Fatigue") with precise impact scores.
- **Historical Comparison:** Contextualizes current data against previous similar elections.
- **Risk Vectors:** Highlights wildcard events or shifting demographics that could disrupt the forecast.

---

## 🏗️ Architecture & Tech Stack

### Frontend (Client)
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (Dark Mode, Glassmorphism, Custom Animations)
- **Icons & Animations:** Lucide React, Framer Motion
- **Visualizations:** Recharts, D3 (Geographical Mapping)

### Backend (Server)
- **Runtime:** Node.js + Express
- **AI Integration:** Groq SDK, Google Generative AI (Gemini)
- **Data Gathering:** DuckDuckScrape, Puppeteer, Axios
- **Security & Rate Limiting:** Express Rate Limit, CORS protection

---

## 🚀 Deployment Guide (Render)

This application is fully configured for deployment on [Render](https://render.com/).

### 1. Deploy the Backend (Web Service)
1. Create a new **Web Service** on Render.
2. Connect this GitHub repository.
3. **Settings:**
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. **Environment Variables:**
   - `GEMINI_API_KEY`: Your Google AI Studio Key
   - `GROQ_API_KEY`: Your Groq API Key
   - `FRONTEND_URL`: URL of your deployed frontend (e.g., `https://my-frontend.onrender.com`)

### 2. Deploy the Frontend (Static Site)
1. Create a new **Static Site** on Render.
2. Connect this GitHub repository.
3. **Settings:**
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. **Environment Variables:**
   - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://my-backend.onrender.com`)

---

## 💻 Local Development Setup

If you wish to run the project locally:

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
   *The application will be available at `http://localhost:5173`.*

---
*Disclaimer: This tool provides predictive modeling based on publicly available data and AI inference. It does not guarantee actual election results.*
