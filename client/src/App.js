import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoCall from "./pages/VideoCall.jsx";
import HomePage from "./pages/Home.jsx";
import Learn from "./pages/Learn.jsx";
import ModelPage from "./pages/Explore.jsx";
import ASLDetector from "./pages/SelfTesting.jsx";
import VideoChat from "./pages/temp.jsx";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/video-calling" element={<VideoCall />} />
        <Route path="/self-testing" element={<ASLDetector />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/Explore" element={<ModelPage />} />
        <Route path="/temp" element={<VideoChat />} />

      </Routes>
    </Router>
  );
}

export default App;
