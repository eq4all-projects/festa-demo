import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useBGM } from "../contexts/BGMContext";
import odapVideo from "../assets/video/오답.webm";

const FailurePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/"; // 이전 페이지 경로
  const [selectedButton, setSelectedButton] = useState(null);
  const { setPageContext, playFailSound } = useBGM();

  useEffect(() => {
    setPageContext("failure");
    // 페이지 진입 시 실패 사운드 재생
    playFailSound();
  }, [setPageContext, playFailSound]);

  const handleGoodChoice = useCallback(() => {
    if (selectedButton) return;
    setSelectedButton("good");
    // 이전 퀴즈 페이지로 돌아가되, 재시도임을 알리는 상태와 함께 전달
    setTimeout(() => navigate(from, { state: { isRetry: true } }), 500);
  }, [navigate, from, selectedButton]);

  const handleOkayChoice = useCallback(() => {
    if (selectedButton) return;
    setSelectedButton("okay");
    setTimeout(() => navigate("/final-fail"), 500);
  }, [navigate, selectedButton]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (selectedButton) return;

      if (event.key === "4") {
        handleGoodChoice();
      } else if (event.key === "5") {
        handleOkayChoice();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleGoodChoice, handleOkayChoice, selectedButton]);

  return (
    <div className="min-h-screen relative">
      <video
        src={odapVideo}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-screen object-cover"
        style={{ backgroundColor: "#000" }}
      />
      {/* 비디오 위에 투명한 오버레이로 키 이벤트 감지 */}
      <div className="absolute inset-0 bg-transparent" />
    </div>
  );
};

export default FailurePage;
