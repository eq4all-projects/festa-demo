import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import WebGLPlayerClass from "../userInterface";

// 캐릭터와 아바타 매핑 정보
const CHARACTER_AVATARS = {
  Eve: ["Eve_사가페01", "Eve_사가페02"],
  Adam: ["Adam_사가페01", "Adam_사가페02"],
  // Jonathan: ["akaoB_Jonathan_Suit01"],
  // Clara: ["Clara_사가페"],
};

// 랜덤 캐릭터와 아바타 선택 함수
const getRandomCharacterAndAvatar = () => {
  const characters = Object.keys(CHARACTER_AVATARS);
  const randomCharacter =
    characters[Math.floor(Math.random() * characters.length)];
  const avatars = CHARACTER_AVATARS[randomCharacter];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

  return { character: randomCharacter, avatar: randomAvatar };
};

const easySentences = {
  사랑해요: "27903_G_사랑해",
  나비: "9950_W_나비",
  기차: "319_W_열차",
  대화: "7067_W_대화",
  반가워요: "1700_W_희열",
  바다: "26690_G_바다",
  앉다: "13555_W_앉다",
  라면: "3138_W_국수",
  존경해요: "1556_W_존경",
  집: "25996_G_집",
  좋다: "5025_W_좋다",
  커피: "26521_G_커피",
  바람: "232_W_선선하다",
  아침: "4231_W_일출",
  자동차: "24932_W_자동차",
  빵: "2490_W_빵",
  약속: "1267_W_이라야",
  배: "4642_W_선박",
  달팽이: "11273_W_달팽이",
  휴대폰: "3086_W_휴대폰",
  축하해요: "1826_W_축하",
  미안해요: "6009_W_죄송하다",
  알겠어요: "4214_W_인식",
  기억하다: "730_W_외우다",
  대단해요: "27587_G_대단하다",
  맛있어요: "3194_W_맛나다",
  행복해요: "1066_W_행복",
  잘했어요: "31043_G_잘하다",
  수영하다: "3839_W_헤엄",
  수고했어요: "29075_G_수고힘들다",
};

const hardSentences = {
  똑같다: "35367_G_똑같다",
  처음: "35219_G_처음",
  놀라다: "35226_G_놀라다",
  할말없다: "35329_G_할말없다",
  잊다: "35239_G_잊다",
  계략: "35265_G_계략",
  봤다: "35258_G_봤다",
  슬럼프: "35253_G_슬럼프",
  맛있다: "39943_G_맛있다",
  알다: "35216_G_알다",
  원망하다: "35228_G_원망",
  단념: "35231_G_체념",
  라이벌: "35238_G_원수",
  낭패: "35251_G_낭패",
  혐오: "35263_G_극혐",
  당연하다: "35268_G_당연하다",
  완벽하다: "35300_G_완벽하다",
  기다리다: "35302_G_기다리다",
  호흡: "35312_G_호흡",
  감동이다: "39927_G_감동",
};

// 하드모드 보기 그룹 정의
const hardModeOptionGroups = {
  // 그룹 1: 옮기다, 다르다, 차이, 반대
  똑같다: ["옮기다", "다르다", "차이", "반대"],

  // 그룹 2: 냄새, 코가 시리다, 코감기
  처음: ["냄새", "코가 시리다", "코감기"],

  // 그룹 3: 하품하다, 설레다, 기쁘다, 부럽다
  놀라다: ["하품하다", "설레다", "기쁘다", "부럽다"],

  // 그룹 4: 대화하다, 발언하다, 주장하다
  할말없다: ["대화하다", "발언하다", "주장하다"],

  // 그룹 5: 망각하다, 집중하다, 기억하다, 떠올리다
  잊다: ["망각하다", "집중하다", "기억하다", "떠올리다"],

  // 그룹 6: 계산, 단순, 정직, 솔직
  계략: ["계산", "단순", "정직", "솔직"],

  // 그룹 7: 말하다, 듣다, 알았다
  봤다: ["말하다", "듣다", "알았다"],

  // 그룹 8: 활력, 즐거움, 의욕, 우울
  슬럼프: ["활력", "즐거움", "의욕", "우울"],

  // 그룹 9: 어지럽다, 코감기, 재미있다, 즐겁다
  맛있다: ["어지럽다", "코감기", "재미있다", "즐겁다"],

  // 그룹 10: 망각하다, 착각하다, 모르다
  알다: ["망각하다", "착각하다", "모르다"],

  // 그룹 11: 속상하다, 감사하다, 존경하다
  원망하다: ["속상하다", "감사하다", "존경하다"],

  // 그룹 12: 희망, 욕심, 기대, 낭패, 바람
  단념: ["희망", "욕심", "기대", "낭패", "바람"],

  // 그룹 13: 조언, 충언, 욕심
  라이벌: ["조언", "충언", "욕심"],

  // 그룹 14: 콧물, 성공, 부러움, 시기
  낭패: ["콧물", "성공", "부러움", "시기"],

  // 그룹 15: 목감기, 선호, 의심, 의문
  혐오: ["목감기", "선호", "의심", "의문"],

  // 그룹 16: 우연, 낯설다, 궁금하다
  당연하다: ["우연", "낯설다", "궁금하다"],

  // 그룹 17: 충치, 부족하다, 결함, 치과
  완벽하다: ["충치", "부족하다", "결함", "치과"],

  // 그룹 18: 감자, 포기하다, 맛있다
  기다리다: ["감자", "포기하다", "맛있다"],

  // 그룹 19: 침묵, 정지, 무언, 의견
  호흡: ["침묵", "정지", "무언", "의견"],

  // 그룹 20: 부럽다, 대단하다, 기다리다
  감동이다: ["부럽다", "대단하다", "기다리다"],
};

