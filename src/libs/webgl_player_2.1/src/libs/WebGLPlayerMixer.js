import * as _ from "lodash";
import * as THREE from "three";
import CCapture from "ccapture.js";

import { WebGLPlayerConfig } from "./WebGLPlayerConfig";

import { callAxios, apiDispatcher } from "./APIs";
import { FingerSpells } from "./FingerSpells";
import { ProtocolConverter } from "./ProtocolConverter";

class WebGLMixer {
    constructor(characterObject, boneArray, loadingWorkerPath, system) {
        // Character
        this.characterObject = characterObject;
        this.meshFace = this.characterObject.getObjectByName("Mesh_Face");
        this.rightHand = this.characterObject.getObjectByName("RightHand");
        this.boneArray = boneArray;

        // Mixer
        this.mixer = new THREE.AnimationMixer(characterObject);
        // this.idleMixer = new THREE.AnimationMixer(characterObject);

        // Parcial Loading
        this.maxLoadingAnimation = 5;
        this.workerEnabled = true;
        this.loadingCount = 1;

        if (this.workerEnabled) {
            this.loadingWorker = !!loadingWorkerPath
                ? new Worker(`${loadingWorkerPath}/loadingWorker.min.js`)
                : new Worker(`loadingWorker.min.js`);
        } else {
            this.loadingWorker = null;
        }

        this.workerResponse = {};
        this.moreLoadingContext = "";
        this.moreLoadingCount = 0;

        // Animations - Sentence
        this.sentence;
        this.sentenceInfo;
        this.glosses = [];
        this.animations = [];
        this.eq4FileList = [];
        this.tmpFileList = [];
        this.eq4Files = [];
        this.tmpClips = [];
        this.clips = [];
        this.actions = [];
        this.blendings = [];
        this.animationsSet = [];

        // Animations - Idle
        this.idleEq4File = null;
        this.tmpIdleFile = null;
        this.idleClip = null;
        this.idleAction = null;

        this.morphEq4File = null;

        // Added Animations
        this.addedAnimationFile = null;
        this.tmpAddedAnimationFile = null;

        // Animations - One Animation
        this.oneAnimationEq4File = null;
        this.tmpOneAnimationFile = null;
        this.oneAnimationClip = null;
        this.oneAnimationAction = null;

        // Play
        this.playSpeed = 1;
        this.currentPlayTime = 0;
        this.pauseTime = 0;
        this.actionPlaying = false;
        this.oneAnimationPlaying = false;
        this.actionPlayingBlender = false;
        this.isBlendingPage = false;
        this.repeatStartTime = 0;
        this.repeatEndTime = 0;
        this.actionPaused = true;
        this.idleIndex = 0;
        this.addedAnimationIndex = 0;
        this.morphIndex = 0;
        this.setCurrentPlayTimeBlenderEnabled = false;

        // Retargeting
        this.retargetInfo = {};
        this.retargetQuaternionInfo = {};
        this.defaultQuaternionInfo = {};

        // Converter
        this.protocolConverter = null;

        // FingerSpells
        this.fingerSpells = null;
        this.playFingerspell = false;

        // Config
        this.system = system;
        this.config = new WebGLPlayerConfig(system);

        // Callback
        this.callbackEnable = false;
        this.callback = () => {};
        // 0: init, 1: resource load, 2: play end
        // 0: init, 1: play end, 2: play stop 3: sentence id error, 4: variable id error, 5: etc
        this.playerStatus = 0;

        // Capture
        this.avatarCapture = false;
        this.avatarCaptureEnd = false;
        this.captureEnable = false;
        this.captureGifEnable = false;
        this.captureNow = false;
        this.captureGifNow = false;
        this.captureDownloadAuto = false;
        this.captureGifDownloadAuto = false;
        this.capturer = new CCapture({
            format: "gif",
            framerate: 60,
            name: "upload",
            workersPath: "/static/",
        });
        this.captureFilename = "null";
        this.captureEnd = true;
        this.captureGifEnd = true;

        this.additiveAnimationsFile = [];

        this.version = 0.3;
    }

    /**
     *  SentenceID 혹은 Lv4 ID를 조회하여 수어타입(글로스) 메타데이터를 세팅
     */
    async setSLTypeMetadata(id, version, level, dynamicVariables) {
        this.protocolConverter = new ProtocolConverter(version, this.system);
        this.fingerSpells = new FingerSpells(version, this.system);
        let calledData = [];

        this.version = version;

        if (version === 0.3) {
            // 문장 단위로 쿼리
            if (level === "Sentence") {
                try {
                    let data = { id: [id] };
                    let sentenceGlosses = await apiDispatcher(
                        this.config.APIOrigin + this.config.getSentenceAPI(id),
                        "POST",
                        data
                    );
                    calledData = sentenceGlosses.data.result[0].sl_composition.sData;
                    this.sentenceInfo = {
                        sentence: sentenceGlosses.data.result[0].sentence,
                        id: sentenceGlosses.data.result[0].id,
                        variable: dynamicVariables,
                    };
                } catch (e) {
                    // console.log(e);
                    this.sentenceInfo = { sentence: "", id: id, variable: dynamicVariables };

                    this.playerStatus = 3;
                    this.returnCallback();
                }
            }
            // Lv4(세분류) 단위로 쿼리
            else if (level === 4) {
                let data = { search: id };
                // let sentenceGlosses = await callAxios(this.config.APIOrigin + this.config.getLv4SentenceAPI(), "POST", data);
                try {
                    let sentenceGlosses = await apiDispatcher(
                        this.config.APIOrigin + this.config.getLv4SentenceAPI(),
                        "POST",
                        data
                    );
                    this.sentenceInfo = { sentence: sentenceGlosses.data.result[0].sentence, id: id, variable: dynamicVariables };

                    await Promise.all(
                        _.map(sentenceGlosses.data.result, async function (result) {
                            await Promise.all(
                                _.map(result.sl_composition.sData, function (data) {
                                    calledData.push(data);
                                })
                            );
                        })
                    );
                } catch (e) {
                    // console.log(e);
                    this.sentenceInfo = { sentence: "", id: id, variable: dynamicVariables };

                    this.playerStatus = 3;
                    this.returnCallback();
                }
            } else if (level == "Ani") {
                for (let i = 0; i < id.length; i++) {
                    calledData.push(..._.cloneDeep(id[i].sl_composition.sData));
                }
            }

            let varLength = 0;
            _.map(calledData, (data) => {
                if (data.wAttribute === 16) varLength += 1;
            });
            if (!!dynamicVariables) {
                if (varLength !== dynamicVariables.length) {
                    this.playerStatus = 4;
                    calledData = [];
                    this.returnCallback();
                }
            }
            calledData = await this.fingerSpells._3_SetFingerSpellIdle(calledData);
            calledData = await this.fingerSpells._3_SetFingerSpellAttribute(calledData, dynamicVariables);
            // console.log(calledData);

            calledData = await this.fingerSpells._3_SetFingerSpellAniData(calledData, this.additiveAnimationsFile);
        } else if (version === 0.4) {
            if (level === "Sentence") {
                let sentenceGlosses = await apiDispatcher(this.config.APIOrigin + this.config.getSentenceAPI(id), "GET");
                let sentence = await apiDispatcher(this.config.APIOrigin + this.config.getSentenceInfoAPI(id), "GET");
                this.sentence = sentence.data.results;
                this.sentenceInfo = sentenceGlosses.data.results;
                calledData = sentenceGlosses.data.results.glosses;
            }
            // Lv4(세분류) 단위로 쿼리
            else if (level === 4) {
            } else if (level == "Ani") {
                calledData = _.cloneDeep(id);
            } else if (level == "Blending") {
                calledData = [{ animations: [] }];
                for (let i = 0; i < id.length; i++) {
                    calledData[0].animations.push(_.cloneDeep(id[i]));
                }
            }

            calledData = await this.fingerSpells._4_SetFingerSpellIdle(calledData);
            calledData = await this.fingerSpells._4_SetFingerSpellAttribute(calledData, dynamicVariables);
            calledData = await this.fingerSpells._4_SetFingerSpellAniData(calledData, this.additiveAnimationsFile);
        }

        await Promise.all(
            _.map(
                calledData,
                function (data) {
                    this.glosses.push(data);
                }.bind(this)
            )
        );
    }

