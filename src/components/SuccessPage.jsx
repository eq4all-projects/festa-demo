import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBGM } from "../contexts/BGMContext";
import jeongdapVideo from "../assets/video/정답.webm";

const SuccessPage = () => {
  const navigate = useNavigate();
  const { setPageContext, playSuccessSound } = useBGM();

  useEffect(() => {
    setPageContext("success");
    // 페이지 진입 시 성공 사운드 재생
    playSuccessSound();
  }, [setPageContext, playSuccessSound]);

  const handleNext = useCallback(() => {
    navigate("/hard-mode");
  }, [navigate]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "4") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleNext]);

  const handleExit = useCallback(() => {
    navigate("/final-fail");
  }, [navigate]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "5") {
        handleExit();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleExit]);

  return (
    <div className="min-h-screen relative">
      <video
        src={jeongdapVideo}
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

export default SuccessPage;
