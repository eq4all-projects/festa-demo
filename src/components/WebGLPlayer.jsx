import { useEffect, useRef, useState } from "react";
import WebGLPlayerClass from "../userInterface";

const sentences = {
  안녕하세요: "1085_W_안녕히계세요",
  나비: "9950_W_나비",
  기차: "319_W_열차",
  대화: "7067_W_대화",
  반가워요: "1700_W_희열",
  바다: "26690_G_바다",
  수어: "4940_W_수화",
  라면: "3138_W_국수",
  감사합니다: "25401_W_고맙다",
  집: "25996_G_집",
  좋다: "5025_W_좋다",
  커피: "26521_G_커피",
  사랑합니다: "27903_G_사랑해",
  아침: "4231_W_일출",
  자동차: "24932_W_자동차",
  빵: "2490_W_빵",
  존경합니다: "1556_W_존경",
  배: "4642_W_선박",
  농인: "13408_W_농아",
  휴대폰: "3086_W_휴대폰",
};

const hardSentences = {
  축하해요: "1826_W_축하",
  미안해요: "6009_W_죄송하다",
  알았어요: "4214_W_인식",
  모르겠어요: "13619_W_모르다",
  대단해요: "27587_G_대단하다",
  맛있어요: "3194_W_맛나다",
  행복해요: "1066_W_행복",
  잘했어요: "31043_G_잘하다",
  수영하다: "3839_W_헤엄",
  수고했어요: "29075_G_수고힘들다",
};

export const playableWords = Object.keys(sentences);
export const hardWords = Object.keys(hardSentences);

// eslint-disable-next-line react/prop-types
const WebGLPlayer = ({
  onBackToHome,
  previewMode = false,
  sentence,
  animationName,
}) => {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const loopTimeoutRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // 수동 재생을 위한 함수 (반복 없음)
  const playAnimation = async (ani_name) => {
    if (playerRef.current) {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
      await playerRef.current.playAnimationByName(ani_name, (callback) => {
        console.log(callback);
      });
    }
  };

  const handleReplay = () => {
    if (playerRef.current) {
      playerRef.current.replay((callback) => {
        console.log(callback);
      });
    }
  };

  const handleStop = () => {
    if (playerRef.current) {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
      playerRef.current.stop();
    }
  };

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const handleResume = () => {
    if (playerRef.current) {
      playerRef.current.resume();
    }
  };

  const handleChangeSpeed = () => {
    const speed = document.getElementById("speed").value;
    if (playerRef.current) {
      playerRef.current.changePlaySpeed(Number(speed));
    }
  };

  const handleRotateLeft = () => {
    if (playerRef.current) {
      playerRef.current.rotateLeft();
    }
  };

  const handleRotateRight = () => {
    if (playerRef.current) {
      playerRef.current.rotateRight();
    }
  };

  // WebGL 플레이어 초기화 Effect
  useEffect(() => {
    let animationFrameId;

    const initAndRender = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const webGLPlayer = new WebGLPlayerClass(canvas, {
        color: "#F0F0F3",
        alpha: 0.6,
      });
      playerRef.current = webGLPlayer;

      await webGLPlayer.playerInit("Eve", "Eve", (callback) => {
        console.log(callback, "ready");
        setIsPlayerReady(true);
      });

      const render = () => {
        if (playerRef.current) {
          playerRef.current.webGlRender();
        }
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    };

    initAndRender();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
      if (playerRef.current) {
        playerRef.current.unloadFBXModel();
        playerRef.current = null;
      }
    };
  }, []);

  // 자동 재생 Effect (sentence 또는 animationName 기반)
  useEffect(() => {
    if (!isPlayerReady) return;

    const allSentences = { ...sentences, ...hardSentences };
    const ani_name_to_play = animationName || allSentences[sentence];

    if (ani_name_to_play) {
      const playLoop = () => {
        if (playerRef.current) {
          playerRef.current.playAnimationByName(
            ani_name_to_play,
            (callback) => {
              console.log(callback);
              // sentence 기반의 previewMode일 때만 반복
              if (callback.status === 1 && previewMode) {
                loopTimeoutRef.current = setTimeout(playLoop, 2500);
              }
            }
          );
        }
      };

      const initialPlayTimeout = setTimeout(playLoop, 800);

      return () => {
        clearTimeout(initialPlayTimeout);
        if (loopTimeoutRef.current) {
          clearTimeout(loopTimeoutRef.current);
        }
        if (playerRef.current) {
          playerRef.current.stop();
        }
      };
    }
  }, [isPlayerReady, sentence, animationName, previewMode]);

  if (previewMode) {
    return (
      <div className="w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extra-bold text-brand-gray tracking-tighter">
          Sign Master Challenge
        </h1>
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors"
          >
            ← 홈으로
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4 mb-4 bg-gray-100 rounded-lg shadow">
        <button
          onClick={handleReplay}
          className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Replay
        </button>
        <button
          onClick={handleStop}
          className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Stop
        </button>
        <button
          onClick={handlePause}
          className="px-4 py-2 font-semibold text-white bg-yellow-500 rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
        >
          Pause
        </button>
        <button
          onClick={handleResume}
          className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Resume
        </button>
        <div className="flex items-center gap-2">
          <input
            id="speed"
            type="number"
            step="0.1"
            min="0.1"
            max="3"
            placeholder="Speed (0.1-3)"
            className="w-32 px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleChangeSpeed}
            className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            Set Speed
          </button>
        </div>
        <button
          onClick={handleRotateLeft}
          className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Rotate Left
        </button>
        <button
          onClick={handleRotateRight}
          className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Rotate Right
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm h-[800px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(sentences).map(([text, data]) => (
              <button
                key={text}
                onClick={() => playAnimation(data)}
                className="w-full p-3 text-left text-white bg-sky-500 rounded-md shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full h-[800px] bg-gray-200 rounded-lg shadow-sm overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default WebGLPlayer;
