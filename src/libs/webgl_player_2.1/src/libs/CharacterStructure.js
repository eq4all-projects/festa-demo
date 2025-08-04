import * as _ from "lodash";

import * as THREE from "three";
import { FBXLoader } from "./FBXLoader";

import { WebGLPlayerConfig } from "./WebGLPlayerConfig";
import { callAxios, apiDispatcher } from "./APIs";

/**
 *  캐릭터의 구조
 *  1. Meshes & Bones - 를 파싱하여 필요할 때 사용
 *  2. Parts 변경
 */
class CharacterStructure {
    constructor(characterObject, meshes, bones, system, characterFileExt) {
        // Character
        this.characterObject = characterObject;
        this.characterName = "";

        // Loader
        this.fbxLoader = new FBXLoader();
        this.textureLoader = new THREE.TextureLoader();

        // Mesh, Bone
        this.meshes = meshes;
        this.bones = bones;

        // Structure
        this.boneArray = [];
        this.meshArray = [];

        // Morph Index
        this.leftEyeCloseIndex;
        this.rightEyeCloseIndex;

        // Avatar
        this.avatarStructure = {};

        // Parts
        this.basicParts = {};
        this.partsIcons = [];

        // Config
        this.system = system;
        this.config = new WebGLPlayerConfig(system);
        this.characterFileExt = characterFileExt;
    }

