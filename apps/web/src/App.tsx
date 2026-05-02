import { Route, Routes } from "react-router-dom";
import { Agent } from "./pages/Agent.js";
import { Atlas } from "./pages/Atlas.js";
import { Developers } from "./pages/Developers.js";
import { Diagnose } from "./pages/Diagnose.js";
import { Landing } from "./pages/Landing.js";
import { Report } from "./pages/Report.js";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/atlas" element={<Atlas />} />
      <Route path="/agent" element={<Agent />} />
      <Route path="/developers" element={<Developers />} />
      <Route path="/diagnose/:tokenId" element={<Diagnose />} />
      <Route path="/report/:rootHash" element={<Report />} />
    </Routes>
  );
}
