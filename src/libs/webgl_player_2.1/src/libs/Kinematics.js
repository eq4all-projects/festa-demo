import * as _ from "lodash";

import { IKSolver, Solver } from "./iks/solvers/IKSolver";
import { Matrix4, Vector3, Quaternion, Euler } from "three";
import TWEEN from "@tweenjs/tween.js";

/**
 *  IK 클래스
 */
class Kinematics {
    constructor(bones, boneArray, meshArray, eyeIndexes, system) {
        // IKs
        this.bones = bones;
        this.boneArray = boneArray;
        this.meshArray = meshArray;
        this.eyeIndexes = eyeIndexes;
        this.methods = {
            NONE: 0,
            FORWARD: 1,
            CCD: 2,
            FABRIK: 3,
            HYBRID: 4,
        };
        this.solvers = [];
        this.states = [];
        this.rightHandSolverIndex = null;
        this.rightLegSolverIndex = null;
        this.rightToesSolverIndex = null;
        this.leftLegSolverIndex = null;
        this.leftToesSolverIndex = null;
        this.targets = [];
        this.ikBonesRelationships = [];

        // Target Position
        this.rightHandTargetPosition = new Vector3();
        this.rightHandCenterVector = new Vector3(0, 140, 38);

        // Animation
        this.playedAnimations = {};

        // Tween
        this.tween = TWEEN;
        this.tweens = {};
        this.idleIndex = 0;

        // Frame
        this.interpolationIncrease = true;
        this.interpolationTimer = 0;
        this.interpolationDuration = 0.2;
        this.prevCurrentTime = -1;
        this.closeEye = false;
        this.openEye = false;
        this.alreayClosedEye = false;
        this.closeEyeFrame = 0;
    }