    /**
     *  Bone 구조를 저장한다.
     */
    async createBoneVariables() {
        this.boneArray["Bip001"] = this.characterObject.getObjectByName("Bip001");
        this.boneArray["Hips"] = this.characterObject.getObjectByName("Hips");
        this.boneArray["Spine"] = this.characterObject.getObjectByName("Spine");
        this.boneArray["Chest"] = this.characterObject.getObjectByName("Chest");
        this.boneArray["Upper_Chest"] = this.characterObject.getObjectByName("Upper_Chest");
        this.boneArray["Head"] = this.characterObject.getObjectByName("Head");
        this.boneArray["Neck"] = this.characterObject.getObjectByName("Neck");
        this.boneArray["Jaw"] = this.characterObject.getObjectByName("Jaw");
        this.boneArray["TongueRoot"] = this.characterObject.getObjectByName("TongueRoot");
        this.boneArray["Tongue01"] = this.characterObject.getObjectByName("Tongue01");
        this.boneArray["Tongue02"] = this.characterObject.getObjectByName("Tongue02");
        this.boneArray["Tongue03"] = this.characterObject.getObjectByName("Tongue03");
        this.boneArray["Tongue04"] = this.characterObject.getObjectByName("Tongue04");
        this.boneArray["LeftEye"] = this.characterObject.getObjectByName("LeftEye");
        this.boneArray["RightEye"] = this.characterObject.getObjectByName("RightEye");
        this.boneArray["RightShoulder1"] = this.characterObject.getObjectByName("RightShoulder1");
        this.boneArray["RightShoulder"] = this.characterObject.getObjectByName("RightShoulder");
        this.boneArray["RightArm"] = this.characterObject.getObjectByName("RightArm");
        this.boneArray["RightArmElbow"] = this.characterObject.getObjectByName("RightArmElbow");
        this.boneArray["RightArmpit"] = this.characterObject.getObjectByName("RightArmpit");
        this.boneArray["RightArmTwist1"] = this.characterObject.getObjectByName("RightArmTwist1");
        this.boneArray["RightArmTwist2"] = this.characterObject.getObjectByName("RightArmTwist2");
        this.boneArray["RightForeArm"] = this.characterObject.getObjectByName("RightForeArm");
        this.boneArray["RightForeArmTwist"] = this.characterObject.getObjectByName("RightForeArmTwist");
        this.boneArray["RightHand"] = this.characterObject.getObjectByName("RightHand");
        this.boneArray["RightHandThumb1"] = this.characterObject.getObjectByName("RightHandThumb1");
        this.boneArray["RightHandThumb2"] = this.characterObject.getObjectByName("RightHandThumb2");
        this.boneArray["RightHandThumb3"] = this.characterObject.getObjectByName("RightHandThumb3");
        this.boneArray["RightHandIndex1"] = this.characterObject.getObjectByName("RightHandIndex1");
        this.boneArray["RightHandIndex2"] = this.characterObject.getObjectByName("RightHandIndex2");
        this.boneArray["RightHandIndex3"] = this.characterObject.getObjectByName("RightHandIndex3");
        this.boneArray["RightHandMiddle1"] = this.characterObject.getObjectByName("RightHandMiddle1");
        this.boneArray["RightHandMiddle2"] = this.characterObject.getObjectByName("RightHandMiddle2");
        this.boneArray["RightHandMiddle3"] = this.characterObject.getObjectByName("RightHandMiddle3");
        this.boneArray["RightHandRing1"] = this.characterObject.getObjectByName("RightHandRing1");
        this.boneArray["RightHandRing2"] = this.characterObject.getObjectByName("RightHandRing2");
        this.boneArray["RightHandRing3"] = this.characterObject.getObjectByName("RightHandRing3");
        this.boneArray["RightHandPinky1"] = this.characterObject.getObjectByName("RightHandPinky1");
        this.boneArray["RightHandPinky2"] = this.characterObject.getObjectByName("RightHandPinky2");
        this.boneArray["RightHandPinky3"] = this.characterObject.getObjectByName("RightHandPinky3");
        this.boneArray["LeftShoulder1"] = this.characterObject.getObjectByName("LeftShoulder1");
        this.boneArray["LeftShoulder"] = this.characterObject.getObjectByName("LeftShoulder");
        this.boneArray["LeftArm"] = this.characterObject.getObjectByName("LeftArm");
        this.boneArray["LeftArmElbow"] = this.characterObject.getObjectByName("LeftArmElbow");
        this.boneArray["LeftArmpit"] = this.characterObject.getObjectByName("LeftArmpit");
        this.boneArray["LeftArmTwist1"] = this.characterObject.getObjectByName("LeftArmTwist1");
        this.boneArray["LeftArmTwist2"] = this.characterObject.getObjectByName("LeftArmTwist2");
        this.boneArray["LeftForeArm"] = this.characterObject.getObjectByName("LeftForeArm");
        this.boneArray["LeftForeArmTwist"] = this.characterObject.getObjectByName("LeftForeArmTwist");
        this.boneArray["LeftHand"] = this.characterObject.getObjectByName("LeftHand");
        this.boneArray["LeftHandThumb1"] = this.characterObject.getObjectByName("LeftHandThumb1");
        this.boneArray["LeftHandThumb2"] = this.characterObject.getObjectByName("LeftHandThumb2");
        this.boneArray["LeftHandThumb3"] = this.characterObject.getObjectByName("LeftHandThumb3");
        this.boneArray["LeftHandIndex1"] = this.characterObject.getObjectByName("LeftHandIndex1");
        this.boneArray["LeftHandIndex2"] = this.characterObject.getObjectByName("LeftHandIndex2");
        this.boneArray["LeftHandIndex3"] = this.characterObject.getObjectByName("LeftHandIndex3");
        this.boneArray["LeftHandMiddle1"] = this.characterObject.getObjectByName("LeftHandMiddle1");
        this.boneArray["LeftHandMiddle2"] = this.characterObject.getObjectByName("LeftHandMiddle2");
        this.boneArray["LeftHandMiddle3"] = this.characterObject.getObjectByName("LeftHandMiddle3");
        this.boneArray["LeftHandRing1"] = this.characterObject.getObjectByName("LeftHandRing1");
        this.boneArray["LeftHandRing2"] = this.characterObject.getObjectByName("LeftHandRing2");
        this.boneArray["LeftHandRing3"] = this.characterObject.getObjectByName("LeftHandRing3");
        this.boneArray["LeftHandPinky1"] = this.characterObject.getObjectByName("LeftHandPinky1");
        this.boneArray["LeftHandPinky2"] = this.characterObject.getObjectByName("LeftHandPinky2");
        this.boneArray["LeftHandPinky3"] = this.characterObject.getObjectByName("LeftHandPinky3");
        this.boneArray["LeftUpLeg"] = this.characterObject.getObjectByName("LeftUpLeg");
        this.boneArray["RightUpLeg"] = this.characterObject.getObjectByName("RightUpLeg");
        this.boneArray["LeftLeg"] = this.characterObject.getObjectByName("LeftLeg");
        this.boneArray["RightLeg"] = this.characterObject.getObjectByName("RightLeg");
        this.boneArray["LeftFoot"] = this.characterObject.getObjectByName("LeftFoot");
        this.boneArray["RightFoot"] = this.characterObject.getObjectByName("RightFoot");
        this.boneArray["LeftToes"] = this.characterObject.getObjectByName("LeftToes");
        this.boneArray["RightToes"] = this.characterObject.getObjectByName("RightToes");
        this.boneArray["LeftToesEnd"] = this.characterObject.getObjectByName("LeftToesEnd");
        this.boneArray["RightToesEnd"] = this.characterObject.getObjectByName("RightToesEnd");
        this.boneArray["Mesh_Face"] = this.characterObject.getObjectByName("Mesh_Face");
    }

