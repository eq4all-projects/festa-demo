// 최종 성공 페이지
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBGM } from "../contexts/BGMContext";
import wanlyoVideo from "../assets/video/완료.webm";

const FinalPage = () => {
  const navigate = useNavigate();
  const { setPageContext } = useBGM();
  const timeoutRef = useRef(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isReady, setIsReady] = useState(false); // 그레이스 피리어드용 상태

  // 최종 성공 페이지는 기본 볼륨으로 설정
  useEffect(() => {
    setPageContext("final");
  }, [setPageContext]);

  // 그레이스 피리어드: 페이지 마운트 후 500ms 후에 키 입력 활성화
  useEffect(() => {
    const gracePeriodTimer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(gracePeriodTimer);
  }, []);

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

  // 15초 후 자동 홈 이동 타이머
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!hasNavigated) {
        setHasNavigated(true);
        navigate("/");
      }
    }, 15000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigate, hasNavigated]);

  // 키 입력 핸들러 (향상된 디바운싱 처리)
  useEffect(() => {
    let lastKeyPressTime = 0;
    const DEBOUNCE_DELAY = 500; // 500ms 디바운싱

    const handleKeyPress = (event) => {
      if (!isReady || hasNavigated) return; // 그레이스 피리어드 중이거나 이미 이동했다면 무시

      const currentTime = Date.now();
      if (currentTime - lastKeyPressTime < DEBOUNCE_DELAY) {
        return; // 너무 빠른 연속 입력 무시
      }
      lastKeyPressTime = currentTime;

      if (event.key >= "1" && event.key <= "6") {
        goToHome();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [hasNavigated, goToHome, isReady]);

  return (
    <div className="min-h-screen relative">
      <video
        src={wanlyoVideo}
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

export default FinalPage;
