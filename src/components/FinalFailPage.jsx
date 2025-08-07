import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const FinalFailPage = () => {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-brand-bg relative flex flex-col justify-center items-center">
      {/* EQ4ALL 로고 */}
      <div className="absolute top-8 right-8">
        <img
          src={logo}
          alt="EQ4ALL"
          className="h-10 w-auto filter brightness-0"
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="text-center">
        <p className="text-5xl font-bold text-brand-gray mb-8">
          영상으로 대체 - 그래도 멋진 도전이었어요.
        </p>
        <p className="text-2xl text-brand-gray mb-12">
          다음 기회에 꼭 성공해보세요
        </p>
        <button
          onClick={goToHome}
          className="cursor-pointer px-24 py-5 text-2xl font-bold text-white bg-[#5A80CB] rounded-4xl shadow-lg hover:bg-[#4A6FBB] transition-all duration-300 active:scale-95"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default FinalFailPage;
