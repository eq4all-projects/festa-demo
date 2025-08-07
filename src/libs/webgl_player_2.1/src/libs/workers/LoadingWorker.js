import * as _ from "lodash";
import { apiDispatcher } from "../APIs";
import { WebGLPlayerConfig } from "../WebGLPlayerConfig";

self.onmessage = async function (event) {
    let postData = {};

    let data = event.data.data;
    let message = event.data.message;
    // let APIOrigin = "https://service-az.eq4all.co.kr:8003/";

    if (data == undefined) {
        return;
    }
    let config = new WebGLPlayerConfig(data.system);

    if (message == "AnimationLoadMore") {
        try {
            let promise = new Array(data.maxLoadingAnimation);

            await Promise.all(
                _.map(data.animations, async function (animation, index) {
                    if (
                        index >= data.maxLoadingAnimation * data.loadingCount ||
                        index < data.maxLoadingAnimation * (data.loadingCount - 1)
                    )
                        return;

                    if (data.version === 0.3) {
                        let filepathIndex = await searchStringInArray(animation.animationName + ".eq4", data.tmpFileList);
                        data.tmpFileList[filepathIndex] = data.tmpFileList[filepathIndex].replace("models/", "");
                        // promise[index % data.maxLoadingAnimation] = axios({
                        //     url: APIOrigin + "service-api/eq4file/",
                        //     method: "GET",
                        //     params: { filepath: data.tmpFileList[filepathIndex] },
                        //     headers: { version: "0.1" },
                        // });
                        promise[index] = await apiDispatcher(
                            config.APIOrigin + config.getEq4FileAPI(),
                            "GET",
                            null,
                            {
                                filepath: config.getEq4Filepath(data.tmpFileList[filepathIndex]),
                            },
                            config.system
                        );
                    } else if (data.version === 0.4) {
                        promise[index] = apiDispatcher(
                            config.fileOrigin + config.getEq4FileAPI() + config.getEq4Filepath(animation),
                            "GET",
                            null,
                            null,
                            config.system
                        );
                    }
                })
            );

            let responses = await Promise.all(promise);
            let eq4Files = [];
            let tmpClips = [];
            await Promise.all(
                _.map(responses, function (response) {
                    if (response === undefined) return;

                    response.data[0].name = decodeURIComponent(response.data[0].name);
                    eq4Files.push(response.data[0]);
                })
            );

            await Promise.all(
                _.map(eq4Files, async function (file, index) {
                    let tmpFile = await eq4FileToClipStructure(
                        file,
                        data.retargetInfo,
                        data.morphDictionary,
                        data.animations,
                        data.maxLoadingAnimation * (data.loadingCount - 1) + index
                    );
                    tmpClips[index] = tmpFile;
                })
            );

            postData.eq4Files = eq4Files;
            postData.tmpClips = tmpClips;
            postData.moreLoadingCount = data.moreLoadingCount;
            postData.isError = false;
            postMessage(postData);
        } catch (e) {
            postData.moreLoadingCount = data.moreLoadingCount;
            postData.isError = true;
            postMessage(postData);
        }
    }
};

async function searchStringInArray(str, strArray) {
    for (let j = 0; j < strArray.length; j++) {
        if (strArray[j].match(str)) return j;
    }
    return -1;
}

async function eq4FileToClipStructure(file, retargetInfo, morphDictionary, animations, index) {
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
        _.remove(file.tracks, function (track) {
            if (track.type == "Morph") {
                if (morphDictionary[track.morphName] !== undefined) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        })
    );

    if (!rightShoulder1Position && !rightShoulder1Quaternion && !rightShoulder1Scale) {
    } else {
        if (!rightShoulder1Position) {
            file.tracks.push({
                type: "Vector",
                name: "RightShoulder1.position",
                times: [0],
                values: [
                    retargetInfo.position["RightShoulder1"].x,
                    retargetInfo.position["RightShoulder1"].y,
                    retargetInfo.position["RightShoulder1"].z,
                ],
            });
        }
        if (!rightShoulder1Quaternion) {
            file.tracks.push({
                type: "Quaternion",
                name: "RightShoulder1.quaternion",
                times: [0],
                quaternionValues: [
                    retargetInfo.originQuaternion["RightShoulder1"]._x,
                    retargetInfo.originQuaternion["RightShoulder1"]._y,
                    retargetInfo.originQuaternion["RightShoulder1"]._z,
                    retargetInfo.originQuaternion["RightShoulder1"]._w,
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
        _.map(file.tracks, async function (track) {
            if (index !== undefined) {
                // 애니메이션 속도 Default 값 적용
                if (!isNumber(animations[index].Speed)) {
                    if (typeof animations[index].Speed == "object") {
                        if (!isNumber(animations[index].Speed[0])) {
                            animations[index].Speed = 1;
                        } else {
                            animations[index].Speed = animations[index].Speed[0];
                        }
                    } else {
                        animations[index].Speed = 1;
                    }
                }

                await Promise.all(
                    _.forEach(track.times, function (time, i) {
                        track.times[i] = time / animations[index].Speed;
                    })
                );
            }

            if (track.type == "Quaternion") {
                track.values = track.quaternionValues;
            }
            if (track.type == "Morph") {
                let morphNum = morphDictionary[track.morphName];
                track.type = "Number";
                track.name = track.name + ".morphTargetInfluences[" + morphNum + "]";
            }

            if (track.name.search(".position") > -1) {
                let name = track.name.split(".position")[0];

                if (retargetInfo.position[name] === undefined && name !== "Bip001") {
                    return;
                }

                if (name == "Bip001") {
                    if (index !== undefined) {
                        if (animations[index].isFingerspell) {
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
                        if (animations[index].isFingerspell) {
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
                        track.values[j] = retargetInfo.position[name].x;
                        track.values[j + 1] = retargetInfo.position[name].y;
                        track.values[j + 2] = retargetInfo.position[name].z;
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
                    if (animations[index].isFingerspell) {
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

                // if (retargetInfo.quaternion[name] === undefined || name === "RightShoulder1") {
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
                //     let qbx = retargetInfo.quaternion[name]._x,
                //         qby = retargetInfo.quaternion[name]._y,
                //         qbz = retargetInfo.quaternion[name]._z,
                //         qbw = retargetInfo.quaternion[name]._w;

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
                    if (animations[index].isFingerspell) {
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
        })
    );

    return file;
}

function isNumber(n) {
    return typeof n === "number" || n instanceof Number;
}
