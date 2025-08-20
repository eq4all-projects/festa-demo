import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./components/LandingPage";
// import TutorialPage from "./components/TutorialPage";
import ReadyPage from "./components/ReadyPage";
import EasyModePage from "./components/EasyModePage";
import HardModePage from "./components/HardModePage";
import WebGLPlayer from "./components/WebGLPlayer";
import SuccessPage from "./components/SuccessPage";
import FailurePage from "./components/FailurePage";
import FinalFailPage from "./components/FinalFailPage";
import FinalPage from "./components/FinalPage";
import { useBGM } from "./contexts/BGMContext";

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stopAllEffectSounds } = useBGM();

  // 라우트 변경 시 효과음 정지 (단, success/failure 페이지 제외)
  useEffect(() => {
    // success나 failure 페이지로 이동하는 경우가 아닐 때만 효과음 정지
    if (location.pathname !== "/success" && location.pathname !== "/failure") {
      stopAllEffectSounds();
    }
  }, [location.pathname, stopAllEffectSounds]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* <Route path="/tutorial" element={<TutorialPage />} /> */}
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
