import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import WebGLPlayer from "./WebGLPlayer";

const FailurePage = () => {
  const navigate = useNavigate();

  const handleGoodChoice = () => {
    navigate("/easy-mode");
  };

  const handleOkayChoice = () => {
    navigate("/final-fail");
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

      {/* 메인 콘텐츠 */}
      <div className="flex w-full h-full min-h-screen">
        <div className="w-[50%] flex justify-center items-center bg-brand-bg px-12">
          <WebGLPlayer animationName={"2147_W_애석"} previewMode={true} />
        </div>
        <div className="w-[50%] flex flex-col justify-center items-center px-12">
          {/* 메인 텍스트 */}
          <div className="mb-16 text-center">
            <p className="text-4xl font-bold text-brand-gray leading-relaxed tracking-tighter mb-4">
              아쉽지만 다음 기회에...
            </p>
            <p className="text-2xl font-extralight text-brand-gray leading-relaxed tracking-tighter">
              한 번 더 도전하시겠어요?
            </p>
          </div>

          {/* 선택 버튼들 */}
          <div className="flex space-x-6 w-[65%] gap-12">
            <button
              onClick={handleGoodChoice}
              className="flex-1 px-6 py-4 text-2xl font-semibold text-white bg-[#5A80CB] rounded-4xl transition-all duration-300 active:scale-95"
              style={{
                boxShadow:
                  "10px 10px 30px 0px rgba(174, 174, 192, 0.4), -10px -10px 30px 0px rgba(255, 255, 255, 1)",
              }}
            >
              1. 좋아요
            </button>
            <button
              onClick={handleOkayChoice}
              className="flex-1 px-6 py-4 text-2xl font-semibold text-white bg-[#676767] rounded-4xl transition-all duration-300 active:scale-95"
              style={{
                boxShadow:
                  "10px 10px 30px 0px rgba(174, 174, 192, 0.4), -10px -10px 30px 0px rgba(255, 255, 255, 1)",
              }}
            >
              2. 괜찮아요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailurePage;
