import webGLPlayer from "./libs/webgl_player_2.1/src/libs/WebGLPlayer";

export default class WebGLPlayer {
  constructor(canvasReference, initialColor, workerPath) {
    this.canvas = canvasReference;
    this.initialColor = initialColor;
    this.workerPath = workerPath;
    this.webGLPlayer;
    this.container = canvasReference.parentNode;

    this.prevInput = "";
    this.prevPlaySpeed = 1;
  }

  async playerInit(character, avatar, callback) {
    let characterName = "Eve";
    let avatarName = "";
    if (character) {
      characterName = character;
    }
    if (avatar) {
      avatarName = avatar;
    }

    let cameraSettings = {
      camera: null,
      cameraOffset: 1,
      cameraDistance: 210,
      cameraZoomLevel: 1,
      cameraFOV: 35,
      cameraFar: 5000,
      cameraNear: 0.3,
      cameraXTarget: 0,
      cameraYTarget: 165,
      camerasSetting: null,
      orbitControlsTarget: [0, 147, 0],
    };

    try {
      this.webGLPlayer = new webGLPlayer(
        this.canvas,
        this.initialColor,
        this.workerPath,
        "AzureService",
        0.3
      );

      await this.webGLPlayer.modifyCameraDefault(cameraSettings);
      await this.webGLPlayer.rendererSetting();
      await this.webGLPlayer.cameraAndOrbitControls();
      await this.webGLPlayer.loadModel(characterName, avatarName, 0.3);
      await this.webGLPlayer.setLights();
      await this.webGLPlayer.applyLights();
      await this.webGLPlayer.setMixer();
      await this.webGLPlayer.setIdleAction();

      await this.webGLPlayer.webGLMixer.initialDisconnectPanel(this.container);

      this.container.style["pointer-events"] = "none";

      // playerInit에 render 함수 삭제
      this.webGLPlayer.render();
      this.changeBackgroundColor(
        this.initialColor.color,
        this.initialColor.alpha
      );
      if (callback) {
        // callback(1);
        callback({ status: 1, message: "avatar load success" });
        this.webGLPlayer.removeTimeout();
      }
    } catch (e) {
      // console.log(e);
      if (callback) {
        // callback(5);
        callback({ status: 5, message: "error: avatar load fail" });
      }
    }
  }

  async setSentence(id, version, level, dynamicVariables, callback) {
    await this.webGLPlayer.setSentence(
      id,
      version,
      level,
      dynamicVariables,
      callback
    );
  }

  async playAnimationByName(ani_name, callback) {
    await this.webGLPlayer.playAnimationByName(ani_name, callback);
  }

  async sendSentenceIdToPlayer(sentenceId, callback, variable) {
    this.prevInput = sentenceId;
    this.preVariable = variable;
    this.webGLPlayer.webGLMixer.playerStatus = 0;
    // id, version, level, dynamicVariables, callback;
    await this.webGLPlayer.setSentence(
      sentenceId,
      0.3,
      "Sentence",
      variable,
      callback
    );
  }

  async replay(callback) {
    this.webGLPlayer.webGLMixer.playerStatus = 0;
    await this.webGLPlayer.setSentence(
      this.prevInput,
      0.3,
      "Sentence",
      this.preVariable,
      callback
    );
  }

  async pause() {
    this.prevPlaySpeed = this.webGLPlayer.webGLMixer.playSpeed;
    await this.webGLPlayer.webGLMixer.setMixerTimeScale(0);
  }

  async resume() {
    await this.webGLPlayer.webGLMixer.setMixerTimeScale(this.prevPlaySpeed);
  }

  async stop() {
    if (this.webGLPlayer.webGLMixer.playerStatus === 0)
      this.webGLPlayer.webGLMixer.playerStatus = 2;
    await this.webGLPlayer.stopPlaySentence();
  }
  async stopPlaySentence() {
    if (this.webGLPlayer.webGLMixer.playerStatus === 0)
      this.webGLPlayer.webGLMixer.playerStatus = 2;
    await this.webGLPlayer.stopPlaySentence();
  }

  async changeRenderCanvas(canvasID) {
    this.webGLPlayer.container = document.getElementById(canvasID);
    this.webGLPlayer.container.append(this.webGLPlayer.renderer.domElement);
    // this.resize();
  }

  async changeBackgroundColor(color, alpha) {
    this.webGLPlayer.renderer.setClearColor(color, alpha);
  }

  async changePlaySpeed(speed) {
    let playSpeed = Number(speed);
    if (playSpeed < 0.1) playSpeed = 0.1;
    if (playSpeed > 3) playSpeed = 3;
    this.webGLPlayer.webGLMixer.playSpeed = playSpeed;
    await this.webGLPlayer.webGLMixer.setMixerTimeScale(
      this.webGLPlayer.webGLMixer.playSpeed
    );
  }

  async rotateLeft() {
    await this.webGLPlayer.rotateLeft();
  }

  async rotateRight() {
    await this.webGLPlayer.rotateRight();
  }

  // 함수추가
  // 2024.04.11 scene 메모리 해제
  async unloadFBXModel() {
    if (this.webGLPlayer.webGLMixer) {
      this.webGLPlayer.webGLMixer.actionStopBlender();
    }

    this.webGLPlayer.scene.traverse(async (child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.isMaterial) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        }
      } else if (Array.isArray(child.children)) {
        if (child.children.length > 0) {
          for (let i = child.children.length - 1; i >= 0; i--) {
            if (child.children[i].geometry)
              child.children[i].geometry.dispose();
          }
        }
      }
    });
  }

  async removeSceneAndChildren(obj) {
    for (let i = obj.children.length - 1; i >= 0; i--) {
      this.removeObjectsWithChildren(obj.children[i]);
    }

    if (obj.geometry) {
      obj.geometry.dispose();
    }

    if (obj.material) {
      if (obj.material.length) {
        for (let i = 0; i < obj.material.length; ++i) {
          if (obj.material[i].map) obj.material[i].map.dispose();
          if (obj.material[i].lightMap) obj.material[i].lightMap.dispose();
          if (obj.material[i].bumpMap) obj.material[i].bumpMap.dispose();
          if (obj.material[i].normalMap) obj.material[i].normalMap.dispose();
          if (obj.material[i].specularMap)
            obj.material[i].specularMap.dispose();
          if (obj.material[i].envMap) obj.material[i].envMap.dispose();

          obj.material[i].dispose();
        }
      } else {
        if (obj.material.map) obj.material.map.dispose();
        if (obj.material.lightMap) obj.material.lightMap.dispose();
        if (obj.material.bumpMap) obj.material.bumpMap.dispose();
        if (obj.material.normalMap) obj.material.normalMap.dispose();
        if (obj.material.specularMap) obj.material.specularMap.dispose();
        if (obj.material.envMap) obj.material.envMap.dispose();

        obj.material.dispose();
      }
    }
    obj.removeFromParent();
  }

  async webGlRender() {
    this.webGLPlayer.render();
  }
}
