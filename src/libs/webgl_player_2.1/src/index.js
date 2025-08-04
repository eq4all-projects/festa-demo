import "./style.css";

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import WebGLPlayer from "./libs/WebGLPlayer";

import { queryStringList } from "./libs/APIs";

function WebGLPlayerComponent() {
  const canvasReference = useRef();

  useEffect(async () => {
    const canvas = canvasReference.current;

    /**
     *  4번째 인자값은 API System의 명칭
     *  1. AzureService
     *  2. CMS2.0
     **/
    const webGLPlayer = new WebGLPlayer(canvas, null, "", "AzureService");
    window.webGLPlayer = webGLPlayer;

    let queryList = queryStringList(location.search);
    let characterName = "Eve";
    let avatarName = "";

    if (queryList !== undefined) {
      if (queryList.character !== undefined)
        characterName = queryList.character;
      if (queryList.avatar !== undefined) avatarName = queryList.avatar;
    }

    await webGLPlayer.rendererSetting();
    await webGLPlayer.cameraAndOrbitControls();
    await webGLPlayer.loadModel(characterName, avatarName);
    await webGLPlayer.setLights();
    await webGLPlayer.applyLights();
    await webGLPlayer.setMixer();
    await webGLPlayer.setIdleAction();

    webGLPlayer.render();
  }, []);

  return (
    <>
      <div id="canvasContainer" style={{ height: "100%", width: "100%" }}>
        <canvas ref={canvasReference} />
      </div>
    </>
  );
}

// const root = createRoot(document.getElementById("webgl_signlanguage"));
// root.render(<WebGLPlayerComponent></WebGLPlayerComponent>);
