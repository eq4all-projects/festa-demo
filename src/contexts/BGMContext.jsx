import { createContext, useContext, useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import bgmAudio from "../assets/music/bgm.ogg";
import countdownAudio from "../assets/music/countdown.ogg";
import successAudio from "../assets/music/success.ogg";
import failAudio from "../assets/music/fail.ogg";

const BGMContext = createContext();

export const BGMProvider = ({ children }) => {
  const audioRef = useRef(null);
  1;
  const countdownRef = useRef(null);
  const successRef = useRef(null);
  const failRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentPage, setCurrentPage] = useState("");
  const [isCountdownPlaying, setIsCountdownPlaying] = useState(false);

  useEffect(() => {
    // BGM 오디오 엘리먼트 생성
    audioRef.current = new Audio(bgmAudio);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // 카운트다운 오디오 엘리먼트 생성
    countdownRef.current = new Audio(countdownAudio);
    countdownRef.current.volume = 0.7; // 카운트다운 사운드는 조금 크게

    // 효과음 오디오 엘리먼트 생성
    successRef.current = new Audio(successAudio);
    successRef.current.volume = 0.8; // 성공 사운드

    failRef.current = new Audio(failAudio);
    failRef.current.volume = 0.8; // 실패 사운드

    let userInteractionHandler = null;

    // 자동 재생 시도
    const tryAutoPlay = async () => {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.log(
          "자동 재생이 차단되었습니다. 사용자 상호작용 시 재생됩니다."
        );

        // 자동재생이 실패하면 사용자 상호작용 시 재생되도록 이벤트 리스너 추가
        userInteractionHandler = async () => {
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            // 한 번 재생되면 이벤트 리스너 제거
            document.removeEventListener("click", userInteractionHandler);
            document.removeEventListener("keydown", userInteractionHandler);
            document.removeEventListener("touchstart", userInteractionHandler);
          } catch (err) {
            console.error("사용자 상호작용 후에도 재생 실패:", err);
          }
        };

        document.addEventListener("click", userInteractionHandler);
        document.addEventListener("keydown", userInteractionHandler);
        document.addEventListener("touchstart", userInteractionHandler);
      }
    };

    tryAutoPlay();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (countdownRef.current) {
        countdownRef.current.pause();
        countdownRef.current = null;
      }
      if (successRef.current) {
        successRef.current.pause();
        successRef.current = null;
      }
      if (failRef.current) {
        failRef.current.pause();
        failRef.current = null;
      }
      // 이벤트 리스너 정리
      if (userInteractionHandler) {
        document.removeEventListener("click", userInteractionHandler);
        document.removeEventListener("keydown", userInteractionHandler);
        document.removeEventListener("touchstart", userInteractionHandler);
      }
    };
  }, []);

  // 볼륨 변경
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = async () => {
    if (audioRef.current && !isPlaying) {
      try {
        // 볼륨 설정 확인
        audioRef.current.volume = volume;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("오디오 재생 실패:", error);
      }
    }
  };

  const pause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const setVolumeLevel = (newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  };

  const playCountdown = async () => {
    if (countdownRef.current && !isCountdownPlaying) {
      try {
        countdownRef.current.currentTime = 0; // 처음부터 재생
        await countdownRef.current.play();
        setIsCountdownPlaying(true);

        // 카운트다운 끝났을 때 상태 업데이트
        countdownRef.current.onended = () => {
          setIsCountdownPlaying(false);
        };
      } catch (error) {
        console.error("카운트다운 사운드 재생 실패:", error);
      }
    }
  };

  const stopCountdown = () => {
    if (countdownRef.current && isCountdownPlaying) {
      countdownRef.current.pause();
      countdownRef.current.currentTime = 0;
      setIsCountdownPlaying(false);
    }
  };

  const playSuccessSound = async () => {
    if (successRef.current) {
      try {
        successRef.current.currentTime = 0; // 처음부터 재생
        await successRef.current.play();
      } catch (error) {
        console.error("성공 사운드 재생 실패:", error);
      }
    }
  };

  const playFailSound = async () => {
    if (failRef.current) {
      try {
        failRef.current.currentTime = 0; // 처음부터 재생
        await failRef.current.play();
      } catch (error) {
        console.error("실패 사운드 재생 실패:", error);
      }
    }
  };

  const stopAllEffectSounds = () => {
    // 모든 효과음 정지
    if (successRef.current) {
      successRef.current.pause();
      successRef.current.currentTime = 0;
    }
    if (failRef.current) {
      failRef.current.pause();
      failRef.current.currentTime = 0;
    }
  };

  const setPageContext = (page) => {
    setCurrentPage(page);

    // 퀴즈 및 결과 페이지에서는 볼륨을 20%로 줄임
    if (
      page === "easy-mode" ||
      page === "hard-mode" ||
      page === "failure" ||
      page === "success"
    ) {
      setVolumeLevel(0.2);
    } else {
      // 기본 페이지들 (landing, ready, final, final-fail 등)은 기본 볼륨 50%
      setVolumeLevel(0.5);
    }
  };

  const value = {
    isPlaying,
    volume,
    currentPage,
    isCountdownPlaying,
    play,
    pause,
    setVolumeLevel,
    setPageContext,
    playCountdown,
    stopCountdown,
    playSuccessSound,
    playFailSound,
    stopAllEffectSounds,
  };

  return <BGMContext.Provider value={value}>{children}</BGMContext.Provider>;
};

BGMProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useBGM = () => {
  const context = useContext(BGMContext);
  if (!context) {
    throw new Error("useBGM must be used within a BGMProvider");
  }
  return context;
};
