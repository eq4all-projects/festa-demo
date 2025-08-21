import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBGM } from "../contexts/BGMContext";
import jeongdapVideo from "../assets/video/정답.webm";

const SuccessPage = () => {
  const navigate = useNavigate();
  const { setPageContext, playSuccessSound } = useBGM();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    setPageContext("success");
    // 페이지 진입 시 성공 사운드 재생
    playSuccessSound();
  }, [setPageContext, playSuccessSound]);

  const handleNext = useCallback(() => {
    if (hasNavigated) return; // 이미 이동했다면 중복 실행 방지
    setHasNavigated(true);
    navigate("/hard-mode");
  }, [navigate, hasNavigated]);

  const handleExit = useCallback(() => {
    if (hasNavigated) return; // 이미 이동했다면 중복 실행 방지
    setHasNavigated(true);
    navigate("/final-fail");
  }, [navigate, hasNavigated]);

  // 통합된 키 입력 핸들러 (디바운싱 처리)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (hasNavigated) return; // 이미 이동했다면 무시

      if (event.key === "4") {
        handleNext();
      } else if (event.key === "5") {
        handleExit();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleNext, handleExit, hasNavigated]);

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
