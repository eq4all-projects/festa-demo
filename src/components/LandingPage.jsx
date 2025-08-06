import { useNavigate } from "react-router-dom";
import WebGLPlayer from "./WebGLPlayer";
import logo from "../assets/logo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/tutorial");
  };

  return (
    <div className="min-h-screen bg-brand-bg relative">
      {/* EQ4ALL 로고 */}
      <div className="absolute top-8 right-8">
        <img
          src={logo}
          alt="EQ4ALL"
          className="h-10 w-auto filter brightness-0"
        />
      </div>

      {/* 메인 콘텐츠 - 5:5 비율 */}
      <div className="flex w-full h-full min-h-screen">
        {/* 왼쪽 아바타 영역 - 50% */}
        <div className="w-[40%] flex justify-center items-center bg-brand-bg">
          <div className="w-full h-full">
            <WebGLPlayer previewMode={true} />
          </div>
        </div>

        {/* 오른쪽 콘텐츠 영역 - 50% */}
        <div className="w-[60%] flex flex-col justify-center items-center px-20 bg-brand-bg">
          {/* 메인 제목 */}
          <p className="text-6xl font-bold mb-8 text-brand-gray leading-tight tracking-tighter">
            Sign Master Challenge
          </p>

          {/* 부제목 */}
          <div className="mb-12 text-brand-gray text-3xl text-center">
            <p className="mb-2">당신의 수어 감각을 테스트 해보세요!</p>
            <p className="font-bold">지금 도전하고 작은 선물도 받아가세요!</p>
          </div>

          {/* 시작하기 버튼 */}
          <button
            onClick={handleStart}
            className="cursor-pointer px-32 py-5 text-2xl font-bold text-white bg-[#5A80CB] rounded-4xl shadow-lg hover:bg-[#4A6FBB] transition-all duration-300 active:scale-95"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
