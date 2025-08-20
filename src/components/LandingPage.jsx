import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBGM } from "../contexts/BGMContext";
import introVideo from "../assets/video/intro.mp4";

const LandingPage = () => {
  const navigate = useNavigate();
  const { setPageContext } = useBGM();

  // 랜딩페이지는 기본 볼륨으로 설정
  useEffect(() => {
    setPageContext("landing");
  }, [setPageContext]);

  const handleNext = useCallback(() => {
    navigate("/ready");
  }, [navigate]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key >= "1" && event.key <= "6") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleNext]);

  return (
    <div className="min-h-screen relative">
      <video
        src={introVideo}
        autoPlay
        muted
        loop
        className="w-full h-screen object-cover"
      />
      {/* 비디오 위에 투명한 오버레이로 키 이벤트 감지 */}
      <div className="absolute inset-0 bg-transparent" />
    </div>
  );
};

export default LandingPage;