    /**
     *  Mesh 구조를 저장한다.
     */
    async createMeshVariables() {
        this.meshArray["Mesh_Hand"] = this.characterObject.getObjectByName("Mesh_Hand");
        this.meshArray["Mesh_Face"] = this.characterObject.getObjectByName("Mesh_Face");
    }

    /**
     *  Face의 Morph index 값을 저장한다.
     */
    async getMeshFaceMorph() {
        this.leftEyeCloseIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["LEye_Close"];
        this.rightEyeCloseIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["REye_Close"];

        this.rightEyeBrowInnerRaiseIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["REyeBrow_InnerRaise"];
        this.rightEyeBrowLowerIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["REyeBrow_Lower"];
        this.rightEyeBrowOuterRaiseIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["REyeBrow_OuterRaise"];
        this.rightEyeBrowUpperIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["REyeBrow_Upper"];

        this.leftEyeBrowInnerRaiseIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["LEyeBrow_InnerRaise"];
        this.leftEyeBrowLowerIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["LEyeBrow_Lower"];
        this.leftEyeBrowOuterRaiseIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["LEyeBrow_OuterRaise"];
        this.leftEyeBrowUpperIndex = this.meshArray["Mesh_Face"].morphTargetDictionary["LEyeBrow_Upper"];

        this.eyeIndexes = {
            leftEyeCloseIndex: this.leftEyeCloseIndex,
            rightEyeCloseIndex: this.rightEyeCloseIndex,
            rightEyeBrowLowerIndex: this.rightEyeBrowLowerIndex,
            leftEyeBrowLowerIndex: this.leftEyeBrowLowerIndex,
        };
    }

    /**
     *  Protocol Version 0.3을 기반으로 한 Avatar 구조를 가져온다.
     */
    async _3_getAvatarStructure(characterName, avatarName) {
        this.characterName = characterName;
        let query = {
            type: 13,
            search: avatarName,
            by: 23,
            method: 1,
            input_change_flag: 1,
        };
        let avatarResponse = await apiDispatcher(
            this.config.APIOrigin + this.config.getAvatarStructureAPI(avatarName),
            "POST",
            query,
            "",
            this.system
        );
        if (Array.isArray(avatarResponse.data)) {
            this.avatarStructure = avatarResponse.data[0].result[0];
        } else {
            this.avatarStructure = avatarResponse.data.result[0];
        }
    }

