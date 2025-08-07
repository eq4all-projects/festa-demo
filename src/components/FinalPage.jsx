// 최종 성공 페이지
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FinalPage = () => {
  const navigate = useNavigate();

  // 5초 후 / 홈으로 이동
  useEffect(() => {
    setTimeout(() => {
      navigate("/");
    }, 5000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F0F0F3] relative">
      <div className="flex flex-col justify-center items-center min-h-screen px-6 md:px-12 lg:px-20 relative z-10">
        <div className="text-4xl font-bold text-black leading-relaxed tracking-tighter">
          영상으로 대체 - 축하합니다! 당신은 Sign Language Master 입니다!
        </div>
      </div>
    </div>
  );
};

export default FinalPage;