    /**
     *  Idle 애니메이션 파일을 세팅
     */
    async setIdleEq4Files() {
        this.idleEq4File = await apiDispatcher(
            (this.system === "AzureService" ? this.config.APIOrigin : this.config.fileOrigin) +
                this.config.getEq4FileAPI() +
                this.config.getIdleFile(),
            "GET",
            null,
            null,
            this.system
        );

        this.idleEq4File = this.idleEq4File.data[0];

        this.morphEq4File = await apiDispatcher(
            (this.system === "AzureService" ? this.config.APIOrigin : this.config.fileOrigin) +
                this.config.getEq4FileAPI() +
                this.config.getAngryFile(),
            "GET",
            null,
            null,
            this.system
        );

        this.morphEq4File = this.morphEq4File.data[0];
    }

    /**
     *  Idle 애니메이션 파일을 세팅
     */
    async setMorphEq4Files() {
        this.morphEq4File = await apiDispatcher(
            (this.system === "AzureService" ? this.config.APIOrigin : this.config.fileOrigin) +
                this.config.getEq4FileAPI() +
                this.config.getAngryFile(),
            "GET",
            null,
            null,
            this.system
        );

        this.morphEq4File = this.morphEq4File.data[0];
    }

    /**
     *  추가 애니메이션 파일을 세팅
     */
    async setAddedEq4Files() {
        this.addedAnimationFile = await apiDispatcher(
            (this.system === "AzureService" ? this.config.APIOrigin : this.config.fileOrigin) +
                this.config.getEq4FileAPI() +
                this.config.getLeftArmIdleFile(),
            "GET",
            null,
            null,
            this.system
        );

        this.addedAnimationFile = this.addedAnimationFile.data[0];
    }

    /**
     *  하나의 애니메이션 플레이를 위한 파일을 세팅
     */
    async setOneAnimationEq4File(path) {
        if (this.system === "CMS2.0") {
            path = "animations" + path;
        }
        this.oneAnimationEq4File = await apiDispatcher(
            this.config.fileOrigin + this.config.getEq4FileAPI() + path,
            "GET",
            null,
            null,
            this.system
        );

        this.oneAnimationEq4File = this.oneAnimationEq4File.data[0];
    }

