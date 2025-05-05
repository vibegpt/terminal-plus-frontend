import { Routes, Route } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import PlanJourneyPage from "@/pages/plan-journey";
import YourJourneysPage from "@/pages/your-journeys";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <PlanJourneyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/your-journeys"
        element={
          <RequireAuth>
            <YourJourneysPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;