    /**
     *  Protocol Version 0.4를 기반으로 한 Avatar 구조를 가져온다.
     */
    async _4_getAvatarStructure(characterName, avatarName) {
        let avatarResponse = await callAxios(this.config.APIOrigin + this.config.getAvatarStructureAPI(avatarName), "GET");
        this.avatarStructure = avatarResponse.data.results;
    }

    async _3_loadAvatar() {
        if (!this.avatarStructure) return;

        await Promise.all(
            _.map(
                this.avatarStructure.avatar_info,
                function (info, index) {
                    this._3_changePart(info, index);
                }.bind(this)
            )
        );
    }

    async _4_loadAvatar(characterName) {
        if (!this.avatarStructure) return;

        await Promise.all(
            _.map(
                this.avatarStructure.structure,
                async function (value, index) {
                    if (value != null && value != undefined) await this._4_changePart(value, index, characterName);
                }.bind(this)
            )
        );
    }

    async _3_changePart(selectedPart, parentName) {
        if (!this.avatarStructure.avatar_info) {
            this.avatarStructure.avatar_info = {};
        }
        if (selectedPart.search("Unity") > -1) {
            return;
        }

        this.avatarStructure.avatar_info[parentName] = selectedPart;

        let tmpSkinnedMesh = null;
        let tmpObject = null;
        if (selectedPart && selectedPart.search("_00") === -1 && parentName !== "Eye") {
            await Promise.all(
                _.map(
                    this.characterFileExt == "fbx" ? this.characterObject.children : this.characterObject.children[0].children,
                    function (skinnedMesh) {
                        if (skinnedMesh.name.search(parentName) > -1) {
                            tmpSkinnedMesh = skinnedMesh;

                            if (skinnedMesh.name.search("_00") > -1) {
                                this.basicParts[parentName] = skinnedMesh.clone();
                            }
                        }
                    }.bind(this)
                )
            );

            let fbxPart = selectedPart;
            if (selectedPart.search(/_01$/) == -1) {
                fbxPart = selectedPart.replace(/_[0-9]+$/, "_01");
            }

            if (this.system == "webOS") {
                let avatarArrayBuffer = await apiDispatcher(
                    `${this.config.fileOrigin}/${fbxPart}`,
                    "arrayBuffer",
                    null,
                    "",
                    this.system
                );

                tmpObject = await this.fbxLoader.parse(avatarArrayBuffer, `${this.config.fileOrigin}/`);
            } else {
                tmpObject = await this.fbxLoader.loadAsync(
                    this.config.fileOrigin + this.config.getPartFileAPI(this.characterName, fbxPart)
                );
            }

            _.map(
                tmpObject.children,
                async function (child) {
                    if (child === undefined) return;

                    if (child.type == "SkinnedMesh") {
                        child.frustumCulled = false;
                        child.castShadow = false;
                        child.receiveShadow = false;
                        child.material.side = THREE.FrontSide;
                        child.material.morphTargets = false;
                        child.material.map.generateMipmaps = true;

                        child.material.color.r += child.material.color.r * 0.5921568870544434;
                        child.material.color.g += child.material.color.g * 0.5921568870544434;
                        child.material.color.b += child.material.color.b * 0.5921568870544434;

                        let newMatrix = new THREE.Matrix4();

                        _.map(
                            child.skeleton.bones,
                            function (bone) {
                                let objectBone = this.characterObject.getObjectByName(bone.name);

                                newMatrix.copy(bone.matrix).invert();
                                bone.applyMatrix4(newMatrix);

                                objectBone.add(bone);
                            }.bind(this)
                        );

                        if (tmpSkinnedMesh) {
                            tmpSkinnedMesh.parent.add(child);
                            tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                        } else {
                            // this.characterObject.add(child);
                            let tmpCharacterObject =
                                this.characterFileExt == "fbx" ? this.characterObject : this.characterObject.children[0];
                            tmpCharacterObject.add(child);
                        }
                    }
                }.bind(this)
            );
        } else if (selectedPart.search(parentName + "_00") > -1) {
            if (this.basicParts[parentName]) {
                let basicMesh = this.basicParts[parentName].clone();

                // _.map(this.characterObject.children, function (skinnedMesh) {
                //     if (skinnedMesh.name.search(parentName) > -1) {
                //         tmpSkinnedMesh = skinnedMesh;
                //     }
                // });
                _.map(
                    this.characterFileExt == "fbx" ? this.characterObject.children : this.characterObject.children[0].children,
                    async function (skinnedMesh) {
                        if (skinnedMesh.name.search(parentName) > -1) {
                            tmpSkinnedMesh = skinnedMesh;
                        }
                    }.bind(this)
                );

                if (tmpSkinnedMesh) {
                    tmpSkinnedMesh.parent.add(basicMesh);
                    tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                }
            }
        } else if (!selectedPart) {
            if (this.basicParts[parentName]) {
                let basicMesh = this.basicParts[parentName].clone();

                await Promise.all(
                    _.map(
                        this.characterFileExt == "fbx"
                            ? this.characterObject.children
                            : this.characterObject.children[0].children,
                        async function (skinnedMesh) {
                            if (skinnedMesh.name.search(parentName) > -1) {
                                tmpSkinnedMesh = skinnedMesh;
                            }
                        }.bind(this)
                    )
                );

                if (tmpSkinnedMesh) {
                    tmpSkinnedMesh.parent.add(basicMesh);
                    tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                }
            } else {
                await Promise.all(
                    _.map(
                        this.characterFileExt == "fbx"
                            ? this.characterObject.children
                            : this.characterObject.children[0].children,
                        async function (skinnedMesh) {
                            if (skinnedMesh.name.search(parentName) > -1) {
                                tmpSkinnedMesh = skinnedMesh;
                            }
                        }.bind(this)
                    )
                );

                if (tmpSkinnedMesh) {
                    tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                }
            }
        }

        if (selectedPart) {
            _.map(
                // this.characterObject.children,
                this.characterFileExt == "fbx" ? this.characterObject.children : this.characterObject.children[0].children,
                async function (skinnedMesh) {
                    if (skinnedMesh.name.search(parentName) > -1) {
                        let textureFileName = selectedPart + ".png";
                        let tmpTexture = null;
                        if (this.system == "webOS") {
                            let localTexture = await apiDispatcher(
                                `${this.config.fileOrigin}/${textureFileName}`,
                                "dataUrl",
                                null,
                                "",
                                this.system
                            );
                            tmpTexture = await this.textureLoader.loadAsync(localTexture);
                        } else {
                            tmpTexture = await this.textureLoader.loadAsync(
                                this.config.fileOrigin + this.config.getTextureFileAPI(this.characterName, textureFileName)
                            );
                        }

                        tmpTexture.encoding = THREE.sRGBEncoding;
                        skinnedMesh.material.map = tmpTexture;

                        if (parentName === "Eye" || (textureFileName.search("_00_00") > -1 && parentName !== "Body"))
                            tmpTexture.flipY = false;
                        if (parentName === "Face" && characterName == "LGE_Reah") tmpTexture.flipY = false;
                    }
                }.bind(this)
            );
        }
    }

