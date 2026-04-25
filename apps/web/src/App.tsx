import { Route, Routes } from "react-router-dom";
import { Atlas } from "./pages/Atlas.js";
import { Diagnose } from "./pages/Diagnose.js";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Atlas />} />
      <Route path="/diagnose/:tokenId" element={<Diagnose />} />
    </Routes>
  );
}
