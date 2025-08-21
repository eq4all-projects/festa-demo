import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBGM } from "../contexts/BGMContext";
import sugeoVideo from "../assets/video/수고.webm";

const FinalFailPage = () => {
  const navigate = useNavigate();
  const { setPageContext } = useBGM();

  // 최종 실패 페이지는 기본 볼륨으로 설정
  useEffect(() => {
    setPageContext("final-fail");
  }, [setPageContext]);

  const goToHome = () => {
    navigate("/");
  };

  useEffect(() => {
    setTimeout(() => {
      navigate("/");
    }, 5000);
  }, [navigate]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key >= "1" && event.key <= "6") {
        goToHome();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [goToHome]);

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
