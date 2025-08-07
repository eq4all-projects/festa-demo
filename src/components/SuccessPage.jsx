import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/hard-mode");
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "4") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleNext]);

  const handleHome = () => {
    navigate("/");
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "5") {
        handleHome();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleHome]);

  return (
    <div className="min-h-screen bg-green-100 flex flex-col justify-center items-center">
      <h1 className="text-5xl font-bold text-green-700 mb-8">정답입니다!</h1>
      <p className="text-2xl text-green-600 mb-12">
        다음 문제도 도전하시겠어요?
      </p>
      <div className="flex space-x-6">
        <button className="px-16 py-4 text-xl font-bold text-white bg-[#5A80CB] rounded-3xl shadow-lg hover:bg-[#4A6FBB] transition-all duration-300">
          넹
        </button>
        <button className="px-16 py-4 text-xl font-bold text-white bg-[#5A80CB] rounded-3xl shadow-lg hover:bg-[#4A6FBB] transition-all duration-300">
          집에 갈래요
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
