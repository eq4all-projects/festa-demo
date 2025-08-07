import { Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import TutorialPage from "./components/TutorialPage";
import ReadyPage from "./components/ReadyPage";
import EasyModePage from "./components/EasyModePage";
import HardModePage from "./components/HardModePage";
import WebGLPlayer from "./components/WebGLPlayer";
import SuccessPage from "./components/SuccessPage";
import FailurePage from "./components/FailurePage";
import FinalFailPage from "./components/FinalFailPage";
import FinalPage from "./components/FinalPage";

const App = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/tutorial" element={<TutorialPage />} />
      <Route path="/ready" element={<ReadyPage />} />
      <Route path="/easy-mode" element={<EasyModePage />} />
      <Route path="/hard-mode" element={<HardModePage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/failure" element={<FailurePage />} />
      <Route path="/final-fail" element={<FinalFailPage />} />
      <Route path="/final" element={<FinalPage />} />
      <Route
        path="/play"
        element={<WebGLPlayer onBackToHome={() => navigate("/")} />}
      />
    </Routes>
  );
};

export default App;
