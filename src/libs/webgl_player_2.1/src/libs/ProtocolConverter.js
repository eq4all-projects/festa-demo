import * as _ from "lodash";

import { AnimationUtils } from "three";

import { JSONStructure } from "./JSONStructure";

class ProtocolConverter {
    constructor(version, system) {
        // Version
        this.protocolVersion = version;

        // Data
        this.jsonStructure = new JSONStructure();
        this.convertedAnimations = [];

        // Blendings
        this.convertedBlendings = [];

        // Clips
        this.convertedClips = [];

        // variable
        this.variableTrackSources = {};
        this.timeGap = 0;
        this.dynamic = false;
    }

    /**
     *  Percent 기반의 값을 TimeBase로 변경
     */
    async _3_toTimebase(animations, clips, blendings, maxLoadingAnimation, loadingCount, additiveAnimationsFile) {
        // let cloneAnimation = _.cloneDeep(animations);
        await Promise.all(
            _.map(
                animations,
                async function (animation, index) {
                    if (index >= maxLoadingAnimation * loadingCount || index < maxLoadingAnimation * (loadingCount - 1)) return;

                    await this.setDynamicWord(animations, clips, index, additiveAnimationsFile);

                    let animationDuration = clips[index].tracks[0].times[clips[index].tracks[0].times.length - 1];
                    animation.animationDuration = animationDuration;

                    // v1_id: cms 1.0 migrated data
                    // 애니메이션 시작 시점 Default 값 적용
                    // if (animation.v1_id) {
                    //     if (!this.isNumber(animation.Transition_Offset)) {
                    //         animation.Transition_Offset = 15;
                    //     } else if (animation.Transition_Offset === -1) {
                    //         animation.Transition_Offset = 0;
                    //     }

                    //     // 애니메이션 Blending 시점 Default 값 적용
                    //     if (!this.isNumber(animation.Transition_Duration)) {
                    //         animation.Transition_Duration = 0.3;
                    //     } else if (animation.Transition_Duration == -1) {
                    //         animation.Transition_Duration = 0.3;
                    //     }

                    //     // 애니메이션 완료 시점 Default 값 적용
                    //     if (!this.isNumber(animation.Exit_Time)) {
                    //         animation.Exit_Time = 65;

                    //         if (animations.length == index + 1) {
                    //             animation.Exit_Time = 100;
                    //         }
                    //     } else if (animation.Exit_Time == -1) {
                    //         animation.Exit_Time = 65;

                    //         if (animations.length == index + 1) {
                    //             animation.Exit_Time = 100;
                    //         }
                    //     }
                    // } else {
                    //     if (!this.isNumber(animation.Transition_Duration) || animation.Transition_Duration === -1)
                    //         animation.Transition_Duration = 0.3;
                    //     // (animation.Transition_Duration = animationDuration * 0.3).toFixed(3);
                    //     if (!this.isNumber(animation.Exit_Time) || animation.Exit_Time === -1) {
                    //         // animation.Exit_Time = 70;
                    //         animation.Exit_Time = Number(
                    //             (((animationDuration - animation.Transition_Duration) / animationDuration) * 100).toFixed(3)
                    //         );

                    //         if (animations.length == index + 1) {
                    //             animation.Exit_Time = 100;
                    //         }
                    //     }
                    //     if (!this.isNumber(animation.Transition_Offset) || animation.Transition_Offset === -1)
                    //         animation.Transition_Offset = 0;
                    // }

                    if (!this.isNumber(animation.Transition_Duration) || animation.Transition_Duration === -1) {
                        animation.Transition_Duration = 0.3;
                    }

                    if (animation.isFingerspell) {
                        if (animation.Transition_Duration !== 0.4) {
                            animation.Transition_Duration = 0.4;
                        }
                        if (animations[index + 1]) {
                            if (!animations[index + 1].isFingerspell) {
                                animation.Transition_Duration = 0.3;
                            }
                        }
                    }
                    // (animation.Transition_Duration = animationDuration * 0.3).toFixed(3);
                    // if (!this.isNumber(animation.Exit_Time) || animation.Exit_Time === -1) {
                    //     // animation.Exit_Time = 70;
                    //     animation.Exit_Time = Number(
                    //         (((animationDuration - animation.Transition_Duration) / animationDuration) * 100).toFixed(3)
                    //     );

                    //     if (animations.length == index + 1) {
                    //         animation.Exit_Time = 100;
                    //     }
                    // }

                    // 230822 CMS에 입력된 Exit_Time 이 있다면 적용 ( version 0.3 )
                    // 계산된 Exit_Time 사용하지 않을 시 지화 손 튕기는 현상 발생
                    if (!animation.Exit_Time || animation.isFingerspell) {
                        animation.Exit_Time = Number(
                            (((animationDuration - animation.Transition_Duration) / animationDuration) * 100).toFixed(3)
                        );
                    }

                    if (animations.length == index + 1) {
                        animation.Exit_Time = 100;
                    }
                    if (!this.isNumber(animation.Transition_Offset) || animation.Transition_Offset === -1)
                        animation.Transition_Offset = 0;

                    // Timebase로 컨버팅된 데이터가 아닐 경우 모든 값을 Timebase로 재계산해준다.
                    // if (!this.isNumber(animation.trackStartTime) && !this.isNumber(animation.trackEndTime)) {
                    animation.speed = animation.Speed;
                    // if (animation.speed !== 1) {
                    //     animation.Transition_Duration = parseFloat(
                    //         (animation.Transition_Duration / animation.speed).toFixed(3)
                    //     );
                    // }
                    animation.blendingDuration = animation.Transition_Duration;

                    animation.cutStartTime = (animation.Transition_Offset / 100) * animationDuration;

                    animation.cutEndTime = (animation.Exit_Time / 100) * animationDuration + animation.blendingDuration;

                    if (animation.hasOwnProperty("_4_finger")) {
                        animation.cutEndTime = animationDuration;
                    }
                    // if (animation.attribute == 2) {
                    //     animation.cutEndTime = animation.cutEndTime + animation.blendingDuration;
                    // }

                    if (index == 0) {
                        animation.trackStartTime = 0;
                        blendings.push({
                            fadeOutIndex: null,
                            fadeInIndex: 0,
                            trackStartTime: animation.trackStartTime,
                            trackEndTime: animation.trackStartTime + 0.3,
                            type: "linear",
                        });
                    } else {
                        animation.trackStartTime =
                            animations[index - 1].trackEndTime -
                            animations[index - 1].blendingDuration +
                            animations[index - 1].addedDuration;
                    }

                    animation.trackEndTime = animation.trackStartTime + (animation.cutEndTime - animation.cutStartTime);

                    animation.cutStartTime = parseFloat(animation.cutStartTime.toFixed(3));
                    animation.cutEndTime = parseFloat(animation.cutEndTime.toFixed(3));
                    animation.trackStartTime = parseFloat(animation.trackStartTime.toFixed(3));
                    animation.trackEndTime = parseFloat(animation.trackEndTime.toFixed(3));
                    animation.parentStartTime = parseFloat((animation.trackStartTime - animation.cutStartTime).toFixed(3));
                    animation.parentEndTime = parseFloat((animation.parentStartTime + animationDuration).toFixed(3));

                    if (animation.cutEndTime > parseFloat(animationDuration.toFixed(3))) {
                        animation.addedDuration = parseFloat((animation.cutEndTime - animationDuration).toFixed(3));
                        animation.cutEndTime = parseFloat(animationDuration.toFixed(3));
                        animation.trackEndTime = parseFloat(animation.parentEndTime.toFixed(3));
                    } else {
                        animation.addedDuration = 0;
                    }

                    let blendingBlock = {
                        fadeOutIndex: index,
                        fadeInIndex: index + 1,
                        trackStartTime: animation.trackEndTime - animation.blendingDuration + animation.addedDuration,
                        trackEndTime: animation.trackEndTime + animation.addedDuration,
                        type: "linear",
                    };

                    blendingBlock.trackStartTime = parseFloat(blendingBlock.trackStartTime.toFixed(3));
                    blendingBlock.trackEndTime = parseFloat(blendingBlock.trackEndTime.toFixed(3));

                    if (index == animations.length - 1) {
                        blendingBlock.fadeInIndex = null;
                        blendingBlock.trackEndTime = parseFloat(animation.trackEndTime.toFixed(3));
                        blendingBlock.trackStartTime = animation.trackEndTime - 0.3;
                    }

                    blendings.push(blendingBlock);

                    if (animation.dynamic) {
                        this.dynamic = true;
                        this.timeGap += animation.cutEndTime - animation.blendingDuration;
                    }
                    // } else {
                    // if (index !== 0) {
                    //     if (
                    //         animation.trackStartTime !=
                    //         animations[index - 1].trackEndTime -
                    //             animations[index - 1].blendingDuration +
                    //             animations[index - 1].addedDuration
                    //     ) {
                    //         this.timeGap +=
                    //             animations[index - 1].trackEndTime -
                    //             animations[index - 1].blendingDuration +
                    //             animations[index - 1].addedDuration -
                    //             animation.trackStartTime;

                    //         animation.parentStartTime += this.timeGap;
                    //         animation.parentEndTime += this.timeGap;
                    //         animation.trackStartTime += this.timeGap;
                    //         animation.trackEndTime += this.timeGap;
                    //     }
                    // } else {
                    //     this.timeGap = 0;
                    // }

                    // if (this.dynamic) {
                    //     animation.parentStartTime += this.timeGap - 1;
                    //     animation.parentEndTime += this.timeGap - 1;
                    //     animation.trackStartTime += this.timeGap - 1;
                    //     animation.trackEndTime += this.timeGap - 1;
                    // }

                    // if (index == 0) {
                    //     blendings.push({
                    //         fadeOutIndex: null,
                    //         fadeInIndex: 0,
                    //         trackStartTime: animation.trackStartTime,
                    //         trackEndTime: animation.trackStartTime + 0.3,
                    //         type: "linear",
                    //     });
                    // }

                    // if (animation.addedDuration === undefined) {
                    //     animation.addedDuration = 0;
                    // }

                    // let blendingBlock = {
                    //     fadeOutIndex: index,
                    //     fadeInIndex: index + 1,
                    //     trackStartTime: animation.trackEndTime - animation.blendingDuration + animation.addedDuration,
                    //     trackEndTime: animation.trackEndTime + animation.addedDuration,
                    //     type: "linear",
                    // };

                    // blendingBlock.trackStartTime = parseFloat(blendingBlock.trackStartTime.toFixed(3));
                    // blendingBlock.trackEndTime = parseFloat(blendingBlock.trackEndTime.toFixed(3));

                    // if (index == animations.length - 1) {
                    //     blendingBlock.fadeInIndex = null;
                    //     blendingBlock.trackEndTime = parseFloat(animation.trackEndTime.toFixed(3));
                    //     blendingBlock.trackStartTime = animation.trackEndTime - 0.3;
                    // }

                    // blendings.push(blendingBlock);
                    // }
                }.bind(this)
            )
        );

        this.convertedAnimations = animations;
        this.convertedBlendings = blendings;
    }

