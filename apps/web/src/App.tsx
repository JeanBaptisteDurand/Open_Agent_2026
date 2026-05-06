// Top-level router. /deck mirrors the submission PDF as a webpage.
// /finale is the single-URL kiosk for the live demo (presenter mode).
// /verify and /composability are derivative pages that the kiosk
// embeds; they also stand alone for direct linking.
import { Route, Routes } from "react-router-dom";
import { Agent } from "./pages/Agent.js";
import { Atlas } from "./pages/Atlas.js";
import { Composability } from "./pages/Composability.js";
import { Deck } from "./pages/Deck.js";
import { Developers } from "./pages/Developers.js";
import { Diagnose } from "./pages/Diagnose.js";
import { Finale } from "./pages/Finale.js";
import { Landing } from "./pages/Landing.js";
import { Report } from "./pages/Report.js";
import { Roadmap } from "./pages/Roadmap.js";
import { Verify } from "./pages/Verify.js";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/atlas" element={<Atlas />} />
      <Route path="/agent" element={<Agent />} />
      <Route path="/developers" element={<Developers />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/deck" element={<Deck />} />
      <Route path="/diagnose/:tokenId" element={<Diagnose />} />
      <Route path="/report/:rootHash" element={<Report />} />
      <Route path="/verify/:rootHash" element={<Verify />} />
      <Route path="/composability" element={<Composability />} />
      <Route path="/finale" element={<Finale />} />
    </Routes>
  );
}
