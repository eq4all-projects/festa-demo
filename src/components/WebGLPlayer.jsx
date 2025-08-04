import { useEffect, useRef } from "react";
import WebGLPlayerClass from "../userInterface";
import "../testPage.css";
import { Button, TextField, Box } from "@mui/material";
import { PlayArrow, Stop, Pause, Replay, Speed } from "@mui/icons-material";

const sentences = {
  "안녕하세요": "1085_W_안녕히계세요",
  "나비": "9950_W_나비",
  "기차": "319_W_열차",
  "대화": "7067_W_대화",
  "반가워요": "1700_W_희열",
  "바다": "26690_G_바다",
  "수어": "4940_W_수화",
  "라면": "3138_W_국수",
  "감사합니다": "25401_W_고맙다",
  "집": "25996_G_집",
  "좋다": "5025_W_좋다",
  "커피": "26521_G_커피",
  "사랑합니다": "27903_G_사랑해",
  "아침": "4231_W_일출",
  "자동차": "24932_W_자동차",
  "빵": "2490_W_빵",
  "존경합니다": "1556_W_존경",
  "배": "4642_W_선박",
  "농인": "13408_W_농아",
  "휴대폰": "3086_W_휴대폰"
};

const WebGLPlayer = () => {
  const canvasRef = useRef(null);

  const playAnimation = async (ani_name) => {
    await window.webGLPlayer.playAnimationByName(
      ani_name,
      (callback) => {
        console.log(callback);
      }
    );
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

      // playerInit이 완료될 때까지 기다립니다.
      await webGLPlayer.playerInit(characterName, "Eve_IFC_mall", (callback) => {
        console.log(callback, "ready");
      });

      // 초기화가 완료된 후에 렌더링 루프를 시작합니다.
      const render = () => {
        webGLPlayer.webGlRender();
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    };

    initAndRender();

    // 컴포넌트가 언마운트될 때 애니메이션 프레임을 정리합니다.
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <>
      <Box
        className="btn-controller"
        display="flex"
        flexDirection="row"
        alignItems="flex-start"
        m={3}
      >
        <Button
          onClick={handleReplay}
          variant="contained"
          color="primary"
          startIcon={<Replay />}
          style={{ marginBottom: "8px" }}
        >
          Replay
        </Button>
        <Button
          onClick={handleStop}
          variant="contained"
          color="error"
          startIcon={<Stop />}
          style={{ marginBottom: "8px" }}
        >
          Stop
        </Button>
        <Button
          onClick={handlePause}
          variant="contained"
          color="warning"
          startIcon={<Pause />}
          style={{ marginBottom: "8px" }}
        >
          Pause
        </Button>
        <Button
          onClick={handleResume}
          variant="contained"
          color="success"
          startIcon={<PlayArrow />}
          style={{ marginBottom: "8px" }}
        >
          Resume
        </Button>
        <TextField
          id="speed"
          label="Speed"
          variant="outlined"
          placeholder="min:0.1 / max:3"
          type="number"
          inputProps={{ step: "0.1", min: "0.1", max: "3" }}
          style={{ marginBottom: "8px", width: "150px" }}
        />
        <Button
          onClick={handleChangeSpeed}
          variant="contained"
          color="info"
          startIcon={<Speed />}
          style={{ marginBottom: "8px" }}
        >
          Change speed
        </Button>
      </Box>
      <div className="container">
        <div>
          {Object.entries(sentences).map(([text, data]) => (
            <button key={text} onClick={() => playAnimation(data)}>
              {text}
            </button>
          ))}
        </div>
        <div id="canvasContainer">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </>
  );
};

export default WebGLPlayer;
