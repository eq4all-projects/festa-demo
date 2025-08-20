import * as _ from "lodash";
import * as THREE from "three";
import untar from "js-untar";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { FBXLoader } from "./FBXLoader";
import { GLTFLoader } from "./GLTFLoader";
import { WebGLPlayerConfig } from "./WebGLPlayerConfig";
import { CharacterStructure } from "./CharacterStructure";
import { WebGLMixer } from "./WebGLPlayerMixer";
import { Kinematics } from "./Kinematics";
import { ProtocolConverter } from "./ProtocolConverter";
import { LightsSetting } from "./LightsSetting";
import { CameraSetting } from "./CameraSetting";

import { callAxios, apiDispatcher } from "./APIs";

export default class WebGLPlayer {
  constructor(
    canvas,
    backgroundColor,
    loadingWorkerPath,
    system,
    isBlendingPage
  ) {
    // Loader
    this.characterFileExt = "glb"; // 모든 캐릭터 GLB 사용
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    this.textureLoader = new THREE.TextureLoader();

    // Scene
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });

    // Camera
    this.camera = null;
    this.cameraOffset = 1;
    this.cameraDistance = 190;
    this.cameraZoomLevel = 1;
    this.cameraFOV = 30;
    this.cameraFar = 5000;
    this.cameraNear = 0.3;
    this.cameraXTarget = 0;
    this.cameraYTarget = 165;
    this.camerasSetting = null;

    if (isBlendingPage) {
      this.cameraDistance = 230;
    }

    // Orbit Controls
    this.orbitControls = null;
    this.orbitControlsEnabled = true;
    this.orbitControlsTarget = new THREE.Vector3(0, 138.9, 0);
    this.orbitControlsMaxAzimuth = Math.PI / 2;
    this.orbitControlsMaxPolar = Math.PI * (10 / 16);
    this.orbitControlsMinAzimuth = -Math.PI / 2;
    this.orbitControlsMinPolar = Math.PI / 4;

    if (isBlendingPage) {
      this.orbitControlsTarget = new THREE.Vector3(0, 133, 0);
    }

    // Lights
    this.lights = null;
    this.lightsSetting = null;
    this.useDefaultLight = true;
    this.shadowEnabled = false;

    // Character
    this.characterName = "Adam";
    this.characterJson = null;
    this.characterObject = null;
    this.characterList = null;
    this.characterJsonDefault = { Default_Rot: [] };

    // Avatar
    this.avatarName = "";

    // Kinematics
    this.kinematics = null;

    // Mixer
    this.webGLMixer = null;

    // Retargeting
    this.retargetInfoTemp = {};
    this.retargetScaleInfoTemp = {};
    this.retargetQuaternionInfoTemp = {};
    this.originQuaternionInfoTemp = {};
    this.defaultQuaternionInfoTemp = {};

    // Data Converter
    this.protocolConverter = null;

    // Config
    this.system = system;
    this.config = new WebGLPlayerConfig(system);

    // ETC
    this.clock = new THREE.Clock();
    this.delta = this.clock.getDelta();
    this.container = canvas.parentNode;
    this.loadingWorkerPath = loadingWorkerPath;
    this.backgroundColor = !!backgroundColor ? backgroundColor.color : 0xffffff;
    this.backgroundAlpha = !!backgroundColor ? backgroundColor.alpha : 1;

    this.blinkRandomNumber = Math.round(Math.random() * (8 - 3) + 3);
    this.renderFps = 60;
    this.eyeClosing = false;
    this.eyeOpening = false;
    this.eyeOpeningTime = 0;

    this.setSentenceEnabled = true;

    this.removeTimeOutParam = {
      settingsRenderTimout: null,
      settingsDefaultEyeOpenTimeout1: null,
      setSentenceEnabledTimeout1: null,
      settingsDefaultEyeOpenTimeout2: null,
      setSentenceEnabledTimeout2: null,
      settingsDefaultEyeOpenTimeout3: null,
      setSentenceEnabledTimeout3: null,
    };

    this.requestAnimationFrameParam = null;
    this.characterYRotation = 0;
  }

  rotateLeft() {
    this.characterYRotation -= Math.PI / 12; // 15 degrees
  }

  rotateRight() {
    this.characterYRotation += Math.PI / 12; // 15 degrees
  }

  /**
   *  매 프레임마다 반복. 캔버스에 렌더링해주는 역할
   */
  async render() {
    this.delta = this.clock.getDelta();

    if (
      !this.webGLMixer.actionPlaying &&
      !this.webGLMixer.oneAnimationPlaying &&
      !this.webGLMixer.actionPlayingBlender
    ) {
      // this.webGLMixer.idleAction.setEffectiveWeight(1);
      let renderFps = Math.round(1 / this.delta);
      let closeGap = Math.round(100 / renderFps) / 10;

      if (
        Math.round(this.clock.elapsedTime) % this.blinkRandomNumber === 0 &&
        this.clock.elapsedTime > this.eyeOpeningTime + 5
      ) {
        if (!this.eyeClosing && !this.eyeOpening) {
          this.eyeClosing = true;
        }
      } else {
        this.blinkRandomNumber = Math.round(Math.random() * 5 + 3);
      }

      if (this.eyeClosing) {
        if (!this.characterStructure.meshArray["Mesh_Face"]) return;
        if (
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.leftEyeCloseIndex
          ] < 1
        ) {
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.leftEyeCloseIndex
          ] += closeGap;
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.rightEyeCloseIndex
          ] += closeGap;

          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.leftEyeBrowLowerIndex
          ] += closeGap / 5;
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.rightEyeBrowLowerIndex
          ] += closeGap / 5;

          if (
            this.characterStructure.meshArray["Mesh_Face"]
              .morphTargetInfluences[
              this.characterStructure.leftEyeCloseIndex
            ] >= 1
          ) {
            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.leftEyeCloseIndex
            ] = 1;
            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.rightEyeCloseIndex
            ] = 1;

            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.leftEyeBrowLowerIndex
            ] = 1 / 5;
            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.rightEyeBrowLowerIndex
            ] = 1 / 5;

            this.eyeClosing = false;
            this.eyeOpening = true;
          }
        }
      } else if (this.eyeOpening) {
        if (!this.characterStructure.meshArray["Mesh_Face"]) return;
        if (
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.leftEyeCloseIndex
          ] > 0
        ) {
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.leftEyeCloseIndex
          ] -= closeGap;
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.rightEyeCloseIndex
          ] -= closeGap;

          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.leftEyeBrowLowerIndex
          ] -= closeGap / 5;
          this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
            this.characterStructure.rightEyeBrowLowerIndex
          ] -= closeGap / 5;

          if (
            this.characterStructure.meshArray["Mesh_Face"]
              .morphTargetInfluences[
              this.characterStructure.leftEyeCloseIndex
            ] <= 0
          ) {
            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.leftEyeCloseIndex
            ] = 0;
            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.rightEyeCloseIndex
            ] = 0;

            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.leftEyeBrowLowerIndex
            ] = 0;
            this.characterStructure.meshArray[
              "Mesh_Face"
            ].morphTargetInfluences[
              this.characterStructure.rightEyeBrowLowerIndex
            ] = 0;

            this.eyeOpening = false;
            this.eyeOpeningTime = this.clock.elapsedTime;
          }
        }
      }
    } else {
      this.eyeOpeningTime = this.clock.elapsedTime;
    }

    this.webGLMixer.mixer.update(this.delta);

    this.characterObject.position.set(0, 0, 0);
    this.characterObject.quaternion.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.characterYRotation
    );
    this.characterObject.children[0].position.set(0, 93.9000015258789, 0);
    this.characterObject.updateMatrixWorld(true);

    await this.webGLMixer.actionSetWeight(this.kinematics);
    this.characterObject.updateMatrixWorld(true);

    // this.kinematics.solve("rightHand");
    // this.kinematics.solve("rightLeg");
    // this.kinematics.solve("leftLeg");
    // this.kinematics.solve("rightToes");
    // this.kinematics.solve("leftToes");

    this.renderer.render(this.scene, this.camera);
    // requestAnimationFrame(this.render.bind(this));
  }

  /**
   *  CMS v2.0에서 Settings 페이지에 사용하기 위한 렌더러
   */
  async settingsRender() {
    this.delta = this.clock.getDelta();

    this.webGLMixer.mixer.update(this.delta);

    // this.camerasSetting.lightCameraHelper.forEach((helper) => {
    //     helper.update();
    // });

    this.lightsSetting.lightHelper.forEach((helper) => {
      helper.update();
    });

    this.characterObject.position.set(0, 0, 0);
    this.characterObject.quaternion.set(0, 0, 0, 1);
    this.characterObject.children[0].position.set(0, 93.9000015258789, 0);

    await this.webGLMixer.actionSetWeight(this.kinematics);

    this.characterObject.updateMatrixWorld(true);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.settingsRender.bind(this));

    if (this.webGLMixer.captureEnable && this.webGLMixer.captureNow) {
      this.webGLMixer.capturer.capture(this.renderer.domElement);
    }
    if (this.webGLMixer.captureGifNow) {
      this.webGLMixer.capturer.capture(this.renderer.domElement);
    }
    if (this.webGLMixer.avatarCapture) {
      let avatarName = this.avatarName;
      let capturer = this.webGLMixer.capturer;

      this.webGLMixer.capturer.start();
      this.webGLMixer.capturer.capture(this.renderer.domElement);

      this.webGLMixer.avatarCaptureEnd = true;

      this.removeTimeOutParam.settingsRenderTimout = setTimeout(() => {
        // capturer.stop();
        capturer.save(async (blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            untar(reader.result).then(
              function (file) {
                // onSuccess
                const url = file[0].getBlobUrl();
                const link = document.createElement("a");
                link.download = avatarName + ".png";
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              },
              function (err) {
                // onError
              },
              function (extractedFile) {
                // onProgress
              }
            );
          };
          reader.readAsArrayBuffer(blob);
        });
      }, 0);

      this.webGLMixer.capturer.stop();
    }
  }

  /** 캔버스에 렌더링하기 위해 선언되는 객체
   *
   *  Scene : 렌더링되는 모든 오브젝트의 최상위 객체
   *  Renderer : 렌더링을 수행하는 객체
   */
  async rendererSetting() {
    this.backgroundAlpha = 0;
    this.renderer.setClearColor(this.backgroundColor, this.backgroundAlpha);

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.shadowMap.enabled = this.shadowEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
  }

  /**
   *  캔버스 Background 색상을 변경한다.
   */
  async setBackgroundColor(color) {
    this.backgroundColor = new THREE.Color(color);
    this.scene.background = this.backgroundColor;
  }

  async setBackgroundClearColor() {
    this.scene.background = null;
  }

  /**
   *  아바타의 카메라 위치를 Default로 되돌린다.
   */
  async avatarLocationReset(x, y, z) {
    if (x != undefined) {
      this.camera.position.set(x, y, z);
    } else {
      this.camera.position.set(
        this.cameraXTarget,
        this.cameraYTarget,
        (this.cameraDistance * this.cameraOffset) / this.cameraZoomLevel
      );
    }

    this.camera.updateProjectionMatrix();
    this.orbitControls.reset();
    this.orbitControls.update();
  }

  /**
   *  Avatar 리스트를 받아온다.
   */
  async getAvatarList() {
    let avatarListResponse = await apiDispatcher(
      this.config.APIOrigin + this.config.getAvatarList + `?page_size=0`,
      "GET",
      null,
      null,
      this.system
    );
    this.avatarList = avatarListResponse.data.results;
    this.avatarList = _.orderBy(this.avatarList, ["created_date"], ["desc"]);
  }

  /**
   *  Avatar 로딩 전 초기 카메라 설정 값 변경
   */
  async modifyCameraDefault(cameraSettings) {
    if (Object.keys(cameraSettings).length > 0) {
      for (let key in cameraSettings) {
        if (key === "orbitControlsTarget") {
          this[key] = new THREE.Vector3(
            cameraSettings[key][0],
            cameraSettings[key][1],
            cameraSettings[key][2]
          );
        } else this[key] = cameraSettings[key];
      }
    }
  }

  /** 카메라와 컨트롤을 설정
   *
   *  Camera : PerspectiveCamera를 기본값으로 하며 기본 설정값을 세팅
   *  orbitControls : 삼각대 역할
   */
  async cameraAndOrbitControls() {
    if (this.orbitControlsEnabled) {
      // this.cameraYTarget = 143.9;

      await this.cameraSetting();
      await this.orbitControlsSetting();
    } else {
      await this.cameraSetting();

      // OrbitControl이 disable일 경우 카메라의 올바를 위치를 잡기 위해 앵글값을 수정(사실상 카메라의 position 값이다.)
      this.camera.rotation.set(
        -0.15,
        this.camera.rotation._y,
        this.camera.rotation._z,
        "XYZ"
      );
    }

    this.camera.updateProjectionMatrix();
  }

  async cameraSetting() {
    this.camera = new THREE.PerspectiveCamera(
      this.cameraFOV,
      this.container.clientWidth / this.container.clientHeight,
      this.cameraNear,
      this.cameraFar
    );
    // position이라는 property명을 지니지만 사실상 카메라의 앵글에 해당. 그런 이유로 변수명을 cameraXTarget 등으로 설정
    this.camera.position.set(
      this.cameraXTarget,
      this.cameraYTarget,
      (this.cameraDistance * this.cameraOffset) / this.cameraZoomLevel
    );
    this.camera.name = "Default Camera";

    // this.camerasSetting = new CameraSetting();
  }

  async orbitControlsSetting() {
    this.orbitControls = new OrbitControls(this.camera, this.container);
    this.orbitControls.enablePan = true;
    this.orbitControls.enableRotate = true;
    this.orbitControls.enableZoom = true;
    this.orbitControls.enableKeys = false;
    this.orbitControls.maxAzimuthAngle = this.orbitControlsMaxAzimuth;
    this.orbitControls.maxPolarAngle = this.orbitControlsMaxPolar;
    this.orbitControls.minAzimuthAngle = this.orbitControlsMinAzimuth;
    this.orbitControls.minPolarAngle = this.orbitControlsMinPolar;
    this.orbitControls.target = this.orbitControlsTarget;
    this.orbitControls.saveState();
    this.orbitControls.update();
  }

  /**
   *  Character List를 가져온다.
   */
  async getCharacterList() {
    let response = await callAxios(this.config.APIOrigin + "characters", "GET");
    this.characterList = response.data.characters;
  }

  /**
   *  캐릭터 로딩을 위한 함수
   *  아직 파츠가 적용되지 않은 기본 캐릭터를 로딩하며 이후 플레이할 애니메이션의 타깃 모델이 된다.
   */
  async loadModel(characterName, avatarName, version) {
    let characterFileName = null;

    if (characterName !== undefined) this.characterName = characterName;
    else characterName = this.characterName;

    if (this.system !== "CMS2.0") {
      let jsonFileResponse = await apiDispatcher(
        this.config.fileOrigin + this.config.characterJsonFileAPI(),
        "GET",
        null,
        null,
        this.system
      );
      this.characterJson = _.find(
        jsonFileResponse.data,
        function (model) {
          return model.Name == this.characterName;
        }.bind(this)
      );
      this.characterJsonDefault = jsonFileResponse.data[0];

      let characterJSONAPI = this.config.characterJSONParse(this.characterJson);
      characterFileName = this.config.getCharacterFileName(this.characterJson);

      if (this.system == "webOS") {
        let avatarArrayBuffer = await apiDispatcher(
          this.config.fileOrigin + characterJSONAPI,
          "arrayBuffer",
          null,
          "",
          this.system
        );
        if (this.characterFileExt === "fbx") {
          this.characterObject = this.fbxLoader.parse(avatarArrayBuffer);
        } else {
          this.characterObject = await this.gltfLoader.parseAsync(
            avatarArrayBuffer
          );
          this.characterObject = this.characterObject.scene;
        }
      } else {
        if (this.characterFileExt === "fbx") {
          this.characterObject = await this.fbxLoader.loadAsync(
            this.config.fileOrigin + characterJSONAPI
          );
        } else {
          this.characterObject = await this.gltfLoader.loadAsync(
            this.config.fileOrigin + characterJSONAPI.replace(".FBX", ".glb")
          );
          this.characterObject = this.characterObject.scene;
        }
      }
    } else {
      let response = await callAxios(
        this.config.APIOrigin + "characters",
        "GET"
      );
      this.characterList = response.data.characters;

      let character = _.find(
        this.characterList,
        function (model) {
          return model.character_name == this.characterName;
        }.bind(this)
      );

      characterFileName = character.filename.split(".")[0];

      if (this.characterFileExt === "fbx") {
        this.characterObject = await this.fbxLoader.loadAsync(
          this.config.fileOrigin +
            "characters/" +
            character.character_name +
            "/" +
            characterFileName +
            ".FBX"
        );
      } else {
        this.characterObject = await this.gltfLoader.loadAsync(
          this.config.fileOrigin +
            "characters/" +
            character.character_name +
            "/" +
            character.filename
        );
        this.characterObject = this.characterObject.scene;
      }
    }

    this.characterObject.castShadow = this.shadowEnabled;
    this.characterObject.receiveShadow = this.shadowEnabled;
    this.characterObject.position.set(0, 0, 0);
    this.characterObject.quaternion.copy(new THREE.Quaternion());

    if (this.characterFileExt === "glb")
      this.characterObject.children[0].scale.multiplyScalar(100);
    this.characterObject.children[0].position.set(0, 93.9000015258789, 0);

    let meshes = [];
    let bones = [];
    this.retargetInfoTemp = [];
    this.retargetScaleInfoTemp = [];

    this.characterObject.updateMatrixWorld(true);

    this.characterObject.traverse(async (child) => {
      if (child.isBone) {
        bones.push(child);
      }

      if (child.isMesh) {
        if (this.characterFileExt === "glb") {
          let teethFileName = "Avatar_Teeth&Tongue.png";
          let prevMaterial = child.material;
          child.material = new THREE.MeshPhongMaterial();
          THREE.MeshBasicMaterial.prototype.copy.call(
            child.material,
            prevMaterial
          );

          if (this.characterName == "LGE_Reah") {
            teethFileName = "Avatar_LGE_Reah_Teeth&Tongue.png";
          }
          let tmpTexture = null;
          if (
            child.name == "Mesh_Teeth_Up" ||
            child.name == "Mesh_Teeth_Down" ||
            child.name == "Mesh_Tongue"
          ) {
            if (this.system == "webOS") {
              let localTexture = await apiDispatcher(
                `${this.config.fileOrigin}/${teethFileName}`,
                "dataUrl",
                null,
                "",
                this.system
              );
              tmpTexture = await this.textureLoader.loadAsync(localTexture);
            } else {
              tmpTexture = await this.textureLoader.loadAsync(
                this.config.fileOrigin +
                  this.config.getTextureFileAPI(
                    this.characterName,
                    teethFileName
                  )
              );
            }
            tmpTexture.flipY = false;
            tmpTexture.encoding = THREE.sRGBEncoding;
            child.material.map = tmpTexture;
          }
        }

        child.frustumCulled = false;
        child.castShadow = this.shadowEnabled;
        child.receiveShadow = this.shadowEnabled;
        child.material.side = THREE.FrontSide;
        if (child.name == "Mesh_Face") child.material.morphTargets = true;
        else child.material.morphTargets = false;
        child.material.map.generateMipmaps = true;
        // if (this.characterFileExt === "fbx") child.material.map.encoding = THREE.LinearEncoding;
        if (this.characterFileExt === "glb") child.material.shininess = 2.0;
        child.material.shadowSide = THREE.FrontSide;

        meshes.push(child);
      } else if (child.isBone) {
        if (!this.retargetInfoTemp[child.name]) {
          this.retargetInfoTemp[child.name] = child.position.clone();
          this.retargetScaleInfoTemp[child.name] = child.scale.clone();
          this.originQuaternionInfoTemp[child.name] = child.quaternion.clone();

          // if (this.characterJsonDefault.Default_Rot[child.name]) {
          //     if (
          //         this.characterJsonDefault.Default_Rot[child.name].Rot._x != child.quaternion._x ||
          //         this.characterJsonDefault.Default_Rot[child.name].Rot._y != child.quaternion._y ||
          //         this.characterJsonDefault.Default_Rot[child.name].Rot._z != child.quaternion._z ||
          //         this.characterJsonDefault.Default_Rot[child.name].Rot._w != child.quaternion._w
          //     ) {
          //         this.retargetQuaternionInfoTemp[child.name] = child.quaternion.clone();

          //         let quaternionInvert = new THREE.Quaternion(
          //             this.characterJsonDefault.Default_Rot[child.name].Rot._x,
          //             this.characterJsonDefault.Default_Rot[child.name].Rot._y,
          //             this.characterJsonDefault.Default_Rot[child.name].Rot._z,
          //             this.characterJsonDefault.Default_Rot[child.name].Rot._w
          //         )
          //             .normalize()
          //             .invert();
          //         this.retargetQuaternionInfoTemp[child.name] = quaternionInvert.multiply(
          //             this.retargetQuaternionInfoTemp[child.name].clone().normalize()
          //         );
          //     }
          // }
        }
      }
    });

    this.characterObject.updateMatrixWorld(true);

    this.characterStructure = new CharacterStructure(
      this.characterObject,
      meshes,
      bones,
      this.system,
      this.characterFileExt
    );

    if (this.characterFileExt === "glb")
      await this.characterStructure.glbChangeBodyFrame(
        this.characterName,
        characterFileName + "_Body_00_00"
      );
    this.characterStructure.createMeshVariables();
    this.characterStructure.createBoneVariables();
    this.characterStructure.getMeshFaceMorph();

    this.kinematics = new Kinematics(
      this.characterStructure.bones,
      this.characterStructure.boneArray,
      this.characterStructure.meshArray,
      this.characterStructure.eyeIndexes,
      this.system
    );

    await this.kinematics.rightHandConstraints();
    // await this.kinematics.rightLegConstraints(this.characterName);
    // await this.kinematics.leftLegConstraints(this.characterName);
    // await this.kinematics.rightToesConstraints(this.characterName);
    // await this.kinematics.leftToesConstraints(this.characterName);

    if (avatarName) {
      this.avatarName = avatarName;

      if (version === 0.3) {
        await this.characterStructure._3_getAvatarStructure(
          this.characterName,
          avatarName
        );
        await this.characterStructure._3_loadAvatar();
      } else if (version === 0.4) {
        await this.characterStructure._4_getAvatarStructure(
          this.characterName,
          avatarName
        );
        await this.characterStructure._4_loadAvatar(this.characterName);
      }
    }

    // console.log(this.characterObject);

    this.scene.add(this.characterObject);
  }

  /**
   *  위에서 로딩한 모델을 타깃으로 하여 애니메이션 믹서를 설정한다.
   */
  async setMixer() {
    this.webGLMixer = new WebGLMixer(
      this.characterObject,
      this.characterStructure.boneArray,
      this.loadingWorkerPath,
      this.system
    );
    this.webGLMixer.retargetInfo = {
      position: this.retargetInfoTemp,
      // quaternion: this.retargetQuaternionInfoTemp,
      originQuaternion: this.originQuaternionInfoTemp,
      scale: this.retargetScaleInfoTemp,
    };
  }

  /**
   *  조명 설정값을 조정한다.
   *  기본 조명 사용 여부 혹은 조명 파일 존재 여부에 따라 기본 조명을 사용할지 캐릭터 조명을 사용할지 결정한다.
   */
  async setLights() {
    if (this.useDefaultLight) {
      try {
        let lightAPI = this.config.lightAPI(this.characterName);
        let lightFileResponse = await apiDispatcher(
          this.config.fileOrigin + lightAPI,
          "GET",
          null,
          "",
          this.system
        );

        if (
          lightFileResponse &&
          lightFileResponse.data &&
          lightFileResponse.status < 300
        ) {
          this.lights = lightFileResponse.data;
        } else {
          this.lights = await this.defaultLights();
        }
      } catch (e) {
        this.lights = await this.defaultLights();
      }
    } else {
      this.lights = await this.defaultLights();
    }
  }

  /**
   *  세팅된 조명값을 이용해 실제 조명에 필요한 값을 추출해낸다.
   */
  async applyLights() {
    let count = 0;

    _.forEach(
      this.lights,
      function (light) {
        count++;
        this.addLights(light.type, light, count);
      }.bind(this)
    );

    this.lightsSetting = new LightsSetting(
      this.scene,
      this.lights,
      this.system
    );
  }

  /**
   *  기본 조명 세팅값
   */
  async defaultLights() {
    let lightList = [];

    lightList.push({
      name: "DirectionalLight1",
      type: "DirectionalLight",
      "light color": 0xffffff,
      intensity: 0.5,
      "use shadow": false,
      "fromVector X": 1,
      "fromVector Y": 0.5,
      "fromVector Z": 1,
    });

    lightList.push({
      name: "DirectionalLight2",
      type: "DirectionalLight",
      "light color": 0xffffff,
      intensity: 0.5,
      "use shadow": false,
      "fromVector X": -1,
      "fromVector Y": 0.5,
      "fromVector Z": 1,
    });

    lightList.push({
      name: "DirectionalLight3",
      type: "DirectionalLight",
      "light color": 0xffffff,
      intensity: 1,
      "use shadow": false,
      "fromVector X": 0,
      "fromVector Y": 1,
      "fromVector Z": -0.5,
    });

    lightList.push({
      name: "AmbientLight",
      type: "AmbientLight",
      "light color": 0xffffff,
      intensity: 0.5,
    });

    return lightList;
  }

  /**
   *  조명 Object를 생성하여 Scene에 추가한다.
   */
  async addLights(lightType, setting, count) {
    var light = null;
    if (lightType == "AmbientLight") {
      light = new THREE.AmbientLight(
        setting["light color"],
        setting["intensity"]
      );
    } else if (lightType == "DirectionalLight") {
      light = new THREE.DirectionalLight(
        setting["light color"],
        setting["intensity"]
      );
    } else if (lightType == "PointLight") {
      light = new THREE.PointLight(
        setting["light color"],
        setting["intensity"]
      );
    }

    _.map(setting, function (val, key) {
      if (key == "intensity") {
        light.intensity = val;
      } else if (key == "light color") {
        light.color.setHex(val);
      } else if (key == "use shadow") {
        light.castShadow = val;
      } else if (key == "fromVector X") {
        light.position.x = val;
      } else if (key == "fromVector Y") {
        light.position.y = val;
      } else if (key == "fromVector Z") {
        light.position.z = val;
      } else if (key == "distance") {
        light.distance = val;
      } else if (key == "decay") {
        light.decay = val;
      } else if (key == "position X") {
        light.position.x = val;
      } else if (key == "position Y") {
        light.position.y = val;
      } else if (key == "position Z") {
        light.position.z = val;
      } else if (key == "shadow") {
        if (!!val["mapSize width"]) {
          light.shadow.mapSize.x = val["mapSize width"];
        }
        if (!!val["mapSize height"]) {
          light.shadow.mapSize.y = val["mapSize height"];
        }
        if (!!val["camera far"]) {
          light.shadow.camera.far = val["camera far"];
        }
        if (!!val["shadow bias"]) {
          light.shadow.bias = val["shadow bias"];
        }
        if (!!val["shadow radius"]) {
          light.shadow.radius = val["shadow radius"];
        }
      } else if (key == "name") {
        light.name = val["name"];
      }
    });

    if (!light.name) {
      light.name = lightType + count;
    }

    this.scene.add(light);
  }

  /**
   *  Idle Mixer, Clip, Animation을 구성한다.
   */
  async setIdleAction() {
    await this.webGLMixer.setIdleEq4Files();
    await this.webGLMixer.setIdleFileStructure();
    await this.webGLMixer.setIdleClips();
    await this.webGLMixer.setIdleActions();
    await this.webGLMixer.setAddedEq4Files();
  }

  /**
   *  Sentence ID를 이용해 문장을 불러온다.
   */
  async setSentence(id, version, level, dynamicVariables, callback) {
    if (!this.setSentenceEnabled) {
      return;
    }

    try {
      this.webGLMixer.disConnectPanel();
      this.webGLMixer.moreLoadingContext = "";

      if (callback) {
        this.webGLMixer.callbackEnable = true;
        this.webGLMixer.callback = () => {};
        this.webGLMixer.callback = callback;

        if (this.webGLMixer.actionPlaying) {
          this.webGLMixer.playerStatus = 2;
          this.webGLMixer.returnCallback();
        }
      } else {
        this.webGLMixer.callbackEnable = false;
      }

      this.webGLMixer.moreLoadingCount++;
      this.setSentenceEnabled = false;

      this.webGLMixer.actionPlaying = false;
      this.webGLMixer.idleAction.setEffectiveWeight(1);

      if (version === undefined) {
        version = 0.3;
      }

      if (
        this.webGLMixer.sentenceInfo === undefined ||
        (this.webGLMixer.sentenceInfo !== undefined &&
          this.webGLMixer.sentenceInfo.id !== id) ||
        this.webGLMixer.animations.length !== this.webGLMixer.actions.length ||
        !_.isEqual(this.webGLMixer.sentenceInfo.variable, dynamicVariables)
      ) {
        this.protocolConverter = new ProtocolConverter(version, this.system);

        await this.resetResources();
        await this.webGLMixer.setSLTypeMetadata(
          id,
          version,
          level,
          dynamicVariables
        );
        await this.webGLMixer.setAnimations(id, version, level);
        if (version === 0.3)
          await this.webGLMixer.getEq4FilesAllList(id, version, level);
        await this.webGLMixer.setEq4Files(id, version, level);
        await this.webGLMixer.setFileStructure(id, version, level);
        await this.protocolConverter._3_toTimebase(
          this.webGLMixer.animations,
          this.webGLMixer.tmpClips,
          this.webGLMixer.blendings,
          this.webGLMixer.maxLoadingAnimation,
          this.webGLMixer.loadingCount,
          this.webGLMixer.additiveAnimationsFile
        );
        await this.webGLMixer.setClips(id, version, level);
        await this.webGLMixer.setActions(id, version, level);

        this.webGLMixer.animations = this.protocolConverter.convertedAnimations;
        this.webGLMixer.blendings = this.protocolConverter.convertedBlendings;

        this.removeTimeOutParam.settingsDefaultEyeOpenTimeout1 = setTimeout(
          () => {
            this.setDefaultEyeOpen();
            // this.webGLMixer.playerStatus = 1;
            this.webGLMixer.playWithBlendingOnce();
          },
          0
        );

        this.removeTimeOutParam.setSentenceEnabledTimeout1 = setTimeout(() => {
          this.setSentenceEnabled = true;
        }, 400);
      } else {
        this.removeTimeOutParam.settingsDefaultEyeOpenTimeout2 = setTimeout(
          () => {
            this.setDefaultEyeOpen();
            // this.webGLMixer.playerStatus = 1;
            // this.stopPlaySentence();
            this.webGLMixer.playWithBlendingOnce();
          },
          0
        );

        this.removeTimeOutParam.setSentenceEnabledTimeout2 = setTimeout(() => {
          this.setSentenceEnabled = true;
        }, 250);
      }
    } catch (e) {
      // console.log(e);
      this.webGLMixer.playerStatus = 5;
      this.webGLMixer.returnCallback();
      this.webGLMixer.disConnectPanel(e);
    }
  }

  async playAnimationByName(ani_name, callback) {
    const gloss = {
      sl_composition: {
        sData: [
          {
            wAttribute: 12, // Animation type
            word: ani_name,
            sl_composition: {
              data: [
                {
                  ani_name: ani_name,
                  attribute: 2, // Sign Language Animation
                  Exit_Time: -1,
                  Speed: [1],
                  Transition_Duration: -1,
                  Transition_Offset: -1,
                  ani_id: -1,
                  origin_info: " ",
                  selected_word: "",
                  variable_id: -1,
                  variable_type: -1,
                  parentIndex: 0,
                  pauseStartDuration: 0,
                  pauseEndDuration: 0,
                  speed: [1],
                },
              ],
            },
          },
        ],
      },
    };
    await this.setSentence([gloss], 0.3, "Ani", null, callback);
  }

  /**
   *  블렌더 페이지에서 Sentence ID를 이용해 문장을 불러온다.
   */
  async setSentenceBlender(id, version, level, dynamicVariables) {
    // this.webGLMixer.moreLoadingCount++;
    this.webGLMixer.actionPlayingBlender = false;

    if (version === undefined) {
      version = 0.3;
    }

    this.protocolConverter = new ProtocolConverter(version, this.system);

    await this.webGLMixer.setSLTypeMetadata(
      id,
      version,
      level,
      dynamicVariables
    );
    await this.webGLMixer.setAnimations(id, version, level);
    if (version === 0.3)
      await this.webGLMixer.getEq4FilesAllList(id, version, level);
    await this.webGLMixer.setEq4Files(id, version, level);
    await this.webGLMixer.setFileStructure(id, version, level);
    await this.protocolConverter._3_toTimebase(
      this.webGLMixer.animations,
      this.webGLMixer.tmpClips,
      this.webGLMixer.blendings,
      this.webGLMixer.maxLoadingAnimation,
      this.webGLMixer.loadingCount,
      this.webGLMixer.additiveAnimationsFile
    );
    await this.webGLMixer.setClips(id, version, level);
    await this.webGLMixer.setActions(id, version, level);

    this.webGLMixer.animations = this.protocolConverter.convertedAnimations;
    this.webGLMixer.blendings = this.protocolConverter.convertedBlendings;

    this.webGLMixer.actionPlayPrepareBlender();
  }

  /**
   *  Blending 값과 해당하는 애니메이션만을 이용해 플레이한다.
   */
  async setSpecificBlendingAnimations(
    id,
    version,
    level,
    dynamicVariables,
    callback
  ) {
    if (!this.setSentenceEnabled) {
      return;
    }

    this.setSentenceEnabled = false;

    this.webGLMixer.actionPlaying = false;

    if (version === undefined) {
      version = 0.3;
    }

    this.protocolConverter = new ProtocolConverter(version, this.system);

    await this.resetResources();
    await this.webGLMixer.setSLTypeMetadata(
      id,
      version,
      level,
      dynamicVariables
    );
    await this.webGLMixer.setAnimations(id, version, level);
    await this.webGLMixer.setEq4Files(id, version, level);
    await this.webGLMixer.setFileStructure(id, version, level);
    await this.protocolConverter._3_toTimebase(
      this.webGLMixer.animations,
      this.webGLMixer.tmpClips,
      this.webGLMixer.blendings,
      this.webGLMixer.maxLoadingAnimation,
      this.webGLMixer.loadingCount
    );
    await this.webGLMixer.setClips(id, version, level);
    await this.webGLMixer.setActions(id, version, level);

    this.webGLMixer.animations = this.protocolConverter.convertedAnimations;
    this.webGLMixer.blendings = this.protocolConverter.convertedBlendings;

    this.removeTimeOutParam.settingsDefaultEyeOpenTimeout3 = setTimeout(() => {
      this.setDefaultEyeOpen();
      this.webGLMixer.playerStatus = 1;
      this.webGLMixer.playWithBlendingOnce();
    }, 0);

    this.removeTimeOutParam.setSentenceEnabledTimeout3 = setTimeout(() => {
      this.setSentenceEnabled = true;
    }, 250);
  }

  /**
   *  하나의 Animation을 플레이한다.
   */
  async setAnimtionPlay(animationPath, filename) {
    if (this.webGLMixer.oneAnimationPlaying)
      await this.resetOneAnimationResources();
    await this.webGLMixer.setOneAnimationEq4File(animationPath);
    await this.webGLMixer.setOneAnimationFileStructure();
    await this.webGLMixer.setOneAnimationClips();
    await this.webGLMixer.setOneAnimation(filename);
  }

  /**
   *  다른 문장을 플레이 시 기존 캐시를 모두 삭제한다.
   */
  async resetResources() {
    this.webGLMixer.idleAction.setEffectiveWeight(1);

    await Promise.all(
      _.map(
        this.webGLMixer.clips,
        function (clip) {
          if (clip == null) return;

          this.webGLMixer.mixer.uncacheClip(clip);
          this.webGLMixer.mixer.uncacheAction(clip);
        }.bind(this)
      )
    );

    this.webGLMixer.glosses = [];
    this.webGLMixer.eq4Files = [];
    this.webGLMixer.animations = [];
    this.webGLMixer.tmpClips = [];
    this.webGLMixer.blendings = [];
    this.webGLMixer.clips = [];
    this.webGLMixer.actions = [];
    this.webGLMixer.loadingCount = 1;

    this.webGLMixer.additiveAnimationsFile = {};
    // this.webGLMixer.additiveAnimationsFile = [];
  }

  /**
   *  다른 하나의 애니메이션을 플레이 시 기존 캐시를 모두 삭제한다.
   */
  async resetOneAnimationResources() {
    this.webGLMixer.oneAnimationPlaying = false;
    this.webGLMixer.mixer.uncacheClip(this.webGLMixer.oneAnimationClip);
    this.webGLMixer.mixer.uncacheAction(this.webGLMixer.oneAnimationClip);
    this.webGLMixer.oneAnimationAction.stop();
    this.webGLMixer.oneAnimationEq4File = null;
    this.webGLMixer.tmpOneAnimationFile = null;
    this.webGLMixer.oneAnimationClip = null;
    this.webGLMixer.oneAnimationAction = null;
  }

  async setDefaultEyeOpen() {
    this.eyeClosing = false;
    this.eyeOpening = false;
    this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
      this.characterStructure.leftEyeCloseIndex
    ] = 0;
    this.characterStructure.meshArray["Mesh_Face"].morphTargetInfluences[
      this.characterStructure.rightEyeCloseIndex
    ] = 0;
  }

  async setProtocolConverterReset() {
    if (this.protocolConverter) {
      this.protocolConverter.timeGap = 0;
      this.protocolConverter.dynamic = false;
    }
  }

  async stopPlaySentence() {
    await this.setDefaultEyeOpen();
    // await this.setProtocolConverterReset();
    // await this.resetResources();
    this.webGLMixer.actionPlaying = false;

    this.webGLMixer.idleAction.setEffectiveWeight(1);
    if (this.webGLMixer.callbackEnable) {
      // this.webGLMixer.playerStatus = 2;
      // if (isPlayerStatus) this.webGLMixer.playerStatus = isPlayerStatus;
      this.webGLMixer.returnCallback();
    }
  }

  async orbitControlsChange(x, y, z) {
    this.orbitControlsTarget = new THREE.Vector3(x, y, z);
    this.orbitControls.target = this.orbitControlsTarget;
    this.orbitControls.saveState();
    this.orbitControls.update();
  }

  async setSpecificBlendingAnimations(
    id,
    version,
    level,
    dynamicVariables,
    callback
  ) {
    if (!this.setSentenceEnabled) {
      return;
    }

    this.setSentenceEnabled = false;

    this.webGLMixer.actionPlaying = false;

    if (version === undefined) {
      version = 0.3;
    }

    this.protocolConverter = new ProtocolConverter(version, this.system);

    await this.resetResources();
    await this.webGLMixer.setSLTypeMetadata(
      id,
      version,
      level,
      dynamicVariables
    );
    await this.webGLMixer.setAnimations(id, version, level);
    await this.webGLMixer.setEq4Files(id, version, level);
    await this.webGLMixer.setFileStructure(id, version, level);
    await this.protocolConverter._3_toTimebase(
      this.webGLMixer.animations,
      this.webGLMixer.tmpClips,
      this.webGLMixer.blendings,
      this.webGLMixer.maxLoadingAnimation,
      this.webGLMixer.loadingCount
    );
    await this.webGLMixer.setClips(id, version, level);
    await this.webGLMixer.setActions(id, version, level);

    this.webGLMixer.animations = this.protocolConverter.convertedAnimations;
    this.webGLMixer.blendings = this.protocolConverter.convertedBlendings;

    this.removeTimeOutParam.settingsDefaultEyeOpenTimeout3 = setTimeout(() => {
      this.setDefaultEyeOpen();
      this.webGLMixer.playerStatus = 1;
      this.webGLMixer.playWithBlendingOnce();
    }, 0);

    this.removeTimeOutParam.setSentenceEnabledTimeout3 = setTimeout(() => {
      this.setSentenceEnabled = true;
    }, 250);
  }

  // 맨 마지막 함수 추가
  async removeTimeout() {
    const removeTimeOutParamArray = Object.keys(this.removeTimeOutParam);
    for (let param in removeTimeOutParamArray) {
      if (this.removeTimeOutParam[param] != null) {
        clearTimeout(this.removeTimeOutParam[param]);
        this.removeTimeOutParam[param] = null;
      }
    }
  }
}