    /**
     *  오른손 IK를 위한 값들을 설정한다.
     */
    async rightHandConstraints() {
        this.solvers.push(new IKSolver());
        this.rightHandSolverIndex = this.solvers.length - 1;

        let state = {
            sizing: {},
            method: this.methods.CUSTOM,
            iterations_ccd: 10,
            iterations_fabrik: 1,
            iterations_hybrid: [1, 1],
            constrained: true,
            constraints: {},
        };

        // let upperChestIndex = _.findIndex(this.bones, function (bone) {
        //     return bone.name == "Upper_Chest";
        // });
        let rightShoulderIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightShoulder";
        });
        let rightArmIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightArm";
        });
        let rightForeArmIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightForeArm";
        });
        let rightHandIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightHand";
        });

        let rightHandConstraint = {
            effector: rightHandIndex,
            links: [
                { id: rightForeArmIndex },
                { id: rightArmIndex },
                { id: rightShoulderIndex, rotationMin: new Vector3(-Math.PI, -Math.PI / 2, -Math.PI) },
                // {
                //     id: upperChestIndex,
                //     rotationMin: new Vector3(-Math.PI / 100, -Math.PI / 100, -Math.PI / 100),
                //     rotationMax: new Vector3(Math.PI / 100, Math.PI / 100, Math.PI / 100),
                // },
            ],
            minAngle: -1.0,
            maxAngle: 1.0,
        };

        let indexes = [rightShoulderIndex, rightArmIndex, rightForeArmIndex, rightHandIndex];

        state.constraints = rightHandConstraint;
        state.constraints.indexes = indexes;

        this.states.push(state);
        this.targets.push(new Vector3(0, 140, 38));
        this.ikBonesRelationships.push([
            "Bip001",
            "Hips",
            "Spine",
            "Chest",
            "Upper_Chest",
            "RightShoulder",
            "RightArm",
            "RightForeArm",
            "RightHand",
        ]);
    }

    /**
     *  오른쪽 다리 IK를 위한 값들을 설정한다.
     */
    async rightLegConstraints(characterName) {
        this.solvers.push(new IKSolver());
        this.rightLegSolverIndex = this.solvers.length - 1;

        let state = {
            sizing: {},
            method: this.methods.CCD,
            iterations_ccd: 5,
            iterations_fabrik: 1,
            iterations_hybrid: [1, 1],
            constrained: true,
            constraints: {},
        };

        let rightUpLegIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightUpLeg";
        });
        let rightLegIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightLeg";
        });
        let rightFootIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightFoot";
        });

        let rightLegConstraint = {
            effector: rightFootIndex,
            links: [{ id: rightLegIndex }, { id: rightUpLegIndex }],
            minAngle: 0,
            maxAngle: 1.0,
        };

        let indexes = [rightUpLegIndex, rightLegIndex, rightFootIndex];
        let chainProxy = [];
        let boneLengths = [];
        let prevWorldVector = new Vector3();
        let fixedBaseLocation = new Vector3();
        let tmpVector = new Vector3();
        let targetPosition = new Vector3();

        state.constraints = rightLegConstraint;

        for (let i = 0; i < indexes.length; i++) {
            tmpVector.setFromMatrixPosition(this.bones[indexes[i]].matrixWorld);
            chainProxy.push(tmpVector.clone());

            if (i == 0) {
                fixedBaseLocation.copy(tmpVector.clone());
            } else {
                let distance = tmpVector.distanceTo(prevWorldVector);
                boneLengths.push(distance);
            }

            prevWorldVector.copy(tmpVector);
        }

        boneLengths[boneLengths.length - 1] = 0;

        state.constraints.fixedBaseLocation = fixedBaseLocation;
        state.constraints.boneLengths = boneLengths;
        state.constraints.chainProxy = chainProxy;
        state.constraints.indexes = indexes;

        this.states.push(state);

        if (characterName == "LGE_Reah") {
            targetPosition = new Vector3(-4, 0, 0);
        } else {
            targetPosition = new Vector3(-10, 0, -10);
        }
        this.targets.push(targetPosition);
    }

    /**
     *  오른쪽 발 IK를 위한 값들을 설정한다.
     */
    async rightToesConstraints(characterName) {
        this.solvers.push(new IKSolver());
        this.rightToesSolverIndex = this.solvers.length - 1;

        let state = {
            sizing: {},
            method: this.methods.CCD,
            iterations_ccd: 5,
            iterations_fabrik: 1,
            iterations_hybrid: [1, 1],
            constrained: true,
            constraints: {},
        };

        let rightFootIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightFoot";
        });
        let rightToesIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "RightToes";
        });

        let rightToesConstraint = {
            effector: rightToesIndex,
            links: [{ id: rightFootIndex }],
            minAngle: 0,
            maxAngle: 1.0,
        };

        let indexes = [rightFootIndex, rightToesIndex];
        let chainProxy = [];
        let boneLengths = [];
        let prevWorldVector = new Vector3();
        let fixedBaseLocation = new Vector3();
        let tmpVector = new Vector3();
        let targetPosition = new Vector3();

        state.constraints = rightToesConstraint;

        for (let i = 0; i < indexes.length; i++) {
            tmpVector.setFromMatrixPosition(this.bones[indexes[i]].matrixWorld);
            chainProxy.push(tmpVector.clone());

            if (i == 0) {
                fixedBaseLocation.copy(tmpVector.clone());
            } else {
                let distance = tmpVector.distanceTo(prevWorldVector);
                boneLengths.push(distance);
            }

            prevWorldVector.copy(tmpVector);
        }

        boneLengths[boneLengths.length - 1] = 0;

        state.constraints.fixedBaseLocation = fixedBaseLocation;
        state.constraints.boneLengths = boneLengths;
        state.constraints.chainProxy = chainProxy;
        state.constraints.indexes = indexes;

        this.states.push(state);

        if (characterName == "LGE_Reah") {
            targetPosition = new Vector3(-4, -10, 10);
        } else {
            targetPosition = new Vector3(-10, -5, 10);
        }
        this.targets.push(targetPosition);
    }

    /**
     *  왼쪽 다리 IK를 위한 값들을 설정한다.
     */
    async leftLegConstraints(characterName) {
        this.solvers.push(new IKSolver());
        this.leftLegSolverIndex = this.solvers.length - 1;

        let state = {
            sizing: {},
            method: this.methods.CCD,
            iterations_ccd: 5,
            iterations_fabrik: 1,
            iterations_hybrid: [1, 1],
            constrained: true,
            constraints: {},
        };

        let leftUpLegIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "LeftUpLeg";
        });
        let leftLegIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "LeftLeg";
        });
        let leftFootIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "LeftFoot";
        });

        let leftLegConstraint = {
            effector: leftFootIndex,
            links: [{ id: leftLegIndex }, { id: leftUpLegIndex }],
            minAngle: 0,
            maxAngle: 1.0,
        };

        let indexes = [leftUpLegIndex, leftLegIndex, leftFootIndex];
        let chainProxy = [];
        let boneLengths = [];
        let prevWorldVector = new Vector3();
        let fixedBaseLocation = new Vector3();
        let tmpVector = new Vector3();
        let targetPosition = new Vector3();

        state.constraints = leftLegConstraint;

        for (let i = 0; i < indexes.length; i++) {
            tmpVector.setFromMatrixPosition(this.bones[indexes[i]].matrixWorld);
            chainProxy.push(tmpVector.clone());

            if (i == 0) {
                fixedBaseLocation.copy(tmpVector.clone());
            } else {
                let distance = tmpVector.distanceTo(prevWorldVector);
                boneLengths.push(distance);
            }

            prevWorldVector.copy(tmpVector);
        }

        boneLengths[boneLengths.length - 1] = 0;

        state.constraints.fixedBaseLocation = fixedBaseLocation;
        state.constraints.boneLengths = boneLengths;
        state.constraints.chainProxy = chainProxy;
        state.constraints.indexes = indexes;

        this.states.push(state);

        if (characterName == "LGE_Reah") {
            targetPosition = new Vector3(4, 0, 0);
        } else {
            targetPosition = new Vector3(10, 0, -10);
        }
        this.targets.push(targetPosition);
    }

    /**
     *  왼쪽 발 IK를 위한 값들을 설정한다.
     */
    async leftToesConstraints(characterName) {
        this.solvers.push(new IKSolver());
        this.leftToesSolverIndex = this.solvers.length - 1;

        let state = {
            sizing: {},
            method: this.methods.CCD,
            iterations_ccd: 5,
            iterations_fabrik: 1,
            iterations_hybrid: [1, 1],
            constrained: true,
            constraints: {},
        };

        let leftFootIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "LeftFoot";
        });
        let leftToesIndex = _.findIndex(this.bones, function (bone) {
            return bone.name == "LeftToes";
        });

        let leftToesConstraint = {
            effector: leftToesIndex,
            links: [{ id: leftFootIndex }],
            minAngle: 0,
            maxAngle: 1.0,
        };

        let indexes = [leftFootIndex, leftToesIndex];
        let chainProxy = [];
        let boneLengths = [];
        let prevWorldVector = new Vector3();
        let fixedBaseLocation = new Vector3();
        let tmpVector = new Vector3();
        let targetPosition = new Vector3();

        state.constraints = leftToesConstraint;

        for (let i = 0; i < indexes.length; i++) {
            tmpVector.setFromMatrixPosition(this.bones[indexes[i]].matrixWorld);
            chainProxy.push(tmpVector.clone());

            if (i == 0) {
                fixedBaseLocation.copy(tmpVector.clone());
            } else {
                let distance = tmpVector.distanceTo(prevWorldVector);
                boneLengths.push(distance);
            }

            prevWorldVector.copy(tmpVector);
        }

        boneLengths[boneLengths.length - 1] = 0;

        state.constraints.fixedBaseLocation = fixedBaseLocation;
        state.constraints.boneLengths = boneLengths;
        state.constraints.chainProxy = chainProxy;
        state.constraints.indexes = indexes;

        this.states.push(state);

        if (characterName == "LGE_Reah") {
            targetPosition = new Vector3(4, -10, 10);
        } else {
            targetPosition = new Vector3(10, -5, 10);
        }
        this.targets.push(targetPosition);
    }

    /**
     *  FK 계산
     */
    updateBonesForward(skl) {
        time += 0.01;
        for (let i = 0; i < skl.bones.length; i++) {
            skl.bones[i].rotation.z = (Math.sin(time + i) * 2) / skl.bones.length;
            skl.bones[i].rotation.y = (Math.sin(time + i) * 2) / skl.bones.length;
        }
    }

    /**
     *  IK 계산을 위한 설정값 확인 및 해당 값들을 CCD Solve, FABRIK Solve에 파라미터로 전달
     */
    updateBonesInverse(skl, slv, targetPoint, state, isFingerSpell, weight, isBlending) {
        let chain = skl;
        let constraints = state.constraints;

        let isConstrained = state.constrained;
        switch (state.method) {
            case this.methods.HYBRID:
                const i1 = state.iterations_hybrid[0];
                const i2 = state.iterations_hybrid[1];
                slv.solve(Solver.FABRIK, chain, targetPoint, i1, constraints, false);
                slv.solve(Solver.CCD, chain, targetPoint, i2, constraints, isConstrained, isFingerSpell, weight, isBlending);
                break;
            case this.methods.CCD:
                const iterations_ccd = state.iterations_ccd;
                slv.solve(
                    Solver.CCD,
                    chain,
                    targetPoint,
                    iterations_ccd,
                    constraints,
                    isConstrained,
                    isFingerSpell,
                    weight,
                    isBlending
                );
                break;
            case this.methods.FABRIK:
                const iterations_fabrik = state.iterations_fabrik;
                slv.solve(
                    Solver.FABRIK,
                    chain,
                    targetPoint,
                    iterations_fabrik,
                    constraints,
                    isConstrained,
                    isFingerSpell,
                    weight,
                    isBlending
                );
                break;
            case this.methods.CUSTOM:
                const iterations_custom = state.iterations_ccd;
                slv.solve(
                    Solver.CUSTOM,
                    chain,
                    targetPoint,
                    iterations_custom,
                    constraints,
                    isConstrained,
                    isFingerSpell,
                    weight,
                    isBlending
                );
                break;
        }
    }

    /**
     *  부위별 구분 및 파라미터 전달
     *  WebGLPlayer.js의 render 함수에서 호출
     */
    solve(part, isFingerspell, weight, isBlending) {
        if (part === "rightHand") {
            this.updateBonesInverse(
                this.bones,
                this.solvers[this.rightHandSolverIndex],
                this.targets[this.rightHandSolverIndex],
                this.states[this.rightHandSolverIndex],
                isFingerspell,
                weight,
                isBlending
            );
        } else if (part === "rightLeg") {
            this.updateBonesInverse(
                this.bones,
                this.solvers[this.rightLegSolverIndex],
                this.targets[this.rightLegSolverIndex],
                this.states[this.rightLegSolverIndex]
            );
        } else if (part === "rightToes") {
            this.updateBonesInverse(
                this.bones,
                this.solvers[this.rightToesSolverIndex],
                this.targets[this.rightToesSolverIndex],
                this.states[this.rightToesSolverIndex]
            );
        } else if (part === "leftLeg") {
            this.updateBonesInverse(
                this.bones,
                this.solvers[this.leftLegSolverIndex],
                this.targets[this.leftLegSolverIndex],
                this.states[this.leftLegSolverIndex]
            );
        } else if (part === "leftToes") {
            this.updateBonesInverse(
                this.bones,
                this.solvers[this.leftToesSolverIndex],
                this.targets[this.leftToesSolverIndex],
                this.states[this.leftToesSolverIndex]
            );
        }
    }

    /**
     *  현재 Play 중인 지화 애니메이션
     */
    async playedFingerspellAnimations(animation, index) {
        this.playedAnimations[index] = _.cloneDeep(animation);
    }

    /**
     *  현재 Play 중인 지화 애니메이션 리셋
     */
    async playedAnimationsReset() {
        this.playedAnimations = {};
    }

    /**
     *  지화 IK Control
     */
    async setRightHandIKPosition(index, weight, fadeContext, actions, devidedIndex, currentTime, animations) {
        let maxXLength = 25;
        let nextMaxXLength = 25;
        let currentTrack = { position: new Vector3(), quaternion: new Quaternion() };
        let nextTrack = { position: new Vector3(), quaternion: new Quaternion() };
        let currentPosition = {};
        let nextPosition = {};

        if (this.interpolationTimer >= this.interpolationDuration) {
            this.interpolationIncrease = false;
        } else if (this.interpolationTimer <= -this.interpolationDuration) {
            this.interpolationIncrease = true;
        }

        if (index % 5 === 0) {
            if (this.alreayClosedEye === false) {
                this.alreayClosedEye = true;
                this.closeEye = true;
                this.openEye = false;
            }

            if (this.openEye) {
                if (this.closeEyeFrame > 0) {
                    this.closeEyeFrame -= 1 / 5;
                }

                if (this.closeEyeFrame <= 0) {
                    this.closeEyeFrame = 0;
                    this.closeEye = false;
                    this.openEye = false;
                }

                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["leftEyeCloseIndex"]] = this.closeEyeFrame;
                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["rightEyeCloseIndex"]] = this.closeEyeFrame;
                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["rightEyeBrowLowerIndex"]] = this.closeEyeFrame;
                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["leftEyeBrowLowerIndex"]] = this.closeEyeFrame;
            }

            if (this.closeEye) {
                if (this.closeEyeFrame < 1) {
                    this.closeEyeFrame += 1 / 5;
                }

                if (this.closeEyeFrame >= 1) {
                    this.closeEyeFrame = 1;
                    this.closeEye = false;
                    this.openEye = true;
                }

                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["leftEyeCloseIndex"]] = this.closeEyeFrame;
                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["rightEyeCloseIndex"]] = this.closeEyeFrame;
                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["rightEyeBrowLowerIndex"]] = this.closeEyeFrame;
                this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["leftEyeBrowLowerIndex"]] = this.closeEyeFrame;
            }
        } else {
            this.alreayClosedEye = false;
            this.closeEyeFrame = 0;
            this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["leftEyeCloseIndex"]] = this.closeEyeFrame;
            this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["rightEyeCloseIndex"]] = this.closeEyeFrame;
            this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["rightEyeBrowLowerIndex"]] = this.closeEyeFrame;
            this.meshArray["Mesh_Face"].morphTargetInfluences[this.eyeIndexes["leftEyeBrowLowerIndex"]] = this.closeEyeFrame;
        }

        if (currentTime) {
            currentTrack = await this.getWorldPositionFromBufferCurretTime(
                "RightHand",
                this.ikBonesRelationships[this.rightHandSolverIndex],
                index,
                actions,
                devidedIndex,
                currentTime,
                animations,
                false
            );
        } else {
            currentTrack = await this.getWorldPositionFromBuffer(
                "RightHand",
                this.ikBonesRelationships[this.rightHandSolverIndex],
                index,
                actions,
                devidedIndex
            );
        }

        if (this.playedAnimations[index].totalWordLength >= 4) {
            maxXLength = 40;
        } else if (this.playedAnimations[index].totalWordLength <= 2) {
            maxXLength = 10;
        }

        let gap = maxXLength / this.playedAnimations[index].totalWordLength;
        let nextGap = null;

        currentPosition = {
            x: currentTrack.position.x + maxXLength / 2 - gap * this.playedAnimations[index].currentLetterIndex,
            y: currentTrack.position.y - this.interpolationTimer * 5,
            z: currentTrack.position.z + 3,
        };

        this.targets[this.rightHandSolverIndex].set(currentPosition.x, currentPosition.y, currentPosition.z);

        // 한글 지화 Play
        if (this.playedAnimations[index].attribute === "Korean" || this.playedAnimations[index].attribute === 2) {
            if (this.playedAnimations[index].fingerSpellPosition === "f2") {
                currentPosition.x = currentPosition.x - gap / 2;
            } else if (this.playedAnimations[index].fingerSpellPosition === "s1") {
                currentPosition.x = currentPosition.x - gap / 2;
            } else if (this.playedAnimations[index].fingerSpellPosition === "s2") {
                currentPosition.y = currentPosition.y - 7;
            } else if (this.playedAnimations[index].fingerSpellPosition === "t1") {
                currentPosition.y = currentPosition.y - 15;
                currentPosition.z = currentPosition.z - 5;
            } else if (this.playedAnimations[index].fingerSpellPosition === "t2") {
                currentPosition.x = currentPosition.x - gap / 2;
                currentPosition.y = currentPosition.y - 15;
                currentPosition.z = currentPosition.z - 5;
            }

            this.targets[this.rightHandSolverIndex].set(currentPosition.x, currentPosition.y, currentPosition.z);

            // "full" => Blending 중이 아닐 때
            if (fadeContext === "full") {
                if (!actions[index].paused) {
                    if (this.interpolationIncrease) {
                        this.interpolationTimer += 1 / 60;
                    } else {
                        this.interpolationTimer -= 1 / 60;
                    }
                }
            } else if (fadeContext === "fadeIn") {
                // 지화 시작 시 다른 애니메이션과 블렌딩되는 구간
                if (this.playedAnimations[index - 1] === undefined) {
                    currentTrack = await this.getWorldPositionFromBuffer(
                        "RightHand",
                        this.ikBonesRelationships[this.rightHandSolverIndex],
                        index,
                        actions,
                        devidedIndex
                    );

                    currentPosition = {
                        x: currentTrack.position.x + maxXLength / 2 - gap * this.playedAnimations[index].currentLetterIndex,
                        y: currentTrack.position.y - this.interpolationTimer * 5,
                        z: currentTrack.position.z + 3,
                    };

                    this.targets[this.rightHandSolverIndex].set(
                        currentTrack.position.x,
                        currentTrack.position.y,
                        currentTrack.position.z
                    );

                    this.targets[this.rightHandSolverIndex].lerp(
                        new Vector3(currentPosition.x, currentPosition.y, currentPosition.z),
                        weight
                    );
                }
            } else if (fadeContext === "fadeOut") {
                // 지화 완료 시 다른 애니메이션과 블렌딩되는 구간
                if (this.playedAnimations[index + 1] === undefined) {
                    if (currentTime) {
                        currentTrack = await this.getWorldPositionFromBufferCurretTime(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index,
                            actions,
                            devidedIndex,
                            currentTime,
                            animations,
                            true
                        );
                    } else {
                        currentTrack = await this.getWorldPositionFromBuffer(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index,
                            actions,
                            devidedIndex
                        );
                    }

                    currentPosition = {
                        x: currentTrack.position.x + maxXLength / 2 - gap * this.playedAnimations[index].currentLetterIndex,
                        y: currentTrack.position.y,
                        z: currentTrack.position.z + 3,
                    };

                    this.targets[this.rightHandSolverIndex].lerp(
                        new Vector3(currentPosition.x, currentPosition.y, currentPosition.z),
                        1 - weight
                    );
                }
                // 지화끼리 블렌딩되는 구간
                else {
                    if (this.interpolationIncrease) {
                        this.interpolationTimer += 1 / 60;
                    } else {
                        this.interpolationTimer -= 1 / 60;
                    }

                    if (this.playedAnimations[index + 1].totalWordLength >= 4) {
                        nextMaxXLength = 40;
                    } else if (this.playedAnimations[index + 1].totalWordLength <= 2) {
                        nextMaxXLength = 10;
                    }

                    nextGap = nextMaxXLength / this.playedAnimations[index + 1].totalWordLength;

                    if (currentTime) {
                        nextTrack = await this.getWorldPositionFromBufferCurretTime(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index,
                            actions,
                            devidedIndex,
                            currentTime,
                            animations,
                            true
                        );
                    } else {
                        nextTrack = await this.getWorldPositionFromBuffer(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index + 1,
                            actions,
                            devidedIndex
                        );
                    }

                    nextPosition = {
                        x:
                            nextTrack.position.x +
                            nextMaxXLength / 2 -
                            nextGap * this.playedAnimations[index + 1].currentLetterIndex,
                        y: nextTrack.position.y - this.interpolationTimer * 5,
                        z: nextTrack.position.z + 3,
                    };

                    if (this.playedAnimations[index + 1].fingerSpellPosition === "f2") {
                        nextPosition.x = nextPosition.x - nextGap / 2;
                    } else if (this.playedAnimations[index + 1].fingerSpellPosition === "s1") {
                        nextPosition.x = nextPosition.x - nextGap / 2;
                    } else if (this.playedAnimations[index + 1].fingerSpellPosition === "s2") {
                        nextPosition.y = nextPosition.y - 7;
                    } else if (this.playedAnimations[index + 1].fingerSpellPosition === "t1") {
                        nextPosition.y = nextPosition.y - 15;
                        nextPosition.z = nextPosition.z - 5;
                    } else if (this.playedAnimations[index + 1].fingerSpellPosition === "t2") {
                        nextPosition.x = nextPosition.x - nextGap / 2;
                        nextPosition.y = nextPosition.y - 15;
                        nextPosition.z = nextPosition.z - 5;
                    }

                    this.targets[this.rightHandSolverIndex].lerp(
                        new Vector3(nextPosition.x, nextPosition.y, nextPosition.z),
                        1 - weight
                    );
                }
            }
        } else if (
            this.playedAnimations[index].attribute == "English" ||
            this.playedAnimations[index].attribute === 3 ||
            this.playedAnimations[index].attribute === 4 ||
            this.playedAnimations[index].attribute === 5 ||
            this.playedAnimations[index].attribute === 6
        ) {
            if (fadeContext === "full") {
                if (!actions[index].paused) {
                    if (this.interpolationIncrease) {
                        this.interpolationTimer += 1 / 60;
                    } else {
                        this.interpolationTimer -= 1 / 60;
                    }
                }
            } else if (fadeContext === "fadeIn") {
                // 지화 시작 시 다른 애니메이션과 블렌딩되는 구간
                if (this.playedAnimations[index - 1] === undefined) {
                    currentTrack = await this.getWorldPositionFromBuffer(
                        "RightHand",
                        this.ikBonesRelationships[this.rightHandSolverIndex],
                        index,
                        actions,
                        devidedIndex
                    );

                    currentPosition = {
                        x: currentTrack.position.x + maxXLength / 2 - gap * this.playedAnimations[index].currentLetterIndex,
                        y: currentTrack.position.y - this.interpolationTimer * 5,
                        z: currentTrack.position.z + 3,
                    };

                    this.targets[this.rightHandSolverIndex].set(
                        currentTrack.position.x,
                        currentTrack.position.y,
                        currentTrack.position.z
                    );

                    this.targets[this.rightHandSolverIndex].lerp(
                        new Vector3(currentPosition.x, currentPosition.y, currentPosition.z),
                        weight
                    );
                }
            } else if (fadeContext === "fadeOut") {
                // 지화 완료 시 다른 애니메이션과 블렌딩되는 구간
                if (this.playedAnimations[index + 1] === undefined) {
                    if (currentTime) {
                        currentTrack = await this.getWorldPositionFromBufferCurretTime(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index,
                            actions,
                            devidedIndex,
                            currentTime,
                            animations,
                            true
                        );
                    } else {
                        currentTrack = await this.getWorldPositionFromBuffer(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index,
                            actions,
                            devidedIndex
                        );
                    }

                    currentPosition = {
                        x: currentTrack.position.x + maxXLength / 2 - gap * this.playedAnimations[index].currentLetterIndex,
                        y: currentTrack.position.y,
                        z: currentTrack.position.z + 3,
                    };

                    this.targets[this.rightHandSolverIndex].lerp(
                        new Vector3(currentPosition.x, currentPosition.y, currentPosition.z),
                        1 - weight
                    );
                }
                // 지화끼리 블렌딩되는 구간
                else {
                    if (this.interpolationIncrease) {
                        this.interpolationTimer += 1 / 60;
                    } else {
                        this.interpolationTimer -= 1 / 60;
                    }

                    if (this.playedAnimations[index + 1].totalWordLength >= 4) {
                        nextMaxXLength = 40;
                    } else if (this.playedAnimations[index + 1].totalWordLength <= 2) {
                        nextMaxXLength = 10;
                    }

                    nextGap = nextMaxXLength / this.playedAnimations[index + 1].totalWordLength;

                    if (currentTime) {
                        nextTrack = await this.getWorldPositionFromBufferCurretTime(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index,
                            actions,
                            devidedIndex,
                            currentTime,
                            animations,
                            true
                        );
                    } else {
                        nextTrack = await this.getWorldPositionFromBuffer(
                            "RightHand",
                            this.ikBonesRelationships[this.rightHandSolverIndex],
                            index + 1,
                            actions,
                            devidedIndex
                        );
                    }

                    nextPosition = {
                        x:
                            nextTrack.position.x +
                            nextMaxXLength / 2 -
                            nextGap * this.playedAnimations[index + 1].currentLetterIndex,
                        y: nextTrack.position.y - this.interpolationTimer * 5,
                        z: nextTrack.position.z + 3,
                    };

                    this.targets[this.rightHandSolverIndex].lerp(
                        new Vector3(nextPosition.x, nextPosition.y, nextPosition.z),
                        1 - weight
                    );
                }
            }
        }

        this.prevCurrentTim = currentTime;
    }

    async getWorldPositionFromBufferCurretTime(
        targetBoneName,
        boneNames,
        actionIndex,
        actions,
        devidedIndex,
        currentTime,
        animations,
        both
    ) {
        let startWithAnimation = false;
        let endWithAnimation = false;
        let matrixList = [];
        let matrixWorldList = [];
        let currentTargetPostion = new Vector3();
        let currentTargetQuaternion = new Quaternion();
        let weight = 0;

        // console.log(currentTime - animations[actionIndex].trackStartTime);

        if (actionIndex > 0) {
            if (currentTime - animations[actionIndex].trackStartTime < animations[actionIndex - 1].blendingDuration) {
                weight = (currentTime - animations[actionIndex].trackStartTime) / animations[actionIndex].blendingDuration;
            } else if (animations[actionIndex].trackEndTime - currentTime < animations[actionIndex].blendingDuration) {
                weight = (animations[actionIndex].trackEndTime - currentTime) / animations[actionIndex].blendingDuration;
            } else {
                weight = 1;
            }
        } else {
            if (currentTime - animations[actionIndex].trackStartTime < 0.3) {
                weight = (currentTime - animations[actionIndex].trackStartTime) / animations[actionIndex].blendingDuration;
            } else if (animations[actionIndex].trackEndTime - currentTime < animations[actionIndex].blendingDuration) {
                weight = (animations[actionIndex].trackEndTime - currentTime) / animations[actionIndex].blendingDuration;
            } else {
                weight = 1;
            }
        }

        // weight =
        //     (currentTime - animations[actionIndex].trackStartTime) /
        //     (animations[actionIndex].trackEndTime - animations[actionIndex].trackStartTime);
        let deltaTime1 = currentTime - animations[actionIndex].parentStartTime;
        let deltaTime2 = 0;
        if (both) deltaTime2 = currentTime - animations[actionIndex + 1].parentStartTime;

        if (weight < 1 && actionIndex - 1 > -1) {
            if (!animations[actionIndex - 1].isFingerspell) {
                startWithAnimation = true;
            }
        }
        if (weight < 1 && actionIndex + 1 < animations.length) {
            if (!animations[actionIndex + 1].isFingerspell) {
                endWithAnimation = true;
            }
        }

        for (let i = 0; i < boneNames.length; i++) {
            let tmpMatrix = new Matrix4();
            let trackIndex = actions[actionIndex]._clip.tracks.findIndex((track) => track.name == boneNames[i] + ".position");
            let nextTrackIndex = null;

            let interpolantPosition1 = actions[actionIndex]._clip.tracks[trackIndex].createInterpolant();
            let interpolantQuaternion1 = actions[actionIndex]._clip.tracks[trackIndex + 1].createInterpolant();
            let interpolantScale1 = actions[actionIndex]._clip.tracks[trackIndex + 2].createInterpolant();

            let interpolantPosition2 = null;
            let interpolantQuaternion2 = null;
            let interpolantScale2 = null;

            if (both || endWithAnimation) {
                nextTrackIndex = actions[actionIndex + 1]._clip.tracks.findIndex(
                    (track) => track.name == boneNames[i] + ".position"
                );

                interpolantPosition2 = actions[actionIndex + 1]._clip.tracks[nextTrackIndex].createInterpolant();
                interpolantQuaternion2 = actions[actionIndex + 1]._clip.tracks[nextTrackIndex + 1].createInterpolant();
                interpolantScale2 = actions[actionIndex + 1]._clip.tracks[nextTrackIndex + 2].createInterpolant();
            } else if (startWithAnimation) {
                nextTrackIndex = actions[actionIndex - 1]._clip.tracks.findIndex(
                    (track) => track.name == boneNames[i] + ".position"
                );

                interpolantPosition2 = actions[actionIndex - 1]._clip.tracks[nextTrackIndex].createInterpolant();
                interpolantQuaternion2 = actions[actionIndex - 1]._clip.tracks[nextTrackIndex + 1].createInterpolant();
                interpolantScale2 = actions[actionIndex - 1]._clip.tracks[nextTrackIndex + 2].createInterpolant();
            }

            interpolantPosition1.evaluate(deltaTime1);
            interpolantQuaternion1.evaluate(deltaTime1);
            interpolantScale1.evaluate(deltaTime1);

            if (both || startWithAnimation || endWithAnimation) {
                interpolantPosition2.evaluate(deltaTime2);
                interpolantQuaternion2.evaluate(deltaTime2);
                interpolantScale2.evaluate(deltaTime2);
            }

            let result1 = new Vector3();
            let result2 = new Quaternion();
            let result3 = new Vector3();

            let value1 = new Vector3(
                interpolantPosition1.resultBuffer[0],
                interpolantPosition1.resultBuffer[1],
                interpolantPosition1.resultBuffer[2]
            );
            let value3 = new Quaternion(
                interpolantQuaternion1.resultBuffer[0],
                interpolantQuaternion1.resultBuffer[1],
                interpolantQuaternion1.resultBuffer[2],
                interpolantQuaternion1.resultBuffer[3]
            );
            let value5 = new Vector3(
                interpolantScale1.resultBuffer[0],
                interpolantScale1.resultBuffer[1],
                interpolantScale1.resultBuffer[2]
            );

            let value2 = null;
            let value4 = null;
            let value6 = null;

            if (both || startWithAnimation || endWithAnimation) {
                value2 = new Vector3(
                    interpolantPosition2.resultBuffer[0],
                    interpolantPosition2.resultBuffer[1],
                    interpolantPosition2.resultBuffer[2]
                );
                value4 = new Quaternion(
                    interpolantQuaternion2.resultBuffer[0],
                    interpolantQuaternion2.resultBuffer[1],
                    interpolantQuaternion2.resultBuffer[2],
                    interpolantQuaternion2.resultBuffer[3]
                );
                value6 = new Vector3(
                    interpolantScale2.resultBuffer[0],
                    interpolantScale2.resultBuffer[1],
                    interpolantScale2.resultBuffer[2]
                );

                if (both) {
                    result1.lerpVectors(value1, value2, 1 - weight);
                    result2.slerpQuaternions(value3, value4, 1 - weight);
                    result3.lerpVectors(value5, value6, 1 - weight);
                } else if (startWithAnimation) {
                    result1.lerpVectors(value2, value1, weight);
                    result2.slerpQuaternions(value4, value3, weight);
                    result3.lerpVectors(value6, value5, weight);
                } else if (endWithAnimation) {
                    result1.lerpVectors(value2, value1, weight);
                    result2.slerpQuaternions(value4, value3, weight);
                    result3.lerpVectors(value6, value5, weight);
                }
            } else {
                result1.copy(value1);
                result2.copy(value3);
                result3.copy(value5);
            }

            tmpMatrix.compose(result1, result2, result3);

            matrixList.push(tmpMatrix.clone());
            let tmpMatrixWorld = new Matrix4();
            if (matrixWorldList.length == 0) {
                tmpMatrixWorld = tmpMatrix.clone();
            } else {
                tmpMatrixWorld = tmpMatrix.clone().premultiply(matrixWorldList[matrixWorldList.length - 1]);
            }

            matrixWorldList.push(tmpMatrixWorld);

            if (boneNames[i] == targetBoneName) {
                currentTargetPostion.setFromMatrixPosition(tmpMatrixWorld);
                currentTargetQuaternion.setFromRotationMatrix(tmpMatrix);
            }
        }

        return { position: currentTargetPostion, quaternion: currentTargetQuaternion };
    }

    /**
     *  보간된 값들을 이용해 전달된 Target Bone의 현재 Position과 Quaternion을 추출한다.
     */
    async getWorldPositionFromBuffer(targetBoneName, boneNames, actionIndex, actions, devidedIndex) {
        let matrixList = [];
        let matrixWorldList = [];
        let currentTargetPostion = new Vector3();
        let currentTargetQuaternion = new Quaternion();

        for (let i = 0; i < boneNames.length; i++) {
            let tmpMatrix = new Matrix4();
            let trackIndex = actions[actionIndex]._clip.tracks.findIndex((track) => track.name == boneNames[i] + ".position");

            let tmpPosition = new Vector3(
                actions[actionIndex]._interpolants[trackIndex].resultBuffer[devidedIndex * 3],
                actions[actionIndex]._interpolants[trackIndex].resultBuffer[devidedIndex * 3 + 1],
                actions[actionIndex]._interpolants[trackIndex].resultBuffer[devidedIndex * 3 + 2]
            );
            let tmpQuaternion = new Quaternion(
                actions[actionIndex]._interpolants[trackIndex + 1].resultBuffer[devidedIndex * 4],
                actions[actionIndex]._interpolants[trackIndex + 1].resultBuffer[devidedIndex * 4 + 1],
                actions[actionIndex]._interpolants[trackIndex + 1].resultBuffer[devidedIndex * 4 + 2],
                actions[actionIndex]._interpolants[trackIndex + 1].resultBuffer[devidedIndex * 4 + 3]
            );
            let tmpScale = new Vector3(
                actions[actionIndex]._interpolants[trackIndex + 2].resultBuffer[devidedIndex * 3],
                actions[actionIndex]._interpolants[trackIndex + 2].resultBuffer[devidedIndex * 3 + 1],
                actions[actionIndex]._interpolants[trackIndex + 2].resultBuffer[devidedIndex * 3 + 2]
            );

            tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale);

            matrixList.push(tmpMatrix.clone());
            let tmpMatrixWorld = new Matrix4();
            if (matrixWorldList.length == 0) {
                tmpMatrixWorld = tmpMatrix.clone();
            } else {
                tmpMatrixWorld = tmpMatrix.clone().premultiply(matrixWorldList[matrixWorldList.length - 1]);
            }

            matrixWorldList.push(tmpMatrixWorld);

            if (boneNames[i] == targetBoneName) {
                currentTargetPostion.setFromMatrixPosition(tmpMatrixWorld);
                currentTargetQuaternion.setFromRotationMatrix(tmpMatrix);
            }
        }

        return { position: currentTargetPostion, quaternion: currentTargetQuaternion };
    }
}

export { Kinematics };
