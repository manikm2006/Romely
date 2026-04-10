# Roamly - Smart AI Itinerary Planner

Roamly is a dynamic, AI-powered travel planning application that curates personalized day-by-day itineraries based on user vibes, budgets, and weather conditions. 

## Tech Stack
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router DOM

## Running the Application Locally
1. Run `npm install` to load all packages.
2. Run `npm run dev` to start the Vite developer server.
3. Access the application on standard port at `http://localhost:5173`.
4. Run `npm run build` to output the production statically optimized bundle to `/dist`.

## Frontend Architecture & Layout

The frontend is modularized into strictly separated React functional components and routed pages:

### Pages Layer
* **`Landing.tsx` (`/`)**: The main marketing funnel page. Contains the primary Hero section, Core Intelligence, How It Works guide, Milestones (animated via `IntersectionObserver` reacting to scroll offsets), and the "Explore India" interface which handles regional template toggling via standard React hook state (`activeTab`).
* **`Planner.tsx` (`/planner`)**: The core software interface. It manages a strict multi-step state machine (`form` → `loading` → `itinerary`) representing the journey scaffolding:
  1. **Form State**: Captures controlled user inputs (Destination, Dates, Budget constraints, Visual Vibe parameters).
  2. **Loading State**: Triggers a simulated AI ingestion process overlay.
  3. **Itinerary State**: Maps the complete timeline of events grouped sequentially by days, injecting dynamic parameters directly into event cards along with live "Re-plan" actions.

### Global Components Layer
* **`Navigation.tsx`**: A sticky, fully responsive header. It leverages a `scroll` event listener hook tied to `window.pageYOffset` to transition its gradient background mapping over complex DOMs, while handling mobile-hamburger navigation logic locally.
* **`Footer.tsx`**: A static directory footer with generalized application anchor hooks.

## Expected Backend Integration & API Handoff

Currently, the frontend utilizes simulated timeout scripts (`setTimeout`) inside `Planner.tsx` to mimic the AI response lag. To upgrade this deployment to a fully functional monolithic platform, backend planners and routers must hook directly into the following outlined API schema:

### 1. Generating The Itinerary
* **Method & Route**: `POST /api/generate-itinerary`
* **Triggered by**: Hitting "Generate Itinerary" form submission on the `/planner` page.
* **Client Request Payload (`formData`)**:
  ```json
  {
    "destination": "string (e.g. Tokyo, Japan)",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "budget": "string/number (e.g. 1500)",
    "vibe": "balanced | foodie | adventure | culture | chill"
  }
  ```
* **Expected Response Schema**: The frontend logic pipeline will expand to destructure this JSON topology:
  ```json
  {
    "planId": "uuid",
    "totalEstimatedCost": 1250,
    "destination": "Tokyo",
    "days": [
      {
        "dayNumber": 1,
        "date": "2026-10-12",
        "weatherInfo": "☀️ 72°F",
        "events": [
          {
            "id": "evt_1a",
            "time": "09:00 AM",
            "title": "Tsukiji Outer Market",
            "description": "Breakfast & Street Food Exploration.",
            "durationMinutes": 150,
            "estimatedCost": 40,
            "type": "activity" 
          },
          {
            "id": "trans_1b",
            "type": "transport",
            "description": "🚇 Metro (15 mins) - $2",
            "estimatedCost": 2
          }
        ]
      }
    ]
  }
  ```

### 2. Live Dynamic Re-Planning
* **Method & Route**: `POST /api/replan-event`
* **Triggered by**: Selecting `🔁 Re-plan` directly on a given `<div className="event-card">`.
* **Client Request Payload**:
  ```json
  {
    "planId": "uuid",
    "eventIdToReplace": "evt_1a",
    "rejectionReason": "optional parameter regarding user's active reason"
  }
  ```
* **Expected Resolution**: A seamless sub-event response block generated within identical parameters but providing fresh geolocated context. The frontend will merely execute an `.map` and `.splice` swap inside the `days` array to visually refresh the UI without forcing an entire page reload.

## Styling System Considerations
This project operates on a **hybrid styling configuration**:
1. All legacy visual architectures, geometric clip paths (e.g. `feature-icon`), complex gradient animations (`fadeRotate`), and media queries exist unmodified inside `index.css`. 
2. React DOM nodes leverage absolute specific naming structures (`className="nav-container"`, `className="step-card"`) matching inherited HTML class bindings natively.
3. Tailwind CSS is running concurrently (`@tailwindcss/vite`). Any future, net-new components can be rapidly scaffolded using normal Tailwind utility mapping directly without modifying `index.css`.
