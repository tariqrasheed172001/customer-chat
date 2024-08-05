import "./App.css";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import ChatWindow from "./components/ChatWindow";
import useContinuousTokenChecking from "./utils/continuousTokenChecking";
function App() {
  useContinuousTokenChecking();
  return (
    <div className="App" id="main-content">
      <LandingPage />
      <Routes>
        <Route path="/" element={<ChatWindow />} />
      </Routes>
    </div>
  );
}

export default App;