    async _4_changePart(selectedPart, parentName, characterName) {
        if (!this.avatarStructure.structure) {
            this.avatarStructure.structure = {};
        }

        if (selectedPart.name == "Avatar_Female01_Glasses_00_00") {
            selectedPart.name = "None";
            this.avatarStructure.structure[parentName] = {
                model: null,
                texture: null,
                name: null,
            };
        } else {
            this.avatarStructure.structure[parentName] = selectedPart;
        }

        let tmpSkinnedMesh = null;
        let tmpObject = null;

        if (selectedPart.model) {
            await Promise.all(
                _.map(
                    this.characterFileExt == "fbx" ? this.characterObject.children : this.characterObject.children[0].children,
                    async function (skinnedMesh) {
                        if (skinnedMesh.name.search(parentName) > -1) {
                            tmpSkinnedMesh = skinnedMesh;

                            if (skinnedMesh.name.search("_00") > -1) {
                                this.basicParts[parentName] = skinnedMesh.clone();
                            }
                        }
                    }.bind(this)
                )
            );

            tmpObject = await this.fbxLoader.loadAsync(
                this.config.fileOrigin +
                    this.config.getPartFileAPI(
                        this.avatarStructure.character ? this.avatarStructure.character : characterName,
                        selectedPart.model.filename
                    )
            );

            await Promise.all(
                _.map(
                    tmpObject.children,
                    async function (child) {
                        if (child === undefined) return;

                        if (child.type == "SkinnedMesh") {
                            child.frustumCulled = false;
                            child.castShadow = false;
                            child.receiveShadow = false;
                            child.material.side = THREE.FrontSide;
                            child.material.morphTargets = false;
                            child.material.map.generateMipmaps = true;

                            child.material.color.r += child.material.color.r * 0.5921568870544434;
                            child.material.color.g += child.material.color.g * 0.5921568870544434;
                            child.material.color.b += child.material.color.b * 0.5921568870544434;

                            let newMatrix = new THREE.Matrix4();

                            await Promise.all(
                                _.map(
                                    child.skeleton.bones,
                                    function (bone) {
                                        let objectBone = this.characterObject.getObjectByName(bone.name);

                                        newMatrix.copy(bone.matrix).invert();
                                        bone.applyMatrix4(newMatrix);

                                        objectBone.add(bone);
                                    }.bind(this)
                                )
                            );

                            if (tmpSkinnedMesh) {
                                tmpSkinnedMesh.parent.add(child);
                                tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                            } else {
                                let tmpCharacterObject =
                                    this.characterFileExt == "fbx" ? this.characterObject : this.characterObject.children[0];
                                tmpCharacterObject.add(child);
                            }
                        }
                    }.bind(this)
                )
            );
        } else if (selectedPart.name != null && selectedPart.name.search(parentName + "_00") > -1) {
            if (this.basicParts[parentName]) {
                let basicMesh = this.basicParts[parentName].clone();

                await Promise.all(
                    _.map(
                        this.characterFileExt == "fbx"
                            ? this.characterObject.children
                            : this.characterObject.children[0].children,
                        async function (skinnedMesh) {
                            if (skinnedMesh.name.search(parentName) > -1) {
                                tmpSkinnedMesh = skinnedMesh;
                            }
                        }.bind(this)
                    )
                );

                if (tmpSkinnedMesh) {
                    tmpSkinnedMesh.parent.add(basicMesh);
                    tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                }
            }
        } else if (selectedPart.name == "None") {
            if (this.basicParts[parentName]) {
                let basicMesh = this.basicParts[parentName].clone();

                await Promise.all(
                    _.map(
                        this.characterFileExt == "fbx"
                            ? this.characterObject.children
                            : this.characterObject.children[0].children,
                        async function (skinnedMesh) {
                            if (skinnedMesh.name.search(parentName) > -1) {
                                tmpSkinnedMesh = skinnedMesh;
                            }
                        }.bind(this)
                    )
                );

                if (tmpSkinnedMesh) {
                    tmpSkinnedMesh.parent.add(basicMesh);
                    tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                }
            } else {
                await Promise.all(
                    _.map(
                        this.characterFileExt == "fbx"
                            ? this.characterObject.children
                            : this.characterObject.children[0].children,
                        async function (skinnedMesh) {
                            if (skinnedMesh.name.search(parentName) > -1) {
                                tmpSkinnedMesh = skinnedMesh;
                            }
                        }.bind(this)
                    )
                );

                if (tmpSkinnedMesh) {
                    tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                }
            }
        }

        await Promise.all(
            _.map(
                this.characterFileExt == "fbx" ? this.characterObject.children : this.characterObject.children[0].children,
                async function (skinnedMesh) {
                    if (skinnedMesh.name.search(parentName) > -1) {
                        if (selectedPart.name != null) {
                            let textureFileName = selectedPart.name + ".png";
                            let tmpTexture = await this.textureLoader.loadAsync(
                                this.config.fileOrigin +
                                    this.config.getTextureFileAPI(
                                        this.avatarStructure.character ? this.avatarStructure.character : characterName,
                                        encodeURIComponent(textureFileName)
                                    )
                            );

                            tmpTexture.encoding = THREE.sRGBEncoding;
                            skinnedMesh.material.map = tmpTexture;
                            if (parentName === "Eye" || (textureFileName.search("_00_00") > -1 && parentName !== "Body"))
                                tmpTexture.flipY = false;
                            if (parentName === "Face" && characterName == "LGE_Reah") tmpTexture.flipY = false;
                        }
                    }
                }.bind(this)
            )
        );
    }

