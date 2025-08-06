import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const ReadyPage = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/easy-mode");
  };

  return (
    <div className="min-h-screen bg-brand-bg relative">
      {/* EQ4ALL 로고 - LandingPage와 동일한 스타일 */}
      <div className="absolute top-8 right-8">
        <img
          src={logo}
          alt="EQ4ALL"
          className="h-10 w-auto filter brightness-0"
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex w-full h-full min-h-screen">
        {/* 오른쪽 콘텐츠 영역 */}
        <div className="w-full flex flex-col justify-center items-center px-20">
          {/* 메인 텍스트 - Figma 디자인에 맞춘 스타일 */}
          <div className="mb-16 text-brand-gray text-center">
            <p className="text-4xl font-normal mb-4">
              곧이어 퀴즈가 시작됩니다
            </p>
            <p className="text-4xl font-bold">
              준비되셨다면 다음 버튼을 눌러주세요 :)
            </p>
          </div>

          {/* 다음 버튼 - LandingPage 버튼 스타일을 재사용하고 Figma 디자인에 맞게 수정 */}
          <button
            onClick={handleNext}
            className="cursor-pointer px-32 py-5 text-2xl font-bold text-white bg-[#5A80CB] rounded-4xl shadow-lg hover:bg-[#4A6FBB] transition-all duration-300 active:scale-95"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadyPage;
