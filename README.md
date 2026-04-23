# AI Election Forecasting Bot

A full-stack, interactive election forecasting tool that analyzes polling data, historical trends, and key demographic factors to predict election outcomes using Google Gemini AI.

## Architecture
- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express
- **AI:** Google Gemini (gemini-2.5-flash)

## Setup Instructions

1. **Obtain Gemini API Key**
   - Grab your API key from Google AI Studio.
   - Go to `server/.env` and replace `your_gemini_api_key_here` with your actual key.

2. **Run Backend**
   - Open a terminal and navigate to `/server`.
   - Run `node server.js`
   - _Note: Make sure dependencies are installed with `npm install` if not already._

3. **Run Frontend**
   - Open a separate terminal and navigate to `/client`.
   - Run `npm run dev`
   - Access the dashboard at `http://localhost:5173`.

## Features Showcase
- **Real-Time Polling Entries:** Manually input your historical and recent polling numbers.
- **Factor Checklists:** Highlight key factors such as regional swing trends and incumbency.
- **Claude Analysis:** Get highly qualitative swing-factor descriptions securely delivered via a JSON-structured response.
- **Recharts Dashboard:** Rich UI visualizer for vote projections and statistical confidence.
- **Export Result:** Use the "Export PDF" button to print and save your specific forecasting visualizations.