export const playableWords = Object.keys(easySentences);
export const hardWords = Object.keys(hardSentences);
export { hardModeOptionGroups };

const WebGLPlayer = forwardRef(
  ({ onBackToHome, previewMode = false, sentence, animationName }, ref) => {
    const canvasRef = useRef(null);
    const playerRef = useRef(null);
    const loopTimeoutRef = useRef(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [currentCharacter, setCurrentCharacter] = useState(null);
    const [currentAvatar, setCurrentAvatar] = useState(null);

    // WebGL 콜백 처리 함수
    const handleWebGLCallback = useCallback(
      (callback, context = "unknown") => {
        console.log(`[WebGL ${context}]`, callback);

        // 오류 상태별 상세 처리
        switch (callback.status) {
          case 1: // play done
            console.log(`✅ [WebGL ${context}] 애니메이션 재생 완료`);
            break;
          case 2: // play stop
            console.log(`⏹️ [WebGL ${context}] 애니메이션 재생 중지`);
            break;
          case 3: // error: check request id
            console.error(
              `❌ [WebGL ${context}] 요청 ID 오류:`,
              callback.message
            );
            console.error("해결 방법: 애니메이션 파일명을 확인하세요");
            break;
          case 4: // error: check variable id
            console.error(
              `❌ [WebGL ${context}] 변수 ID 오류:`,
              callback.message
            );
            console.error("해결 방법: 애니메이션 변수 설정을 확인하세요");
            break;
          case 5: // error: unknown
            console.error(
              `❌ [WebGL ${context}] 알 수 없는 오류:`,
              callback.message
            );
            console.error(`🔍 현재 애니메이션 정보:`, {
              sentence: sentence,
              eq4File: sentence
                ? easySentences[sentence] || hardSentences[sentence]
                : "알 수 없음",
              character: currentCharacter,
              avatar: currentAvatar,
            });

            // alert 표시하고 2초 후 자동 새로고침
            alert("일시적인 오류가 발생하여 페이지를 새로고침합니다.");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            break;
          default:
            console.warn(`⚠️ [WebGL ${context}] 알 수 없는 상태:`, callback);
        }
      },
      [sentence, currentCharacter, currentAvatar]
    );

    // 수동 재생을 위한 함수 (반복 없음)
    const playAnimation = async (ani_name) => {
      if (playerRef.current) {
        if (loopTimeoutRef.current) {
          clearTimeout(loopTimeoutRef.current);
        }
        await playerRef.current.playAnimationByName(ani_name, (callback) => {
          handleWebGLCallback(callback, "playAnimation");
        });
      }
    };

    const handleReplay = () => {
      if (playerRef.current) {
        playerRef.current.replay((callback) => {
          handleWebGLCallback(callback, "replay");
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

    const handleResetPosition = () => {
      if (playerRef.current) {
        // 포지션 초기화 (카메라 회전을 0도로 리셋)
        playerRef.current.resetCameraRotation();
      }
    };

    // ref를 통해 외부에서 접근할 수 있는 메서드들 노출
    useImperativeHandle(ref, () => ({
      rotateLeft: handleRotateLeft,
      rotateRight: handleRotateRight,
      resetPosition: handleResetPosition,
    }));

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

        // 랜덤하게 캐릭터와 아바타 선택
        const { character, avatar } = getRandomCharacterAndAvatar();
        setCurrentCharacter(character);
        setCurrentAvatar(avatar);
        console.log(`Selected character: ${character}, avatar: ${avatar}`);

        await webGLPlayer.playerInit(character, avatar, (callback) => {
          handleWebGLCallback(callback, "ready");
          if (callback.status === 1) {
            setIsPlayerReady(true);
          }
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

      const allSentences = { ...easySentences, ...hardSentences };
      const ani_name_to_play = animationName || allSentences[sentence];

      if (ani_name_to_play) {
        const playLoop = () => {
          if (playerRef.current) {
            playerRef.current.playAnimationByName(
              ani_name_to_play,
              (callback) => {
                handleWebGLCallback(callback, "autoPlay");
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
        <div className="w-full h-full min-h-[600px] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full max-w-full max-h-full"
            style={{ minHeight: "600px", minWidth: "400px" }}
          />
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
              {Object.entries(easySentences).map(([text, data]) => (
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
  }
);

WebGLPlayer.displayName = "WebGLPlayer";

WebGLPlayer.propTypes = {
  onBackToHome: PropTypes.func,
  previewMode: PropTypes.bool,
  sentence: PropTypes.string,
  animationName: PropTypes.string,
};

export default WebGLPlayer;
