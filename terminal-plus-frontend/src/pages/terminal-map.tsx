import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Map, ArrowRight, MapPin } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { guessTerminal } from "@/utils/terminalGuesses";

type Journey = {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  transit?: string;
  selected_vibe: "Relax" | "Explore" | "Work" | "Quick";
  departure_time?: string;
  created_at: string;
};

export default function TerminalMapPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/terminal-map/:id");
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminalName, setTerminalName] = useState("");

  useEffect(() => {
    const loadJourney = async () => {
      if (!params?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchWithAuth(`/api/getJourneyById?id=${params.id}`);
        if (!response.ok) throw new Error("Failed to load journey");

        const data = await response.json();
        setJourney(data.journey);

        if (data.journey) {
          const terminal = guessTerminal(data.journey.origin, data.journey.flight_number);
          setTerminalName(terminal);

          // ✅ Track view_terminal_map GA4 event
          if (window.gtag) {
            window.gtag("event", "view_terminal_map", {
              event_category: "Terminal",
              terminal: terminal,
              airport: data.journey.origin,
              flight_number: data.journey.flight_number,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load journey:", err);
      } finally {
        setLoading(false);
      }
    };

    loadJourney();
  }, [params?.id]);

  // ...rest of your code remains unchanged
}
