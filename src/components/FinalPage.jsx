// 최종 성공 페이지
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBGM } from "../contexts/BGMContext";
import wanlyoVideo from "../assets/video/완료.mp4";

const FinalPage = () => {
  const navigate = useNavigate();
  const { setPageContext } = useBGM();

  // 최종 성공 페이지는 기본 볼륨으로 설정
  useEffect(() => {
    setPageContext("final");
  }, [setPageContext]);

  // 10초 후 / 홈으로 이동
  useEffect(() => {
    setTimeout(() => {
      navigate("/");
    }, 10000);
  }, [navigate]);

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