    async subClipTimes(clips, index, startTime, endTime) {
        let startIndex = 0;
        let endIndex = 0;

        for (let i = 0; i < clips[index].tracks[0].times.length; i++) {
            if (clips[index].tracks[0].times[i] - startTime < 0.03333333333333333) {
                startIndex = i;
            }
            if (clips[index].tracks[0].times[i] - endTime < 0.03333333333333333) {
                endIndex = i + 1;
            }
        }

        _.map(clips[index].tracks, function (track) {
            if (track.times.length >= endIndex) {
                track.times = track.times.slice(startIndex, endIndex);
            }

            if (track.type == "Quaternion") {
                track.values = track.values.slice(startIndex * 4, endIndex * 4);
            } else if (track.type == "Number") {
                if (track.values.length >= endIndex) {
                    track.values = track.values.slice(startIndex, endIndex);
                }
            } else {
                track.values = track.values.slice(startIndex * 3, endIndex * 3);
            }
        });
    }

    async addClipTimes(clips, index, blendingDuration) {
        let addedFrame = blendingDuration / 0.03333333333333333 + 1;
        addedFrame = parseInt(addedFrame);

        _.map(clips[index].tracks, function (track) {
            for (let i = 0; i < addedFrame; i++) {
                track.times.push(track.times[track.times.length - 1] + 0.03333333333333333);

                if (track.type == "Quaternion") {
                    for (let j = 0; j < 4; j++) {
                        track.values.push(track.values[track.values.length - 4]);
                    }
                } else if (track.type == "Number") {
                    track.values.push(track.values[track.values.length - 1]);
                } else {
                    for (let j = 0; j < 3; j++) {
                        track.values.push(track.values[track.values.length - 3]);
                    }
                }
            }
        });
    }