    async glbChangeBodyFrame(characterName, bodyfile) {
        this.characterName = characterName;

        let tmpSkinnedMesh = this.characterObject.getObjectByName("Mesh_Body_00");
        // let tmpObject = await this.fbxLoader.loadAsync(
        //     this.config.fileOrigin + this.config.getPartFileAPI(this.characterName, bodyfile)
        // );
        let tmpObject = null;

        let fileExist = await callAxios(this.config.fileOrigin + this.config.getPartFileAPI(this.characterName, bodyfile), "GET");

        if (fileExist.status !== 200) return;

        if (this.system == "webOS") {
            let avatarArrayBuffer = await apiDispatcher(
                `${this.config.fileOrigin}/${bodyfile}`,
                "arrayBuffer",
                null,
                "",
                this.system
            );
            tmpObject = await this.fbxLoader.parse(avatarArrayBuffer, `${this.config.fileOrigin}/`);
        } else {
            tmpObject = await this.fbxLoader.loadAsync(
                this.config.fileOrigin + this.config.getPartFileAPI(this.characterName, bodyfile)
            );
        }

        _.map(
            tmpObject.children,
            function (child) {
                if (child === undefined) return;

                if (child.type == "SkinnedMesh") {
                    child.frustumCulled = false;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.material.side = THREE.FrontSide;
                    child.material.morphTargets = false;
                    child.material.map.generateMipmaps = true;

                    child.material.color.r += child.material.color.r * 0.5921568870544434;
                    child.material.color.g += child.material.color.g * 0.5921568870544434;
                    child.material.color.b += child.material.color.b * 0.5921568870544434;

                    let newMatrix = new THREE.Matrix4();

                    _.map(
                        child.skeleton.bones,
                        function (bone) {
                            let objectBone = this.characterObject.getObjectByName(bone.name);

                            newMatrix.copy(bone.matrix).invert();
                            bone.applyMatrix4(newMatrix);

                            objectBone.add(bone);
                        }.bind(this)
                    );

                    if (tmpSkinnedMesh) {
                        tmpSkinnedMesh.parent.add(child);
                        tmpSkinnedMesh.parent.remove(tmpSkinnedMesh);
                    } else {
                        let tmpCharacterObject =
                            this.characterFileExt == "fbx" ? this.characterObject : this.characterObject.children[0];
                        tmpCharacterObject.add(child);
                    }
                }
            }.bind(this)
        );

        _.map(
            this.characterObject.children,
            async function (skinnedMesh) {
                if (skinnedMesh.name.search("Body_00") > -1) {
                    let textureFileName = bodyfile + ".png";
                    let tmpTexture = null;
                    if (this.system == "webOS") {
                        let localTexture = await apiDispatcher(
                            `${this.config.fileOrigin}/${textureFileName}`,
                            "dataUrl",
                            null,
                            "",
                            this.system
                        );
                        tmpTexture = await this.textureLoader.loadAsync(localTexture);
                    } else {
                        tmpTexture = await this.textureLoader.loadAsync(
                            this.config.fileOrigin + this.config.getTextureFileAPI(this.characterName, textureFileName)
                        );
                    }

                    tmpTexture.encoding = THREE.sRGBEncoding;
                    skinnedMesh.material.map = tmpTexture;
                }
            }.bind(this)
        );
    }

