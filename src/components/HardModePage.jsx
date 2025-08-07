import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WebGLPlayer, { hardWords } from "./WebGLPlayer";
import logo from "../assets/logo.png";

// 배열을 섞는 함수 (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const HardModePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRetry = location.state?.isRetry || false;

  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showTimer, setShowTimer] = useState(false);

  // 문제 생성 및 설정
  useEffect(() => {
    const allWords = hardWords;
    const shuffledWords = shuffleArray(allWords);
    const selectedOptions = shuffledWords.slice(0, 3).map((word, index) => ({
      id: index + 1,
      text: word,
    }));

    setOptions(selectedOptions);
    const randomCorrectAnswer =
      selectedOptions[Math.floor(Math.random() * selectedOptions.length)];
    setCorrectAnswer(randomCorrectAnswer.text);
  }, []);

  // 전체 타이머 로직 (20초)
  useEffect(() => {
    // 10초 후에 타이머를 표시하고 카운트다운 시작
    const timerVisibilityTimeout = setTimeout(() => {
      setShowTimer(true);
    }, 10000);

    return () => clearTimeout(timerVisibilityTimeout);
  }, []);

  // 10초 카운트다운 로직
  useEffect(() => {
    if (!showTimer) return;

    if (timeLeft === 0) {
      if (isRetry) {
        navigate("/final-fail");
      } else {
        navigate("/failure", { state: { from: location.pathname } });
      }
      return;
    }

    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showTimer, timeLeft, navigate, isRetry, location.pathname]);

  // 정답 선택 핸들러
  const handleAnswerSelect = useCallback(
    (option) => {
      if (!option || selectedAnswer) return; // 이미 선택했다면 중복 실행 방지

      setSelectedAnswer(option.id);

      // 0.5초 후 결과 페이지로 이동 (선택 효과를 보여주기 위함)
      setTimeout(() => {
        if (option.text === correctAnswer) {
          navigate("/final");
        } else {
          if (isRetry) {
            navigate("/final-fail");
          } else {
            navigate("/failure", { state: { from: location.pathname } });
          }
        }
      }, 500);
    },
    [correctAnswer, navigate, selectedAnswer, isRetry, location.pathname]
  );

  // 키패드 입력 핸들러
  useEffect(() => {
    const handleKeyPress = (event) => {
      const keyMap = {
        4: 0, // 키패드 4 -> 보기 1 (options 배열의 0번 인덱스)
        5: 1, // 키패드 5 -> 보기 2 (options 배열의 1번 인덱스)
        6: 2, // 키패드 6 -> 보기 3 (options 배열의 2번 인덱스)
      };
      const optionIndex = keyMap[event.key];

      if (optionIndex !== undefined && options[optionIndex]) {
        handleAnswerSelect(options[optionIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [options, handleAnswerSelect]);

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

      {/* 타이머 (10초 남았을 때 우측 하단에 표시) */}
      {showTimer && (
        <div className="absolute bottom-8 right-8">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                className="text-[#D9E1EF]"
                strokeWidth="15"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              {/* Progress circle */}
              <circle
                className="text-[#698FD7] timer-progress-circle"
                strokeWidth="15"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset="0"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
                transform="rotate(-90 50 50)"
              />
            </svg>
            {/* Timer number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#698FD7] text-4xl font-extrabold">
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex w-full h-full min-h-screen">
        {/* 왼쪽 WebGL 영역 */}
        <div className="w-[50%] flex justify-center items-center bg-brand-bg px-12">
          {correctAnswer && (
            <WebGLPlayer sentence={correctAnswer} previewMode={true} />
          )}
        </div>

        {/* 오른쪽 콘텐츠 영역 */}
        <div className="w-[50%] flex flex-col justify-center items-center">
          <div className="mb-14 text-center">
            <div className="w-fit mx-auto bg-[#5A80CB] text-white px-8 py-2 rounded-4xl font-bold text-lg mb-4">
              HARD MODE
            </div>
            <p className="text-4xl font-bold text-black leading-relaxed tracking-tighter mt-8">
              왼쪽 수어를 보고 맞는 뜻을 골라주세요
            </p>
          </div>

          <div className="space-y-12 mb-12 w-full max-w-md">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option)}
                className={`flex justify-center items-center mx-auto w-75 px-6 py-5 text-2xl font-bold rounded-4xl transition-all duration-300 active:scale-95 ${
                  selectedAnswer === option.id
                    ? "text-white bg-[#5A80CB] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.3)]"
                    : "bg-[#F0F0F3] text-black shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.8)] hover:shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)] active:shadow-[inset_8px_8px_16px_rgba(163,177,198,0.6),inset_-8px_-8px_16px_rgba(255,255,255,0.8)]"
                }`}
                disabled={selectedAnswer !== null} // 한 번 선택하면 비활성화
              >
                {option.id}. {option.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardModePage;