    async setDynamicWord(animations, files, index, additiveAnimationsFile) {
        // 19:date, 67:people, Hours:73, Time: 48
        if (animations[index].attribute === 19 && animations[index].attributeSubIdx === 2) {
            let copyPoint = 0.55;
            animations[index - 1].Exit_Time = copyPoint * 100;

            _.map(
                files[index - 1].tracks,
                async function (track, index) {
                    if (track.name.search("Left") > -1) {
                        if (track.type === "Vector") {
                            let lastTime = Math.ceil((track.values.length / 3) * copyPoint);

                            this.variableTrackSources[track.name] = [
                                track.values[lastTime * 3 - 3],
                                track.values[lastTime * 3 - 2],
                                track.values[lastTime * 3 - 1],
                            ];
                        } else if (track.type === "Quaternion") {
                            let lastTime = Math.ceil((track.quaternionValues.length / 4) * copyPoint);

                            this.variableTrackSources[track.name] = [
                                track.quaternionValues[lastTime * 4 - 4],
                                track.quaternionValues[lastTime * 4 - 3],
                                track.quaternionValues[lastTime * 4 - 2],
                                track.quaternionValues[lastTime * 4 - 1],
                            ];
                        }
                    }
                }.bind(this)
            );
            let addClipTimeSec = 0.5;
            _.map(
                files[index].tracks,
                async function (track) {
                    if (addClipTimeSec > 0) {
                        let addTimes = track.times[track.times.length - 1] + addClipTimeSec;
                        if (track.type !== "Number") track.times.push(addTimes);
                        if (track.type === "Vector") {
                            track.values.push(
                                ...[
                                    track.values[track.values.length - 3],
                                    track.values[track.values.length - 2],
                                    track.values[track.values.length - 1],
                                ]
                            );
                        } else if (track.type === "Quaternion") {
                            track.quaternionValues.push(
                                ...[
                                    track.quaternionValues[track.quaternionValues.length - 4],
                                    track.quaternionValues[track.quaternionValues.length - 3],
                                    track.quaternionValues[track.quaternionValues.length - 2],
                                    track.quaternionValues[track.quaternionValues.length - 1],
                                ]
                            );
                        }
                    }
                    if (track.name.search("Left") > -1) {
                        if (track.type === "Vector") {
                            _.map(track.values, (value, idx) => {
                                value = this.variableTrackSources[track.name][idx % 3];
                            });
                        } else if (track.type === "Quaternion") {
                            _.map(track.quaternionValues, (value, idx) => {
                                value = this.variableTrackSources[track.name][idx % 4];
                                track.values[idx] = this.variableTrackSources[track.name][idx % 4];
                            });
                        }
                    }
                }.bind(this)
            );
        } else if (animations[index] && animations[index].attribute === 67) {
            // let copyPoint = 0.7;
            let copyPoint = 1;
            animations[index - 1].Exit_Time = copyPoint * 100;
            _.map(
                files[index - 1].tracks,
                async function (track, index) {
                    if (track.name.search("Right") > -1) {
                        if (track.type === "Vector") {
                            let lastTime = Math.ceil((track.values.length / 3) * copyPoint);

                            this.variableTrackSources[track.name] = [
                                track.values[lastTime * 3 - 3],
                                track.values[lastTime * 3 - 2],
                                track.values[lastTime * 3 - 1],
                            ];
                        } else if (track.type === "Quaternion") {
                            let lastTime = Math.ceil((track.quaternionValues.length / 4) * copyPoint);

                            this.variableTrackSources[track.name] = [
                                track.quaternionValues[lastTime * 4 - 4],
                                track.quaternionValues[lastTime * 4 - 3],
                                track.quaternionValues[lastTime * 4 - 2],
                                track.quaternionValues[lastTime * 4 - 1],
                            ];
                        }
                    }
                }.bind(this)
            );

            _.map(
                files[index].tracks,
                async function (track) {
                    if (track.name.search("Right") > -1) {
                        if (track.type === "Vector") {
                            _.map(track.values, (value, idx) => {
                                value = this.variableTrackSources[track.name][idx % 3];
                            });
                        } else if (track.type === "Quaternion") {
                            _.map(track.quaternionValues, (value, idx) => {
                                value = this.variableTrackSources[track.name][idx % 4];
                                track.values[idx] = this.variableTrackSources[track.name][idx % 4];
                            });
                        }
                    }
                }.bind(this)
            );
        } else if (animations[index].attribute === 73 && animations[index].attributeSubIdx === 2) {
            if (animations[index - 1].attribute === 73 && animations[index - 1].attributeSubIdx === 1) {
                let copyPoint = 0.7;
                animations[index - 1].Exit_Time = copyPoint * 100;

                _.map(
                    files[index - 1].tracks,
                    async function (track, index) {
                        if (track.name.search("Left") > -1) {
                            if (track.type === "Vector") {
                                let lastTime = Math.ceil((track.values.length / 3) * copyPoint);

                                this.variableTrackSources[track.name] = [
                                    track.values[lastTime * 3 - 3],
                                    track.values[lastTime * 3 - 2],
                                    track.values[lastTime * 3 - 1],
                                ];
                            } else if (track.type === "Quaternion") {
                                let lastTime = Math.ceil((track.quaternionValues.length / 4) * copyPoint);

                                this.variableTrackSources[track.name] = [
                                    track.quaternionValues[lastTime * 4 - 4],
                                    track.quaternionValues[lastTime * 4 - 3],
                                    track.quaternionValues[lastTime * 4 - 2],
                                    track.quaternionValues[lastTime * 4 - 1],
                                ];
                            }
                        }
                    }.bind(this)
                );
                _.map(
                    files[index].tracks,
                    async function (track) {
                        if (track.name.search("Left") > -1) {
                            if (track.type === "Vector") {
                                _.map(track.values, (value, idx) => {
                                    value = this.variableTrackSources[track.name][idx % 3];
                                });
                            } else if (track.type === "Quaternion") {
                                _.map(track.quaternionValues, (value, idx) => {
                                    value = this.variableTrackSources[track.name][idx % 4];
                                    track.values[idx] = this.variableTrackSources[track.name][idx % 4];
                                });
                            }
                        }
                    }.bind(this)
                );
            }
        } else if (animations[index].attribute === 48) {
            let addClipTimeSec = 0.5;
            if (animations[index].attributeSubIdx === 2) {
                _.map(
                    files[index].tracks,
                    async function (track) {
                        if (additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]) {
                            if (track.type === "Vector") {
                                _.map(track.values, (value, idx) => {
                                    if (
                                        additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values[idx] !==
                                        undefined
                                    ) {
                                        value = additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values[idx];
                                    } else {
                                        let lastValues = [
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values[
                                                additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values
                                                    .length - 3
                                            ],
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values[
                                                additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values
                                                    .length - 2
                                            ],
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values[
                                                additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].values
                                                    .length - 1
                                            ],
                                        ];
                                        value = lastValues[idx % 3];
                                    }
                                });
                            } else if (track.type === "Quaternion") {
                                _.map(track.quaternionValues, (value, idx) => {
                                    if (
                                        additiveAnimationsFile[animations[index].addtiveIdx].data[track.name].quaternionValues[
                                            idx
                                        ] !== undefined
                                    ) {
                                        value =
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                .quaternionValues[idx];
                                        track.values[idx] =
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[
                                                track.name
                                            ].quaternionValues[idx];
                                    } else {
                                        let lastValues = [
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                .quaternionValues[
                                                additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                    .quaternionValues.length - 4
                                            ],
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                .quaternionValues[
                                                additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                    .quaternionValues.length - 3
                                            ],
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                .quaternionValues[
                                                additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                    .quaternionValues.length - 2
                                            ],
                                            additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                .quaternionValues[
                                                additiveAnimationsFile[animations[index].addtiveIdx].data[track.name]
                                                    .quaternionValues.length - 1
                                            ],
                                        ];

                                        value = lastValues[idx % 4];
                                        track.values[idx] = lastValues[idx % 4];
                                    }
                                });
                            }
                        }

                        if (addClipTimeSec > 0) {
                            let addTimes = track.times[track.times.length - 1] + addClipTimeSec;
                            if (track.type !== "Number") track.times.push(addTimes);
                            if (track.type === "Vector") {
                                track.values.push(
                                    ...[
                                        track.values[track.values.length - 3],
                                        track.values[track.values.length - 2],
                                        track.values[track.values.length - 1],
                                    ]
                                );
                            } else if (track.type === "Quaternion") {
                                track.quaternionValues.push(
                                    ...[
                                        track.quaternionValues[track.quaternionValues.length - 4],
                                        track.quaternionValues[track.quaternionValues.length - 3],
                                        track.quaternionValues[track.quaternionValues.length - 2],
                                        track.quaternionValues[track.quaternionValues.length - 1],
                                    ]
                                );
                            }
                        }
                    }.bind(this)
                );
            }
            // 1시일때
            // else if (animations[index].attributeSubIdx === 0) {
            //     _.map(
            //         files[index].tracks,
            //         async function (track) {
            //             if (addClipTimeSec > 0) {
            //                 let addTimes = track.times[track.times.length - 1] + addClipTimeSec;
            //                 if (track.type !== "Number") track.times.push(addTimes);
            //                 if (track.type === "Vector") {
            //                     track.values.push(
            //                         ...[
            //                             track.values[track.values.length - 3],
            //                             track.values[track.values.length - 2],
            //                             track.values[track.values.length - 1],
            //                         ]
            //                     );
            //                 } else if (track.type === "Quaternion") {
            //                     track.quaternionValues.push(
            //                         ...[
            //                             track.quaternionValues[track.quaternionValues.length - 4],
            //                             track.quaternionValues[track.quaternionValues.length - 3],
            //                             track.quaternionValues[track.quaternionValues.length - 2],
            //                             track.quaternionValues[track.quaternionValues.length - 1],
            //                         ]
            //                     );
            //                 }
            //             }
            //         }.bind(this)
            //     );
            // }
        }
    }

    /**
     *  전달된 Parameter가 숫자인지 아닌지 판단
     */
    isNumber(n) {
        return typeof n === "number" || n instanceof Number;
    }
}

export { ProtocolConverter };