    /**
     *  신규 아바타를 저장한다.
     */
    async saveAvatarStructure(avatarName) {
        let response = await callAxios(this.config.APIOrigin + "avatars/structure/" + avatarName, "POST", {
            avatar_structure: this.avatarStructure,
        });

        return response;
    }

    /**
     *  CMS v2.0 Admin setting 페이지에서 아바타 아이콘을 출력한다.
     */
    async getParts() {
        let tmpParts = await callAxios(this.config.APIOrigin + "avatars/" + this.characterName, "GET", {}, { filetype: "fbx" });

        this.parts = tmpParts.data.data;
    }

    async getPartsIcons() {
        let tmpPartsIcons = await callAxios(
            this.config.APIOrigin + "avatars/" + this.characterName,
            "GET",
            {},
            { filetype: "icon" }
        );

        this.rawPartsIcons = tmpPartsIcons.data.data;
    }

    async rearrangePartsIcons() {
        let tmpIcons = {
            Eye: [],
            Face: [],
            Frame_Body: [],
            Body: [],
            Glasses: [],
            Hair: [],
            Pants: [],
            Hand: [],
            NameTag: [],
            Teeth_Tongue: [],
        };

        await this.rawPartsIcons.forEach(async (icon) => {
            let currentIcon = {};
            let textureName = icon.filename.replace("_Icon", "");
            let filename = icon.filename.split("_");
            filename = filename[2] + "_" + filename[3];

            let texture = await callAxios(
                this.config.APIOrigin + "characters/" + this.characterName + "/file",
                "GET",
                {},
                { filepath: icon.filepath, filename: textureName }
            );

            if (texture.data.results) currentIcon.texture = texture.data.results;
            else currentIcon.texture = null;

            currentIcon.name = textureName.replace(".png", "");

            this.parts.forEach(async (file) => {
                if (file.filename.search(filename) > -1) {
                    currentIcon.model = file;
                }
            });

            if (!currentIcon.model) currentIcon.model = null;

            currentIcon.icon = icon;

            if (currentIcon.name.search("Eye") > -1) {
                tmpIcons["Eye"].push(currentIcon);
            } else if (currentIcon.name.search("Body") > -1) {
                tmpIcons["Body"].push(currentIcon);
            } else if (currentIcon.name.search("Glasses") > -1) {
                tmpIcons["Glasses"].push(currentIcon);
            } else if (currentIcon.name.search("Hair") > -1) {
                tmpIcons["Hair"].push(currentIcon);
            } else if (currentIcon.name.search("Pants") > -1) {
                tmpIcons["Pants"].push(currentIcon);
            } else if (currentIcon.name.search("Face") > -1) {
                tmpIcons["Face"].push(currentIcon);
            } else if (currentIcon.name.search("Frame_Body") > -1) {
                tmpIcons["Frame_Body"].push(currentIcon);
            } else if (currentIcon.name.search("Hand") > -1) {
                tmpIcons["Hand"].push(currentIcon);
            } else if (currentIcon.name.search("NameTag") > -1) {
                tmpIcons["NameTag"].push(currentIcon);
            } else if (currentIcon.name.search("Teeth_Tongue") > -1) {
                tmpIcons["Teeth_Tongue"].push(currentIcon);
            }
        });

        this.partsIcons = tmpIcons;
    }
}

export { CharacterStructure };
