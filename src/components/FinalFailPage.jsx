import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBGM } from "../contexts/BGMContext";
import sugeoVideo from "../assets/video/수고.webm";

const FinalFailPage = () => {
  const navigate = useNavigate();
  const { setPageContext } = useBGM();
  const timeoutRef = useRef(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  // 최종 실패 페이지는 기본 볼륨으로 설정
  useEffect(() => {
    setPageContext("final-fail");
  }, [setPageContext]);

  const goToHome = useCallback(() => {
    if (hasNavigated) return; // 이미 이동했다면 중복 실행 방지

    setHasNavigated(true);

    // 타이머가 있다면 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    navigate("/");
  }, [navigate, hasNavigated]);

  // 10초 후 자동 홈 이동 타이머
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!hasNavigated) {
        setHasNavigated(true);
        navigate("/");
      }
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigate, hasNavigated]);

  // 키 입력 핸들러 (디바운싱 처리)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (hasNavigated) return; // 이미 이동했다면 무시

      if (event.key >= "1" && event.key <= "6") {
        goToHome();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [hasNavigated, goToHome]);

  return (
    <div className="min-h-screen relative">
      <video
        src={sugeoVideo}
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

export default FinalFailPage;