    /**
     *  EQ4File을 파싱하여 클립 생성을 위한 구조로 Converting
     */
    async eq4FileToClipStructure(file, index) {
        file.tracks = file.track;

        let rightShoulder1Position = _.find(file.tracks, (track) => {
            return track.name == "RightShoulder1.position";
        });
        let rightShoulder1Quaternion = _.find(file.tracks, (track) => {
            return track.name == "RightShoulder1.quaternion";
        });
        let rightShoulder1Scale = _.find(file.tracks, (track) => {
            return track.name == "RightShoulder1.scale";
        });

        await Promise.all(
            _.remove(
                file.tracks,
                function (track) {
                    if (track.type == "Morph") {
                        if (this.meshFace.morphTargetDictionary[track.morphName] !== undefined) {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }.bind(this)
            )
        );

        if (!rightShoulder1Position && !rightShoulder1Quaternion && !rightShoulder1Scale) {
        } else {
            if (!rightShoulder1Position) {
                file.tracks.push({
                    type: "Vector",
                    name: "RightShoulder1.position",
                    times: [0],
                    values: [
                        this.retargetInfo.position["RightShoulder1"].x,
                        this.retargetInfo.position["RightShoulder1"].y,
                        this.retargetInfo.position["RightShoulder1"].z,
                    ],
                });
            }
            if (!rightShoulder1Quaternion) {
                file.tracks.push({
                    type: "Quaternion",
                    name: "RightShoulder1.quaternion",
                    times: [0],
                    quaternionValues: [
                        this.retargetInfo.originQuaternion["RightShoulder1"]._x,
                        this.retargetInfo.originQuaternion["RightShoulder1"]._y,
                        this.retargetInfo.originQuaternion["RightShoulder1"]._z,
                        this.retargetInfo.originQuaternion["RightShoulder1"]._w,
                    ],
                });
            }
            if (!rightShoulder1Scale) {
                file.tracks.push({
                    type: "Vector",
                    name: "RightShoulder1.scale",
                    times: [0],
                    values: [-1, -1, -1],
                });
            }
        }

        let bip001LastTime = 0;

        // Animation Retargeting
        await Promise.all(
            _.map(
                file.tracks,
                async function (track) {
                    if (index !== undefined) {
                        // 애니메이션 속도 Default 값 적용
                        if (!this.isNumber(this.animations[index].Speed)) {
                            if (typeof this.animations[index].Speed == "object") {
                                if (!this.isNumber(this.animations[index].Speed[0])) {
                                    this.animations[index].Speed = 1;
                                } else {
                                    this.animations[index].Speed = this.animations[index].Speed[0];
                                }
                            } else {
                                this.animations[index].Speed = 1;
                            }
                        }

                        await Promise.all(
                            _.forEach(
                                track.times,
                                function (time, i) {
                                    track.times[i] = time / this.animations[index].Speed;
                                }.bind(this)
                            )
                        );
                    }

                    if (track.type == "Quaternion") {
                        track.values = track.quaternionValues;
                    }
                    if (track.type == "Morph") {
                        let morphNum = this.meshFace.morphTargetDictionary[track.morphName];
                        track.type = "Number";
                        track.name = track.name + ".morphTargetInfluences[" + morphNum + "]";
                    }

                    if (track.name.search(".position") > -1) {
                        let name = track.name.split(".position")[0];

                        if (this.retargetInfo.position[name] === undefined && name !== "Bip001") {
                            return;
                        }

                        if (name == "Bip001") {
                            if (index !== undefined) {
                                if (this.animations[index].isFingerspell) {
                                    for (let j = 0; j < track.times.length; j++) {
                                        track.times[j] = track.times[j] + 0.18;
                                    }

                                    track.times.unshift(0);
                                    track.times.push(track.times[track.times.length - 1] + 0.18);

                                    let val1 = track.values[0];
                                    let val2 = track.values[1];
                                    let val3 = track.values[2];

                                    track.values.unshift(val3);
                                    track.values.unshift(val2);
                                    track.values.unshift(val1);

                                    val1 = track.values[track.values.length - 3];
                                    val2 = track.values[track.values.length - 2];
                                    val3 = track.values[track.values.length - 1];

                                    track.values.push(val1);
                                    track.values.push(val2);
                                    track.values.push(val3);
                                }
                            }

                            bip001LastTime = _.last(track.times);

                            for (let j = 0; j < track.values.length; j += 3) {
                                track.values[j + 1] = 93.9000015258789;
                            }
                        } else {
                            if (index !== undefined) {
                                if (this.animations[index].isFingerspell) {
                                    for (let j = 0; j < track.times.length; j++) {
                                        track.times[j] = track.times[j] + 0.18;
                                    }

                                    track.times.unshift(0);
                                    track.times.push(track.times[track.times.length - 1] + 0.18);

                                    let val1 = track.values[0];
                                    let val2 = track.values[1];
                                    let val3 = track.values[2];

                                    track.values.unshift(val3);
                                    track.values.unshift(val2);
                                    track.values.unshift(val1);

                                    val1 = track.values[track.values.length - 3];
                                    val2 = track.values[track.values.length - 2];
                                    val3 = track.values[track.values.length - 1];

                                    track.values.push(val1);
                                    track.values.push(val2);
                                    track.values.push(val3);
                                }
                            }

                            let pushTime = false;
                            if (bip001LastTime > _.last(track.times)) {
                                pushTime = true;
                            }

                            for (let j = 0; j < track.values.length; j += 3) {
                                track.values[j] = this.retargetInfo.position[name].x;
                                track.values[j + 1] = this.retargetInfo.position[name].y;
                                track.values[j + 2] = this.retargetInfo.position[name].z;
                            }

                            if (pushTime) {
                                track.times.push(bip001LastTime);

                                let values1 = track.values[track.values.length - 3];
                                let values2 = track.values[track.values.length - 2];
                                let values3 = track.values[track.values.length - 1];
                                track.values.push(values1);
                                track.values.push(values2);
                                track.values.push(values3);
                            }
                        }
                    } else if (track.name.search(".quaternion") > -1) {
                        if (index !== undefined) {
                            if (this.animations[index].isFingerspell) {
                                for (let j = 0; j < track.times.length; j++) {
                                    track.times[j] = track.times[j] + 0.18;
                                }

                                track.times.unshift(0);
                                track.times.push(track.times[track.times.length - 1] + 0.18);

                                let val1 = track.values[0];
                                let val2 = track.values[1];
                                let val3 = track.values[2];
                                let val4 = track.values[3];

                                track.values.unshift(val4);
                                track.values.unshift(val3);
                                track.values.unshift(val2);
                                track.values.unshift(val1);

                                val1 = track.values[track.values.length - 4];
                                val2 = track.values[track.values.length - 3];
                                val3 = track.values[track.values.length - 2];
                                val4 = track.values[track.values.length - 1];

                                track.values.push(val1);
                                track.values.push(val2);
                                track.values.push(val3);
                                track.values.push(val4);
                            }
                        }

                        if (track.name.search("Hips") > -1) return;

                        let name = track.name.split(".quaternion")[0];

                        // if (this.retargetInfo.quaternion[name] === undefined || name === "RightShoulder1") {
                        //     return;
                        // }

                        let pushTime = false;
                        if (bip001LastTime > _.last(track.times)) {
                            pushTime = true;
                        }

                        // for (let j = 0; j < track.values.length; j += 4) {
                        //     let qax = track.values[j],
                        //         qay = track.values[j + 1],
                        //         qaz = track.values[j + 2],
                        //         qaw = track.values[j + 3];
                        //     let qbx = this.retargetInfo.quaternion[name]._x,
                        //         qby = this.retargetInfo.quaternion[name]._y,
                        //         qbz = this.retargetInfo.quaternion[name]._z,
                        //         qbw = this.retargetInfo.quaternion[name]._w;

                        //     track.values[j] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
                        //     track.values[j + 1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
                        //     track.values[j + 2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
                        //     track.values[j + 3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
                        // }

                        if (pushTime) {
                            track.times.push(bip001LastTime);

                            let values1 = track.values[track.values.length - 4];
                            let values2 = track.values[track.values.length - 3];
                            let values3 = track.values[track.values.length - 2];
                            let values4 = track.values[track.values.length - 1];
                            track.values.push(values1);
                            track.values.push(values2);
                            track.values.push(values3);
                            track.values.push(values4);
                        }
                    } else if (track.name.search(".scale") > -1) {
                        if (index !== undefined) {
                            if (this.animations[index].isFingerspell) {
                                for (let j = 0; j < track.times.length; j++) {
                                    track.times[j] = track.times[j] + 0.18;
                                }

                                track.times.unshift(0);
                                track.times.push(track.times[track.times.length - 1] + 0.18);

                                let val1 = track.values[0];
                                let val2 = track.values[1];
                                let val3 = track.values[2];

                                track.values.unshift(val3);
                                track.values.unshift(val2);
                                track.values.unshift(val1);

                                val1 = track.values[track.values.length - 3];
                                val2 = track.values[track.values.length - 2];
                                val3 = track.values[track.values.length - 1];

                                track.values.push(val1);
                                track.values.push(val2);
                                track.values.push(val3);
                            }
                        }
                    }
                }.bind(this)
            )
        );

        return file;
    }

    /**
     *  Eq4File Parsing 결과를 이용해 Clip을 생성한다.
     */
    async fileToClip(file) {
        let tmpClip = THREE.AnimationClip.parse(file);
        tmpClip.uuid = THREE.MathUtils.generateUUID();

        return tmpClip;
    }

    /**
     *  Glosses를 파싱하여 Animations를 생성한다.
     */
    async setAnimations(id, version, level) {
        if (version === 0.3) {
            await Promise.all(
                _.map(
                    this.glosses,
                    async function (gloss) {
                        await Promise.all(
                            _.map(
                                gloss.sl_composition.data,
                                function (animation) {
                                    animation.animationName = animation.ani_name;
                                    this.animations.push(animation);
                                }.bind(this)
                            )
                        );
                    }.bind(this)
                )
            );
        } else if (version === 0.4) {
            if (level == "Blending") {
                await Promise.all(
                    _.map(
                        this.glosses[0].animations,
                        async function (animation) {
                            this.animations.push(animation);
                        }.bind(this)
                    )
                );
            } else {
                await Promise.all(
                    _.map(
                        this.glosses,
                        async function (gloss, index) {
                            await Promise.all(
                                _.map(
                                    gloss.animations,
                                    async function (animation) {
                                        this.animationsSet.push(animation);

                                        await Promise.all(
                                            _.map(
                                                animation.components,
                                                function (component) {
                                                    animation.parentIndex = index;
                                                    // animation.animationName = animation.ani_name;
                                                    if (animation.attribute < 6) {
                                                        component["attribute"] = animation.attribute;
                                                    }
                                                    // if (animation.hasOwnProperty("v1_id")) component["v1_id"] = animation.v1_id;
                                                    // else component["v1_id"] = undefined;
                                                    this.animations.push(component);
                                                }.bind(this)
                                            )
                                        );
                                    }.bind(this)
                                )
                            );
                        }.bind(this)
                    )
                );
            }
        }
    }

    async getEq4FilesAllList(id, version, level) {
        // this.eq4FileList = await apiDispatcher(this.config.APIOrigin + this.config.getEq4FileAllListAPI(), "GET");
        // this.tmpFileList = this.eq4FileList.data.data;
        this.eq4FileList = await apiDispatcher(
            this.config.APIOrigin + this.config.getEq4FileAllListAPI(),
            "GET",
            null,
            "",
            this.system
        );
        if (Array.isArray(this.eq4FileList.data)) {
            this.tmpFileList = this.eq4FileList.data[0].data;
        } else {
            this.tmpFileList = this.eq4FileList.data.data;
        }
    }

    /**
     *  Animations를 파싱하여 파일을 로드한다.
     */
    async setEq4Files(id, version, level) {
        let promise = [];
        let tmpFileList = _.cloneDeep(this.tmpFileList);

        await Promise.all(
            _.map(
                this.animations,
                async function (animation, index) {
                    if (
                        !!this.workerEnabled &&
                        (index >= this.maxLoadingAnimation * this.loadingCount ||
                            index < this.maxLoadingAnimation * (this.loadingCount - 1))
                    )
                        return;

                    if (version == 0.3) {
                        let filepathIndex = await this.searchStringInArray(animation.animationName + ".eq4", tmpFileList);
                        tmpFileList[filepathIndex] = tmpFileList[filepathIndex].replace("models/", "");
                        // promise[index] = apiDispatcher(this.config.APIOrigin + this.config.getEq4FileAPI(), "GET", null, {
                        //     filepath: this.config.getEq4Filepath(tmpFileList[filepathIndex]),
                        // });
                        promise[index] = apiDispatcher(
                            this.config.APIOrigin + this.config.getEq4FileAPI(),
                            "GET",
                            null,
                            {
                                filepath: this.config.getEq4Filepath(tmpFileList[filepathIndex]),
                            },
                            this.system
                        );
                    } else if (version == 0.4) {
                        // promise[index] = apiDispatcher(this.config.APIOrigin + this.config.getEq4FileAPI(), "GET", null, {
                        //     filepath: this.config.getEq4Filepath(animation),
                        // });
                        promise[index] = apiDispatcher(
                            this.config.fileOrigin + this.config.getEq4FileAPI() + this.config.getEq4Filepath(animation),
                            "GET",
                            null,
                            null,
                            this.system
                        );
                    }
                }.bind(this)
            )
        );

        let responses = await Promise.all(promise);
        let modifiedAniList = [];

        try {
            await Promise.all(
                _.map(
                    responses,
                    function (response, index) {
                        response.data[0].name = decodeURIComponent(response.data[0].name);
                        this.eq4Files.push(response.data[0]);

                        // if (this.animations[index].attribute === 48 && this.animations[index].attributeSubIdx === 1) {
                        //     // add tmp clips
                        //     let additiveAni = {};

                        //     _.map(response.data[0].track, (track) => {
                        //         if (track.name.search("Left") > -1) {
                        //             additiveAni[track.name] = track;
                        //         }
                        //     });
                        //     // console.log(this.eq4Files.length);
                        //     // console.log(index);
                        //     this.additiveAnimationsFile[index] = additiveAni;
                        //     // this.additiveAnimations.push(this.animations[index]);
                        // } else {
                        //     this.eq4Files.push(response.data[0]);
                        //     // modifiedAniList.push(this.animations[index]);
                        // }
                    }.bind(this)
                )
            );
        } catch (e) {
            // console.log(e);
        }
        // this.animations = modifiedAniList;

        // additiveAnimationsFile
        let additivePromise = [];
        await Promise.all(
            _.map(
                this.additiveAnimationsFile,
                async function (animation, index) {
                    if (version == 0.3) {
                        let filepathIndex = await this.searchStringInArray(animation.animationName + ".eq4", tmpFileList);
                        tmpFileList[filepathIndex] = tmpFileList[filepathIndex].replace("models/", "");
                        // promise[index] = apiDispatcher(this.config.APIOrigin + this.config.getEq4FileAPI(), "GET", null, {
                        //     filepath: this.config.getEq4Filepath(tmpFileList[filepathIndex]),
                        // });
                        additivePromise[index] = apiDispatcher(
                            this.config.APIOrigin + this.config.getEq4FileAPI(),
                            "GET",
                            null,
                            {
                                filepath: this.config.getEq4Filepath(tmpFileList[filepathIndex]),
                            },
                            this.system
                        );
                    } else if (version == 0.4) {
                        // promise[index] = apiDispatcher(this.config.APIOrigin + this.config.getEq4FileAPI(), "GET", null, {
                        //     filepath: this.config.getEq4Filepath(animation),
                        // });
                        additivePromise[index] = apiDispatcher(
                            this.config.fileOrigin + this.config.getEq4FileAPI() + this.config.getEq4Filepath(animation),
                            "GET",
                            null,
                            null,
                            this.system
                        );
                    }
                }.bind(this)
            )
        );

        let additiveResponses = await Promise.all(additivePromise);

        try {
            await Promise.all(
                _.map(
                    additiveResponses,
                    function (response, index) {
                        if (response !== undefined) {
                            response.data[0].name = decodeURIComponent(response.data[0].name);
                            //    this.eq4Files.push(response.data[0]);
                            // this.additiveAnimationsFile[index]["data"] = response.data[0];

                            let additiveAni = {};
                            _.map(response.data[0].track, (track) => {
                                if (track.name.search("Left") > -1) {
                                    additiveAni[track.name] = track;
                                }
                            });
                            // console.log(this.eq4Files.length);
                            // console.log(index);
                            this.additiveAnimationsFile[index]["data"] = additiveAni;
                        }
                    }.bind(this)
                )
            );
        } catch (e) {
            // console.log(e);
        }
    }

    /**
     *  Idle Clip Parsing을 위해 Clip 생성 전 Track값 변경
     */
    async setIdleFileStructure() {
        this.tmpIdleFile = await this.eq4FileToClipStructure(this.idleEq4File);
    }

    /**
     *  Animation Clip Parsing을 위해 Clip 생성 전 Track값 변경
     */
    async setOneAnimationFileStructure() {
        this.tmpOneAnimationFile = await this.eq4FileToClipStructure(this.oneAnimationEq4File);
    }

    /**
     *  Idle 클립을 생성
     */
    async setIdleClips() {
        this.idleClip = await this.fileToClip(this.tmpIdleFile);
    }

    /**
     *  One Animation 클립을 생성
     */
    async setOneAnimationClips() {
        this.oneAnimationClip = await this.fileToClip(this.tmpOneAnimationFile);
    }

    /**
     *  Clip Parsing을 위해 Clip 생성 전 Track값 변경
     */
    async setFileStructure(id, version, level) {
        await Promise.all(
            _.map(
                this.eq4Files,
                async function (file, index) {
                    let tmpFile = await this.eq4FileToClipStructure(file, index);
                    this.tmpClips[index] = tmpFile;
                }.bind(this)
            )
        );
    }

    /**
     *  Idle을 일부 Bone에만 적용한다.
     */
    async forceIdlePlay(adjustBones, weight) {
        this.idleIndex++;

        if (this.idleIndex > 120) {
            this.idleIndex = 0;
        }

        _.map(
            this.idleEq4File.tracks,
            function (track) {
                let nameArray = track.name.split(".");

                let exist = _.some(adjustBones, (value) => _.includes(nameArray[0], value));

                if (!exist) {
                    return;
                }
                if (!this.boneArray[nameArray[0]]) {
                    return;
                }

                if (nameArray[1] === "position") {
                    this.boneArray[nameArray[0]].position.set(
                        track.values[Math.ceil(this.idleIndex / 2) * 3],
                        track.values[Math.ceil(this.idleIndex / 2) * 3 + 1],
                        track.values[Math.ceil(this.idleIndex / 2) * 3 + 2]
                    );
                } else if (nameArray[1] === "quaternion") {
                    this.boneArray[nameArray[0]].quaternion.slerp(
                        new THREE.Quaternion(
                            track.quaternionValues[Math.ceil(this.idleIndex / 2) * 4],
                            track.quaternionValues[Math.ceil(this.idleIndex / 2) * 4 + 1],
                            track.quaternionValues[Math.ceil(this.idleIndex / 2) * 4 + 2],
                            track.quaternionValues[Math.ceil(this.idleIndex / 2) * 4 + 3]
                        ),
                        weight
                    );
                } else if (nameArray[1] === "scale") {
                    this.boneArray[nameArray[0]].scale.set(
                        track.values[Math.ceil(this.idleIndex / 2) * 3],
                        track.values[Math.ceil(this.idleIndex / 2) * 3 + 1],
                        track.values[Math.ceil(this.idleIndex / 2) * 3 + 2]
                    );
                } else {
                    let morphIndex = track.name.split("morphTargetInfluences[")[1];
                    morphIndex = morphIndex.split("]")[0];

                    if (
                        this.boneArray["Mesh_Face"].morphTargetDictionary["REye_Close"] == morphIndex ||
                        this.boneArray["Mesh_Face"].morphTargetDictionary["LEye_Close"] == morphIndex ||
                        this.boneArray["Mesh_Face"].morphTargetDictionary["REyeBrow_Lower"] == morphIndex ||
                        this.boneArray["Mesh_Face"].morphTargetDictionary["LEyeBrow_Lower"] == morphIndex
                    ) {
                        return;
                    }

                    if (track.values[Math.ceil(this.idleIndex / 2)] !== undefined) {
                        (this.boneArray["Mesh_Face"].morphTargetInfluences[parseInt(morphIndex)] =
                            track.values[Math.ceil(this.idleIndex / 2)]),
                            weight;
                    }
                }
            }.bind(this)
        );
    }

    /**
     *  Added Animation을 일부 Bone에만 적용한다.
     */
    async forceAddedAnimationPlay(adjustBones, weight) {
        this.addedAnimationIndex++;

        if (this.addedAnimationIndex > 120) {
            this.addedAnimationIndex = 0;
        }

        _.map(
            this.addedAnimationFile.track,
            function (track) {
                let nameArray = track.name.split(".");

                let exist = _.some(adjustBones, (value) => _.includes(nameArray[0], value));

                if (!exist) {
                    return;
                }
                if (!this.boneArray[nameArray[0]]) {
                    return;
                }

                if (nameArray[1] === "position") {
                    this.boneArray[nameArray[0]].position.set(
                        track.values[Math.ceil(this.addedAnimationIndex / 2) * 3],
                        track.values[Math.ceil(this.addedAnimationIndex / 2) * 3 + 1],
                        track.values[Math.ceil(this.addedAnimationIndex / 2) * 3 + 2]
                    );
                } else if (nameArray[1] === "quaternion") {
                    this.boneArray[nameArray[0]].quaternion.slerp(
                        new THREE.Quaternion(
                            track.quaternionValues[Math.ceil(this.addedAnimationIndex / 2) * 4],
                            track.quaternionValues[Math.ceil(this.addedAnimationIndex / 2) * 4 + 1],
                            track.quaternionValues[Math.ceil(this.addedAnimationIndex / 2) * 4 + 2],
                            track.quaternionValues[Math.ceil(this.addedAnimationIndex / 2) * 4 + 3]
                        ),
                        weight
                    );
                } else if (nameArray[1] === "scale") {
                    this.boneArray[nameArray[0]].scale.set(
                        track.values[Math.ceil(this.addedAnimationIndex / 2) * 3],
                        track.values[Math.ceil(this.addedAnimationIndex / 2) * 3 + 1],
                        track.values[Math.ceil(this.addedAnimationIndex / 2) * 3 + 2]
                    );
                } else {
                    let morphIndex = track.name.split("morphTargetInfluences[")[1];
                    morphIndex = morphIndex.split("]")[0];

                    if (track.values[Math.ceil(this.addedAnimationIndex / 2)] !== undefined) {
                        (this.boneArray["Mesh_Face"].morphTargetInfluences[parseInt(morphIndex)] =
                            track.values[Math.ceil(this.addedAnimationIndex / 2)]),
                            weight;
                    }
                }
            }.bind(this)
        );
    }

    /**
     *  Morph 애니메이션을 일부 Bone에만 적용한다.
     */
    async forceMorphPlay(weight) {
        this.morphIndex++;

        if (this.morphIndex > 60) {
            this.morphIndex = 0;
        }

        _.map(
            this.morphEq4File.track,
            function (track) {
                if (track.name == "Mesh_Face") {
                    let morphIndex = this.boneArray["Mesh_Face"].morphTargetDictionary[track.morphName];

                    if (
                        this.boneArray["Mesh_Face"].morphTargetDictionary["REye_Close"] == morphIndex ||
                        this.boneArray["Mesh_Face"].morphTargetDictionary["LEye_Close"] == morphIndex ||
                        this.boneArray["Mesh_Face"].morphTargetDictionary["REyeBrow_Lower"] == morphIndex ||
                        this.boneArray["Mesh_Face"].morphTargetDictionary["LEyeBrow_Lower"] == morphIndex
                    ) {
                        return;
                    }

                    if (track.values[Math.ceil(this.morphIndex / 2)] !== undefined) {
                        (this.boneArray["Mesh_Face"].morphTargetInfluences[parseInt(morphIndex)] =
                            track.values[Math.ceil(this.morphIndex / 2)]),
                            weight;
                    }
                } else {
                    return;
                }
            }.bind(this)
        );
    }

    /**
     *  tmpClips를 이용하여 클립을 생성
     */
    async setClips(id, version, level) {
        await Promise.all(
            _.map(
                this.tmpClips,
                async function (file) {
                    let clip = await this.fileToClip(file);
                    this.clips.push(clip);
                }.bind(this)
            )
        );
    }

    /**
     *  Idle 클립을 이용하여 플레이가 가능한 액션 생성
     */
    async setIdleActions() {
        this.idleAction = this.mixer.clipAction(this.idleClip);
        this.idleAction.play();
    }

    /**
     *  One Animation 클립을 이용하여 플레이가 가능한 액션 생성
     */
    async setOneAnimation(filename) {
        this.oneAnimationAction = this.mixer.clipAction(this.oneAnimationClip);
        this.oneAnimationAction.clampWhenFinished = true;
        this.oneAnimationAction.setLoop(THREE.LoopOnce);
        this.oneAnimationAction.play();
        this.oneAnimationPlaying = true;
        if (this.captureEnable) {
            this.captureNow = true;
            this.capturer = new CCapture({
                format: "png",
                framerate: 30,
                name: filename.split(".")[0] + "_capture",
                workersPath: "/static/",
            });
            this.capturer.start();
            this.captureFilename = filename;
            this.captureEnd = false;
        } else if (this.captureGifEnable) {
            this.captureGifNow = true;
            this.capturer = new CCapture({
                format: "gif",
                framerate: 60,
                name: filename.split(".")[0],
                workersPath: "/static/",
            });
            this.capturer.start();
            this.captureGifEnd = false;
        }
    }

    /**
     *  Clips를 이용하여 플레이가 가능한 액션 생성
     */
    async setActions(id, version, level) {
        _.map(
            this.clips,
            async function (clip) {
                let action = await this.mixer.clipAction(clip);
                this.actions.push(action);
            }.bind(this)
        );

        if (this.captureEnable) {
            this.captureNow = true;
            this.capturer = new CCapture({
                format: "png",
                framerate: 30,
                name: id + "_sentence_capture",
                workersPath: "/static/",
            });
            this.capturer.start();
            this.captureFilename = id + "_sentence";
            this.captureEnd = false;
        }
    }

    /**
     *  준비된 Actions를 Blending하며 1회 플레이한다.
     */
    async playWithBlendingOnce() {
        this.setMixerTimeScale(this.playSpeed);

        this.currentPlayTime = 0;
        this.mixer.setTime(this.currentPlayTime);
        await Promise.all(
            _.map(
                this.actions,
                function (action, index) {
                    action.setEffectiveWeight(0);

                    action.setLoop(THREE.LoopRepeat);
                    action.startAt(this.animations[index].parentStartTime);
                    // action.setEffectiveTimeScale(this.animations[index].speed);
                    action.play();
                }.bind(this)
            )
        );

        this.actionPlaying = true;

        if (this.workerEnabled) {
            this.loadingWorker.onmessage = async (response) => {
                if (response.data.moreLoadingCount !== this.moreLoadingCount) return;
                if (response.data.isError) {
                    this.disConnectPanel(true);
                    this.playerStatus = 5;
                    this.actionPlaying = false;
                    this.idleAction.setEffectiveWeight(1);
                    if (this.callbackEnable) {
                        this.returnCallback();
                    }

                    return;
                }

                this.workerResponse = {
                    eq4Files: response.data.eq4Files,
                    tmpClips: response.data.tmpClips,
                };

                this.moreLoadingContext = "workerEnd";
            };
        }
    }

    async actionPlayPrepareBlender() {
        this.isBlendingPage = true;

        _.map(
            this.animations,
            function (animation, index) {
                this.actions[index].setEffectiveWeight(0);

                this.actions[index].setLoop(THREE.LoopRepeat);
                this.actions[index].startAt(animation.parentStartTime);
                // this.actions[index].setEffectiveTimeScale(animation.speed);
                this.actions[index].play();
                this.actions[index].paused = true;
            }.bind(this)
        );
    }

    /**
     *  준비된 Actions를 Blending하며 무한 플레이한다.
     */
    async playWithBlendingInBlender() {
        this.actionPaused = false;
        this.actionPlayingBlender = true;

        _.map(this.actions, function (action) {
            action.paused = false;
        });

        this.mixer.setTime(this.currentPlayTime);
    }

    /**
     *  Play를 중지한다.
     */
    async actionStopBlender() {
        this.actionPaused = true;
        this.actionPlayingBlender = false;
        this.currentPlayTime = 0;
        this.pauseTime = 0;
        this.mixer.setTime(this.currentPlayTime);

        _.map(
            this.actions,
            function (action, index) {
                action.setEffectiveWeight(0);
                action.paused = true;
            }.bind(this)
        );

        this.idleAction.setEffectiveWeight(1);
    }

    async setMixerTimeScaleBlender(speed) {}

    /**
     *  렌더링 시 프레임마다 각 애니메이션의 Weight값을 계산하여 Blending과 Play를 관리한다.
     */
    async actionSetWeight(kinematics) {
        let totalWeight = 0;
        let fingerspellWeight = 0;

        try {
            // 현재 Play할 애니메이션이 있는지 체크한다.
            if (this.actionPlaying || this.actionPlayingBlender || (!this.actionPlayingBlender && this.currentPlayTime > 0)) {
                if (this.actionPlaying || this.actionPlayingBlender) {
                    this.currentPlayTime = this.mixer.time;
                }

                // 반복 재생 체크
                if (
                    this.repeatEndTime !== 0 &&
                    (this.repeatStartTime > this.currentPlayTime || this.repeatEndTime <= this.currentPlayTime)
                ) {
                    this.currentPlayTime = this.repeatStartTime;
                    this.mixer.setTime(this.currentPlayTime);
                }

                // 재생 시간이 끝났는지 체크
                if (this.actionPlayingBlender) {
                    if (this.blendings[this.blendings.length - 1].trackEndTime <= this.currentPlayTime) {
                        this.currentPlayTime = 0;
                        this.mixer.setTime(this.currentPlayTime);
                        this.actionStopBlender();
                    }
                } else if (this.actionPlaying) {
                    if (this.blendings[this.blendings.length - 1].trackEndTime <= this.currentPlayTime) {
                        this.actionPlaying = false;
                        this.actions[this.actions.length - 1].setEffectiveWeight(0);

                        this.playerStatus = 1;
                        await this.returnCallback();
                        this.playerStatus = 0;

                        if (this.captureEnable) {
                            this.captureNow = false;
                            this.capturer.stop();
                            if (this.captureDownloadAuto) {
                                this.capturer.save(async (blob) => {
                                    const formData = new FormData();
                                    formData.append(this.captureFilename + "_capture.tar", blob);

                                    let response = await apiDispatcher(
                                        this.config.APIOrigin + "animations-gif",
                                        "POST",
                                        formData
                                    );

                                    if (response.status == 200) {
                                        this.captureEnd = true;
                                        this.captureEnable = false;
                                        this.captureDownloadAuto = false;

                                        this.downloadFile(
                                            this.config.webpOrigin + response.data.results.filename,
                                            response.data.results.filename
                                        );
                                    }
                                });
                            } else {
                                this.capturer.save(async (blob) => {
                                    const formData = new FormData();
                                    formData.append(this.captureFilename + "_capture.tar", blob);

                                    let response = await apiDispatcher(
                                        this.config.APIOrigin + "animations-gif",
                                        "POST",
                                        formData
                                    );

                                    if (response.status == 200) {
                                        this.captureEnd = true;
                                    }
                                });
                            }
                        } else if (this.captureGifEnable) {
                            this.captureGifNow = false;
                            this.capturer.stop();
                            if (this.captureGifDownloadAuto) {
                                this.capturer.save();
                                this.captureGifEnd = true;
                                this.captureGifEnable = false;
                                this.captureGifDownloadAuto = false;
                            }
                        }
                    }
                }

                let blendingWeight = 0;
                let playFingerspell = false;
                let isFingerspellBlending = false;
                let currentAnimationWeight = null;
                let blendingBlock = null;

                // Blending Block의 Track 시각 정보를 활용해 각 애니메이션의 FadeIn, FadeOut Weight를 체크한다.
                await Promise.all(
                    _.map(
                        this.blendings,
                        function (blending) {
                            if (
                                blending.trackStartTime <= this.currentPlayTime &&
                                blending.trackEndTime >= this.currentPlayTime
                            ) {
                                blendingBlock = _.cloneDeep(blending);

                                if (blending.fadeInIndex !== null && blending.fadeOutIndex !== null) {
                                    if (!this.actions[blending.fadeInIndex]) return;
                                    if (!this.actions[blending.fadeOutIndex]) return;

                                    blendingWeight =
                                        1 -
                                        (this.currentPlayTime - blending.trackStartTime) /
                                            this.animations[blending.fadeOutIndex].blendingDuration;

                                    blendingBlock.fadeOutWeight = blendingWeight;

                                    blendingWeight =
                                        (this.currentPlayTime - blending.trackStartTime) /
                                        this.animations[blending.fadeOutIndex].blendingDuration;

                                    blendingBlock.fadeInWeight = blendingWeight;
                                } else {
                                    if (blending.fadeOutIndex !== null) {
                                        if (!this.actions[blending.fadeOutIndex]) return;

                                        blendingWeight = 1 - (this.currentPlayTime - blending.trackStartTime) / 0.3;

                                        blendingBlock.fadeOutWeight = blendingWeight;
                                    }

                                    if (blending.fadeInIndex !== null) {
                                        if (!this.actions[blending.fadeInIndex]) return;

                                        blendingWeight = (this.currentPlayTime - blending.trackStartTime) / 0.3;

                                        blendingBlock.fadeInWeight = blendingWeight;
                                    }
                                }
                            }
                        }.bind(this)
                    )
                );

                // Animations를 순회하며 현재 Play 되는 애니메이션에 Weight값 적용
                await Promise.all(
                    _.map(
                        this.animations,
                        function (animation, index) {
                            if (!this.actions[index]) return;

                            // 각 애니메이션의 재생이 끝난 후 3초가 지났는지 체크하여 Cache 삭제
                            // if (this.actionPlaying) {
                            //     if (this.currentPlayTime > animation.parentEndTime + 3) {
                            //         this.mixer.uncacheClip(this.clips[index]);
                            //         this.mixer.uncacheAction(this.clips[index]);
                            //         this.eq4Files[index] = null;
                            //         this.tmpClips[index] = null;
                            //         this.clips[index] = null;
                            //         this.actions[index] = null;

                            //         return;
                            //     }
                            // }

                            // 재생 중인 애니메이션인지 확인하여 Blending Block과 비교, Weight값 적용
                            if (
                                animation.trackStartTime <= this.currentPlayTime &&
                                animation.trackEndTime >= this.currentPlayTime
                            ) {
                                this.actions[index].time = this.currentPlayTime - animation.parentStartTime;

                                if (animation.isFingerspell) {
                                    playFingerspell = true;
                                    kinematics.playedFingerspellAnimations(animation, index);
                                }

                                if (blendingBlock !== null) {
                                    if (index === blendingBlock.fadeInIndex) {
                                        this.actions[index].setEffectiveWeight(blendingBlock.fadeInWeight);
                                        totalWeight += blendingBlock.fadeInWeight;

                                        if (animation.isFingerspell) {
                                            fingerspellWeight += blendingBlock.fadeInWeight;
                                            isFingerspellBlending = true;

                                            if (Object.keys(kinematics.playedAnimations).length == 1) {
                                                isFingerspellBlending = false;

                                                currentAnimationWeight = blendingBlock.fadeInWeight;
                                                kinematics.setRightHandIKPosition(
                                                    index,
                                                    blendingBlock.fadeInWeight,
                                                    "fadeIn",
                                                    this.actions,
                                                    this.mixer._accuIndex + 1,
                                                    this.currentPlayTime,
                                                    this.animations
                                                );
                                            }
                                        }
                                    } else if (index === blendingBlock.fadeOutIndex) {
                                        this.actions[index].setEffectiveWeight(blendingBlock.fadeOutWeight);
                                        totalWeight += blendingBlock.fadeOutWeight;

                                        if (animation.isFingerspell) {
                                            fingerspellWeight += blendingBlock.fadeOutWeight;
                                            isFingerspellBlending = true;
                                            currentAnimationWeight = blendingBlock.fadeOutWeight;

                                            if (Object.keys(kinematics.playedAnimations).length == 1) {
                                                isFingerspellBlending = false;
                                            }

                                            kinematics.setRightHandIKPosition(
                                                index,
                                                blendingBlock.fadeOutWeight,
                                                "fadeOut",
                                                this.actions,
                                                this.mixer._accuIndex + 1,
                                                this.currentPlayTime,
                                                this.animations
                                            );
                                        }
                                    }
                                } else {
                                    this.actions[index].setEffectiveWeight(1);
                                    totalWeight = 1;

                                    if (animation.isFingerspell) {
                                        fingerspellWeight = 1;
                                        currentAnimationWeight = 1;
                                        kinematics.setRightHandIKPosition(
                                            index,
                                            1,
                                            "full",
                                            this.actions,
                                            this.mixer._accuIndex + 1,
                                            this.currentPlayTime,
                                            this.animations
                                        );
                                    }
                                }

                                // 매번 [maxLoadingAnimation]개의 애니메이션 중 두 번째 애니메이션이 플레이 시 Partial Loading Worker를 실행한다.
                                if (this.actionPlaying) {
                                    if (index % this.maxLoadingAnimation === 1 && !animation.played) {
                                        this.loadingCount++;
                                        animation.played = true;

                                        if (this.workerEnabled) {
                                            this.loadingWorker.postMessage({
                                                message: "AnimationLoadMore",
                                                data: {
                                                    animations: this.animations,
                                                    maxLoadingAnimation: this.maxLoadingAnimation,
                                                    loadingCount: this.loadingCount,
                                                    tmpFileList: this.tmpFileList,
                                                    morphDictionary: this.meshFace.morphTargetDictionary,
                                                    retargetInfo: this.retargetInfo,
                                                    moreLoadingCount: this.moreLoadingCount,
                                                    system: this.system,
                                                    version: this.version,
                                                },
                                            });
                                        }
                                    }
                                }
                            } else {
                                this.actions[index].setEffectiveWeight(0);
                            }
                        }.bind(this)
                    )
                );

                if (playFingerspell) {
                    if (this.currentPlayTime == this.mixer.time) {
                        this.forceIdlePlay(
                            ["Spine", "Chest", "Upper_Chest", "Neck", "RightShoulder", "Mesh_Face"],
                            fingerspellWeight
                        );
                        this.forceAddedAnimationPlay(["LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand"], fingerspellWeight);
                        // this.forceMorphPlay(fingerspellWeight);
                        // kinematics.tween.update();
                        kinematics.solve("rightHand", true, currentAnimationWeight, isFingerspellBlending);
                    }
                    if (this.setCurrentPlayTimeBlenderEnabled) {
                        kinematics.solve("rightHand", true, currentAnimationWeight, isFingerspellBlending);
                        this.setCurrentPlayTimeBlenderEnabled = false;
                    }
                }

                this.playFingerspell = playFingerspell;

                // 애니메이션 총 Weight 계산
                // await Promise.all(
                //     _.map(
                //         this.actions,
                //         function(action) {
                //             if (!action) return;
                //             if (action.weight === undefined) action.setEffectiveWeight(0);

                //             totalWeight += action.weight;
                //         }.bind(this)
                //     )
                // );
            }

            if (this.avatarCapture) {
                this.capturer = new CCapture({
                    format: "png",
                });

                if (this.avatarCaptureEnd) {
                    this.avatarCapture = false;
                    this.avatarCaptureEnd = false;
                }
            }

            if (this.oneAnimationPlaying) {
                if (!this.oneAnimationAction.isRunning()) {
                    this.oneAnimationAction.stop();
                    this.oneAnimationPlaying = false;
                    totalWeight = 0;

                    if (this.captureEnable) {
                        this.captureNow = false;
                        this.capturer.stop();
                        if (this.captureDownloadAuto) {
                            this.capturer.save(async (blob) => {
                                const formData = new FormData();
                                formData.append(this.captureFilename.split(".")[0] + "_capture.tar", blob);

                                let response = await apiDispatcher(this.config.APIOrigin + "animations-gif", "POST", formData);

                                if (response.status == 200) {
                                    this.captureEnd = true;
                                    this.captureEnable = false;
                                    this.captureDownloadAuto = false;

                                    this.downloadFile(
                                        this.config.webpOrigin + response.data.results.filename,
                                        response.data.results.filename
                                    );
                                }
                            });
                        } else {
                            this.capturer.save(async (blob) => {
                                const formData = new FormData();
                                formData.append(this.captureFilename.split(".")[0] + "_capture.tar", blob);

                                let response = await apiDispatcher(this.config.APIOrigin + "animations-gif", "POST", formData);

                                if (response.status == 200) {
                                    this.captureEnd = true;
                                }
                            });
                        }
                    } else if (this.captureGifEnable) {
                        this.captureGifNow = false;
                        this.capturer.stop();
                        if (this.captureGifDownloadAuto) {
                            this.capturer.save();
                            this.captureGifEnd = true;
                            this.captureGifEnable = false;
                            this.captureGifDownloadAuto = false;
                        }
                    }
                } else {
                    totalWeight = 1;
                }
            }

            // 애니메이션 총 Weight가 1이 되지 않으면 남은 Weight는 Idle Action으로 채운다.
            if (totalWeight <= 1 && (this.actionPlaying || this.actionPlayingBlender || this.oneAnimationPlaying)) {
                this.idleAction.setEffectiveWeight(1 - totalWeight);
            }
            if (totalWeight === 0) {
                this.idleAction.setEffectiveWeight(1);
            }

            // 애니메이션 Partial Loading을 진행한다.
            if (this.actionPlaying) this.animationLoadMore();
            kinematics.playedAnimationsReset();

            if (!this.actionPlaying) {
                _.map(this.actions, function (action) {
                    action.setEffectiveWeight(0);
                });
            }
        } catch (e) {
            // console.log(e);
            this.playerStatus = 5;
            // await webGLPlayer.stopPlaySentence();

            this.actionPlaying = false;
            if (this.idleAction) this.idleAction.setEffectiveWeight(1);
            if (this.callbackEnable) {
                this.returnCallback();
            }
        }
    }

    /**
     *  Blending 페이지에서 타임라인을 클릭했을 때 해당 구간으로 시간 이동, 혹은 해당 구간의 정지 모습을 Rendering 한다.
     */
    async setCurrentPlayTimeBlender(currentTime, kinematics) {
        let totalWeight = 0;
        this.currentPlayTime = currentTime;

        if (!this.actionPlayingBlender) {
            this.mixer.setTime(this.currentPlayTime);

            let blendingWeight = 0;
            let playFingerspell = false;
            let isFingerspellBlending = false;
            let currentAnimationWeight = null;
            let blendingBlock = null;

            this.setCurrentPlayTimeBlenderEnabled = true;

            // Blending Block의 Track 시각 정보를 활용해 각 애니메이션의 FadeIn, FadeOut Weight를 체크한다.
            await Promise.all(
                _.map(
                    this.blendings,
                    function (blending) {
                        if (blending.trackStartTime <= this.currentPlayTime && blending.trackEndTime >= this.currentPlayTime) {
                            blendingBlock = _.cloneDeep(blending);

                            if (blending.fadeInIndex !== null && blending.fadeOutIndex !== null) {
                                if (!this.actions[blending.fadeInIndex]) return;
                                if (!this.actions[blending.fadeOutIndex]) return;

                                blendingWeight =
                                    1 -
                                    (this.currentPlayTime - blending.trackStartTime) /
                                        this.animations[blending.fadeOutIndex].blendingDuration;

                                blendingBlock.fadeOutWeight = blendingWeight;

                                blendingWeight =
                                    (this.currentPlayTime - blending.trackStartTime) /
                                    this.animations[blending.fadeOutIndex].blendingDuration;

                                blendingBlock.fadeInWeight = blendingWeight;
                            } else {
                                if (blending.fadeOutIndex !== null) {
                                    if (!this.actions[blending.fadeOutIndex]) return;

                                    blendingWeight = 1 - (this.currentPlayTime - blending.trackStartTime) / 0.3;

                                    blendingBlock.fadeOutWeight = blendingWeight;
                                }

                                if (blending.fadeInIndex !== null) {
                                    if (!this.actions[blending.fadeInIndex]) return;

                                    blendingWeight = (this.currentPlayTime - blending.trackStartTime) / 0.3;

                                    blendingBlock.fadeInWeight = blendingWeight;
                                }
                            }
                        }
                    }.bind(this)
                )
            );

            // Animations를 순회하며 현재 Play 되는 애니메이션에 Weight값 적용
            await Promise.all(
                _.map(
                    this.animations,
                    function (animation, index) {
                        if (!this.actions[index]) return;

                        // 재생 중인 애니메이션인지 확인하여 Blending Block과 비교, Weight값 적용
                        if (animation.trackStartTime <= this.currentPlayTime && animation.trackEndTime >= this.currentPlayTime) {
                            this.actions[index].time = this.currentPlayTime - animation.parentStartTime;

                            if (animation.isFingerspell) {
                                playFingerspell = true;
                                kinematics.playedFingerspellAnimations(animation, index);
                            }

                            if (blendingBlock !== null) {
                                if (index === blendingBlock.fadeInIndex) {
                                    this.actions[index].setEffectiveWeight(blendingBlock.fadeInWeight);

                                    if (animation.isFingerspell) {
                                        isFingerspellBlending = true;

                                        if (Object.keys(kinematics.playedAnimations).length == 1) {
                                            isFingerspellBlending = false;

                                            currentAnimationWeight = blendingBlock.fadeInWeight;
                                            kinematics.setRightHandIKPosition(
                                                index,
                                                blendingBlock.fadeInWeight,
                                                "fadeIn",
                                                this.actions,
                                                this.mixer._accuIndex + 1,
                                                this.currentPlayTime,
                                                this.animations
                                            );
                                        }
                                    }
                                } else if (index === blendingBlock.fadeOutIndex) {
                                    this.actions[index].setEffectiveWeight(blendingBlock.fadeOutWeight);

                                    if (animation.isFingerspell) {
                                        isFingerspellBlending = true;
                                        currentAnimationWeight = blendingBlock.fadeOutWeight;

                                        if (Object.keys(kinematics.playedAnimations).length == 1) {
                                            isFingerspellBlending = false;
                                        }

                                        kinematics.setRightHandIKPosition(
                                            index,
                                            blendingBlock.fadeOutWeight,
                                            "fadeOut",
                                            this.actions,
                                            this.mixer._accuIndex + 1,
                                            this.currentPlayTime,
                                            this.animations
                                        );
                                    }
                                }
                            } else {
                                this.actions[index].setEffectiveWeight(1);

                                if (animation.isFingerspell) {
                                    currentAnimationWeight = 1;
                                    kinematics.setRightHandIKPosition(
                                        index,
                                        1,
                                        "full",
                                        this.actions,
                                        this.mixer._accuIndex + 1,
                                        this.currentPlayTime,
                                        this.animations
                                    );
                                }
                            }
                        } else {
                            this.actions[index].setEffectiveWeight(0);
                        }
                    }.bind(this)
                )
            );

            if (playFingerspell) {
                await kinematics.solve("rightHand", true, currentAnimationWeight, isFingerspellBlending);
            }

            this.playFingerspell = playFingerspell;

            // 애니메이션 총 Weight 계산
            await Promise.all(
                _.map(
                    this.actions,
                    function (action, index) {
                        if (!action) return;
                        if (action.weight === undefined) action.setEffectiveWeight(0);

                        totalWeight += action.weight;
                    }.bind(this)
                )
            );
        } else {
            this.mixer.setTime(this.currentPlayTime);
        }

        // 애니메이션 총 Weight가 1이 되지 않으면 남은 Weight는 Idle Action으로 채운다.
        if (totalWeight <= 1 && !this.actionPlayingBlender) this.idleAction.setEffectiveWeight(1 - totalWeight);

        kinematics.playedAnimationsReset();
    }

    /**
     *  Partial Loading 진행시 애니메이션 로딩을 진행하는 구간
     */
    async animationLoadMore() {
        if (this.moreLoadingContext === "workerEnd") {
            this.moreLoadingContext = "";

            await Promise.all(
                _.map(
                    this.workerResponse.eq4Files,
                    function (file, index) {
                        this.eq4Files.push(file);
                        this.tmpClips.push(this.workerResponse.tmpClips[index]);
                    }.bind(this)
                )
            );

            this.moreLoadingContext = "_3_toTimeBase";
        } else if (this.moreLoadingContext === "_3_toTimeBase") {
            this.moreLoadingContext = "";

            await this.protocolConverter._3_toTimebase(
                this.animations,
                this.tmpClips,
                this.blendings,
                this.maxLoadingAnimation,
                this.loadingCount,
                this.additiveAnimationsFile
            );

            this.animations = this.protocolConverter.convertedAnimations;
            this.blendings = this.protocolConverter.convertedBlendings;

            this.moreLoadingContext = "fileToClip";
        } else if (this.moreLoadingContext === "fileToClip") {
            this.moreLoadingContext = "";

            await Promise.all(
                _.map(
                    this.tmpClips,
                    async function (file, index) {
                        if (
                            index >= this.maxLoadingAnimation * this.loadingCount ||
                            index < this.maxLoadingAnimation * (this.loadingCount - 1)
                        )
                            return;

                        let clip = await this.fileToClip(file);
                        this.clips.push(clip);
                    }.bind(this)
                )
            );

            this.moreLoadingContext = "clipToAction";
        } else if (this.moreLoadingContext === "clipToAction") {
            this.moreLoadingContext = "";

            await Promise.all(
                _.map(
                    this.clips,
                    async function (clip, index) {
                        if (
                            index >= this.maxLoadingAnimation * this.loadingCount ||
                            index < this.maxLoadingAnimation * (this.loadingCount - 1)
                        )
                            return;

                        let action = await this.mixer.clipAction(clip);
                        this.actions.push(action);
                    }.bind(this)
                )
            );

            this.moreLoadingContext = "setActions";
        } else if (this.moreLoadingContext === "setActions") {
            this.moreLoadingContext = "";
            try {
                await Promise.all(
                    _.map(
                        this.actions,
                        function (action, index) {
                            if (
                                index >= this.maxLoadingAnimation * this.loadingCount ||
                                index < this.maxLoadingAnimation * (this.loadingCount - 1)
                            )
                                return;

                            action.setEffectiveWeight(0);
                            action.setLoop(THREE.LoopRepeat);
                            action.startAt(this.animations[index].parentStartTime);
                            // action.setEffectiveTimeScale(this.animations[index].speed);
                            action.play();
                        }.bind(this)
                    )
                );

                this.moreLoadingContext = "";
            } catch (e) {
                // console.log(e);
            }
        }
    }

    /**
     *  Mixer의 Play 속도를 설정한다.
     */
    async setMixerTimeScale(scale) {
        this.mixer.timeScale = scale;

        // if (scale == 0) {
        //     this.actionPlaying = false;
        // } else {
        //     this.actionPlaying = true;
        // }
    }

    /**
     *  Blender 페이지에서 Mixer의 Play를 재개한다.
     */
    async setMixerResumeBlender() {
        this.actionPaused = false;
        this.actionPlayingBlender = true;
        this.currentPlayTime = this.pauseTime;
        this.mixer.setTime(this.currentPlayTime);

        _.map(
            this.actions,
            function (action) {
                action.paused = false;
            }.bind(this)
        );
    }

    /**
     *  Blender 페이지에서 Mixer의 Play 속도를 설정한다.
     */
    async setMixerPauseBlender() {
        this.actionPaused = true;
        this.actionPlayingBlender = false;
        this.pauseTime = this.currentPlayTime;

        _.map(
            this.actions,
            function (action) {
                action.paused = true;
            }.bind(this)
        );
    }

    /**
     *  Blender 페이지에서 변경된 정보를 저장한다.
     */
    async saveSentenceBlendingInfo() {
        let response = await apiDispatcher(
            this.config.APIOrigin + this.config.getSentenceAPI(this.sentenceInfo.sentence_id),
            "PUT",
            this.sentenceInfo
        );

        return response;
    }

    /**
     *  Blender 페이지에서 변경된 정보를 Status="완료"까지 저장한다.
     */
    async saveSentenceStatusBlendingInfo() {
        this.sentenceInfo["status"] = "done";

        let response = await apiDispatcher(
            this.config.APIOrigin + this.config.getSentenceAPI(this.sentenceInfo.sentence_id),
            "PUT",
            this.sentenceInfo
        );

        return response;
    }

    /**
     *  Blender 페이지에서 애니메이션의 속도를 변경할 경우 해당 트랙값을 조정한다.
     */
    async changeAnimationSpeed(animationIndex) {
        await Promise.all(
            _.map(
                this.clips[animationIndex].tracks,
                function (track, index) {
                    _.map(
                        track.times,
                        function (time, i) {
                            time = i * 0.03333333333333333;
                            track.times[i] = time / this.animations[animationIndex].speed;
                        }.bind(this)
                    );
                }.bind(this)
            )
        );

        this.clips[animationIndex].resetDuration();
    }

    /**
     *  파일 전체 리스팅 배열 안에서 원하는 파일을 찾아낸다.
     */
    async searchStringInArray(str, strArray) {
        for (let j = 0; j < strArray.length; j++) {
            if (strArray[j].match(str)) return j;
        }
        return -1;
    }

    /**
     *  전달된 Parameter가 숫자인지 아닌지 판단
     */
    isNumber(n) {
        return typeof n === "number" || n instanceof Number;
    }

    /**
     *  callback 요청이 있으면 callback state를 리턴
     */
    async returnCallback() {
        const returnMsg = {
            1: "play done",
            2: "play stop",
            3: "error: check request id",
            4: "error: check variable id",
            5: "error: unknown",
        };
        if (this.callbackEnable && this.playerStatus > 0) {
            this.callback({
                status: this.playerStatus,
                message: returnMsg[this.playerStatus],
            });
            if (this.playerStatus !== 2) this.callbackEnable = false;

            this.actionPlaying = false;
            this.idleAction.setEffectiveWeight(1);
        }
    }

    async downloadFile(url, filename) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";
        xhr.onload = function () {
            var urlCreator = window.URL || window.webkitURL;
            var fileUrl = urlCreator.createObjectURL(this.response);
            var a = document.createElement("a");
            a.href = fileUrl;
            a.download = filename;
            a.click();
            urlCreator.revokeObjectURL(fileUrl);
        };
        xhr.send();
    }

    async initialDisconnectPanel(container) {
        let createdPanel = document.createElement("div");
        createdPanel.id = "disconnect_panel";
        createdPanel.style["background-color"] = "rgba(0,0,0,0.2)";
        createdPanel.style["height"] = !!container.style.height ? container.style.height : "100%";
        createdPanel.style["width"] = !!container.style.width ? container.style.width : "100%";
        createdPanel.style["position"] = "absolute";
        createdPanel.style["top"] = "0";
        createdPanel.style["display"] = "none";
        createdPanel.style["font-size"] = "25px";
        createdPanel.style["line-height"] = "40px";
        createdPanel.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:inline-flex; color:white;">
            <span style="margin:auto; text-align:center;" >
                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="currentColor" class="bi bi-wifi-off" viewBox="0 0 16 16">
                <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c.63 0 1.249.05 1.852.148l.854-.854zM8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065 8.448 8.448 0 0 1 3.51-1.27L8 6zm2.596 1.404.785-.785c.63.24 1.227.545 1.785.907a.482.482 0 0 1 .063.745.525.525 0 0 1-.652.065 8.462 8.462 0 0 0-1.98-.932zM8 10l.933-.933a6.455 6.455 0 0 1 2.013.637c.285.145.326.524.1.75l-.015.015a.532.532 0 0 1-.611.09A5.478 5.478 0 0 0 8 10zm4.905-4.905.747-.747c.59.3 1.153.645 1.685 1.03a.485.485 0 0 1 .047.737.518.518 0 0 1-.668.05 11.493 11.493 0 0 0-1.811-1.07zM9.02 11.78c.238.14.236.464.04.66l-.707.706a.5.5 0 0 1-.707 0l-.707-.707c-.195-.195-.197-.518.04-.66A1.99 1.99 0 0 1 8 11.5c.374 0 .723.102 1.021.28zm4.355-9.905a.53.53 0 0 1 .75.75l-10.75 10.75a.53.53 0 0 1-.75-.75l10.75-10.75z"/>
                </svg>
                <p>네트워크 에러</p>

            </span>
        </div>`;

        // createdPanel.innerHTML = `
        // <div style="position:relative; width:100%; height:100%; display:inline-flex; color:white;">
        //     <span style="margin:auto; text-align:center;" >
        //         <p>네트워크 에러</p>
        //     </span>
        // </div>`;

        container.appendChild(createdPanel);
    }

    async disConnectPanel(isError) {
        if (document.getElementById("disconnect_panel") == null) {
            return;
        }
        try {
            if (isError) {
                document.getElementById("disconnect_panel").style.display = "block";
            } else {
                document.getElementById("disconnect_panel").style.display = "none";
            }
        } catch (e) {
            // console.log(e);
        }
    }
}

export { WebGLMixer };
