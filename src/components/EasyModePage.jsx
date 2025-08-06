import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WebGLPlayer, { playableWords } from "./WebGLPlayer";
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

const EasyModePage = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showTimer, setShowTimer] = useState(false);

  // 문제 생성 및 설정
  useEffect(() => {
    const allWords = playableWords;
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
      navigate("/failure");
      return;
    }

    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showTimer, timeLeft, navigate]);

  // 정답 선택 핸들러
  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option.id);
    if (option.text === correctAnswer) {
      navigate("/success");
    } else {
      navigate("/failure");
    }
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
          <div className="mb-16 text-center">
            <div className="w-fit mx-auto bg-[#5A80CB] text-white px-8 py-2 rounded-4xl font-bold text-lg mb-4">
              easy mode
            </div>
            <p className="text-4xl font-extralight text-black leading-relaxed tracking-tighter">
              수어 영상을 보고 정답을 선택하세요
            </p>
          </div>

          <div className="space-y-4 mb-12 w-full max-w-md">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full px-8 py-5 text-2xl font-bold rounded-4xl shadow-lg transition-all duration-300 active:scale-95 ${
                  selectedAnswer === option.id
                    ? "bg-[#5A80CB] text-white"
                    : "bg-brand-bg text-brand-gray hover:bg-gray-200"
                }`}
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

export default EasyModePage;
