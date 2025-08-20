import logo from "../assets/logo.png";
import TryangleIcon from "../assets/tutorial/tryangle.svg?react";
import { useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";
import { useBGM } from "../contexts/BGMContext";

const ReadyPage = () => {
  const navigate = useNavigate();
  const { setPageContext } = useBGM();

  // 준비페이지는 기본 볼륨으로 설정
  useEffect(() => {
    setPageContext("ready");
  }, [setPageContext]);

  const handleNext = useCallback(() => {
    navigate("/easy-mode");
  }, [navigate]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key >= "1" && event.key <= "6") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleNext]);

  return (
    <div className="min-h-screen bg-[#F0F0F3] relative">
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
          <div className="mb-20 text-brand-gray text-center  font-bold">
            <p className="text-4xl mb-4">곧이어 퀴즈가 시작됩니다</p>
            <p className="text-4xl">준비되셨다면 키보드 버튼을 눌러주세요 :)</p>
          </div>
          {/* 다음 버튼 - LandingPage 버튼 스타일을 재사용하고 Figma 디자인에 맞게 수정 */}
          <TryangleIcon
            className="w-10 h-10 cursor-pointer animate-move-down mt-10"
            onClick={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default ReadyPage;
