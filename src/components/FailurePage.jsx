import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import logo from "../assets/logo.png";
import WebGLPlayer from "./WebGLPlayer";

const FailurePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/"; // 이전 페이지 경로
  const [selectedButton, setSelectedButton] = useState(null);

  const handleGoodChoice = useCallback(() => {
    if (selectedButton) return;
    setSelectedButton("good");
    // 이전 퀴즈 페이지로 돌아가되, 재시도임을 알리는 상태와 함께 전달
    setTimeout(() => navigate(from, { state: { isRetry: true } }), 500);
  }, [navigate, from, selectedButton]);

  const handleOkayChoice = useCallback(() => {
    if (selectedButton) return;
    setSelectedButton("okay");
    setTimeout(() => navigate("/final-fail"), 500);
  }, [navigate, selectedButton]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (selectedButton) return;

      if (event.key === "4") {
        handleGoodChoice();
      } else if (event.key === "5") {
        handleOkayChoice();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleGoodChoice, handleOkayChoice, selectedButton]);

  return (
    <div className="min-h-screen bg-[#F0F0F3] relative">
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
              disabled={selectedButton !== null}
              className={`flex-1 px-6 py-4 text-2xl font-semibold text-white bg-[#5A80CB] rounded-4xl transition-all duration-300 active:scale-95 ${
                selectedButton === "good"
                  ? "ring-4 ring-offset-2 ring-blue-400"
                  : ""
              }`}
              style={{
                boxShadow:
                  "10px 10px 30px 0px rgba(174, 174, 192, 0.4), -10px -10px 30px 0px rgba(255, 255, 255, 1)",
              }}
            >
              1. 좋아요
            </button>
            <button
              onClick={handleOkayChoice}
              disabled={selectedButton !== null}
              className={`flex-1 px-6 py-4 text-2xl font-semibold text-white bg-[#676767] rounded-4xl transition-all duration-300 active:scale-95 ${
                selectedButton === "okay"
                  ? "ring-4 ring-offset-2 ring-gray-400"
                  : ""
              }`}
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
