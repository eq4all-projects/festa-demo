import { useEffect, useRef } from "react";
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

// eslint-disable-next-line react/prop-types
const WebGLPlayer = ({ onBackToHome, previewMode = false }) => {
  const canvasRef = useRef(null);

  const playAnimation = async (ani_name) => {
    await window.webGLPlayer.playAnimationByName(ani_name, (callback) => {
      console.log(callback);
    });
  };

  const handleReplay = () => {
    window.webGLPlayer.replay((callback) => {
      console.log(callback);
    });
  };

  const handleStop = () => {
    window.webGLPlayer.stop();
  };

  const handlePause = () => {
    window.webGLPlayer.pause();
  };

  const handleResume = () => {
    window.webGLPlayer.resume();
  };

  const handleChangeSpeed = () => {
    const speed = document.getElementById("speed").value;
    window.webGLPlayer.changePlaySpeed(Number(speed));
  };

  const handleRotateLeft = () => {
    window.webGLPlayer.rotateLeft();
  };

  const handleRotateRight = () => {
    window.webGLPlayer.rotateRight();
  };

  useEffect(() => {
    let animationFrameId;

    const initAndRender = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const webGLPlayer = new WebGLPlayerClass(canvas, {
        color: 0xffffff,
        alpha: 0.6,
      });
      window.webGLPlayer = webGLPlayer;

      const characterName = "Eve";

      await webGLPlayer.playerInit(
        characterName,
        "Eve_IFC_mall",
        (callback) => {
          console.log(callback, "ready");
        }
      );

      const render = () => {
        webGLPlayer.webGlRender();
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    };

    initAndRender();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

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
