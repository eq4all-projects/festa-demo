import * as _ from "lodash";

import * as THREE from "three";
import { FBXLoader } from "./FBXLoader";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";

import { WebGLPlayerConfig } from "./WebGLPlayerConfig";
import { callAxios, apiDispatcher } from "./APIs";

/**
 *  Scene에 적용될 조명을 설정한다. (CMS v2.0 Admin page)
 */
class LightsSetting {
    constructor(scene, lights, system) {
        this.scene = scene;

        // Lights
        this.lights = lights;
        this.lightHelper = [];

        // Config
        this.system = system;
        this.config = new WebGLPlayerConfig(system);
    }

    async getLightSetting() {
        let targetIndex = this.lights.findIndex((light) => light["type"] == "lightTarget");

        if (targetIndex == -1) {
            this.lights.push({
                name: "lightTarget" + (this.lights.length + 1),
                type: "lightTarget",
                "position X": this.lightTargetObject.position.x,
                "position Y": this.lightTargetObject.position.y,
                "position Z": this.lightTargetObject.position.z,
            });
        }

        this.scene.traverse(
            function(light) {
                let currentLightIndex = this.lights.findIndex((l) => l.name == light.name);

                if (currentLightIndex == -1) return;

                if (light.type == "DirectionalLight") {
                    let rgb = light.color.getHex();
                    this.lights[currentLightIndex]["light color"] = rgb;
                    this.lights[currentLightIndex]["visible"] = light.visible;
                    this.lights[currentLightIndex]["intensity"] = light.intensity;
                    this.lights[currentLightIndex]["fromVector X"] = light.position.x;
                    this.lights[currentLightIndex]["fromVector Y"] = light.position.y;
                    this.lights[currentLightIndex]["fromVector Z"] = light.position.z;

                    if (!this.lights[currentLightIndex]["shadow"]) {
                        this.lights[currentLightIndex]["shadow"] = {};
                    }

                    this.lights[currentLightIndex]["shadow"]["mapSize width"] = light.shadow.mapSize.x;
                    this.lights[currentLightIndex]["shadow"]["mapSize height"] = light.shadow.mapSize.y;
                    this.lights[currentLightIndex]["shadow"]["shadow bias"] = light.shadow.bias;
                    this.lights[currentLightIndex]["shadow"]["shadow radius"] = light.shadow.radius;
                    this.lights[currentLightIndex]["use shadow"] = light.castShadow;
                } else if (light.type == "AmbientLight") {
                    let rgb = light.color.getHex();
                    this.lights[currentLightIndex]["light color"] = rgb;
                    this.lights[currentLightIndex]["visible"] = light.visible;
                    this.lights[currentLightIndex]["intensity"] = light.intensity;
                } else if (light.type == "PointLight") {
                    let rgb = light.color.getHex();
                    this.lights[currentLightIndex]["light color"] = rgb;
                    this.lights[currentLightIndex]["visible"] = light.visible;
                    this.lights[currentLightIndex]["intensity"] = light.intensity;
                    this.lights[currentLightIndex]["position X"] = light.position.x;
                    this.lights[currentLightIndex]["position Y"] = light.position.y;
                    this.lights[currentLightIndex]["position Z"] = light.position.z;

                    if (!this.lights[currentLightIndex]["shadow"]) {
                        this.lights[currentLightIndex]["shadow"] = {};
                    }

                    // this.lights[currentLightIndex]["shadow"]["camera far"] = light.shadow.camera.far;
                    this.lights[currentLightIndex]["shadow"]["shadow bias"] = light.shadow.bias;
                    this.lights[currentLightIndex]["shadow"]["shadow radius"] = light.shadow.radius;
                    this.lights[currentLightIndex]["use shadow"] = light.castShadow;
                    this.lights[currentLightIndex]["distance"] = light.distance;
                    this.lights[currentLightIndex]["decay"] = light.decay;
                } else if (light.name.search("lightTarget") > -1) {
                    this.lights[currentLightIndex]["position X"] = light.position.x;
                    this.lights[currentLightIndex]["position Y"] = light.position.y;
                    this.lights[currentLightIndex]["position Z"] = light.position.z;
                }
            }.bind(this)
        );

        return this.lights;
    }

    /**
     *  신규 조명을 생성한다.
     */
    async setNewLight() {
        let count = 0;

        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            if (this.scene.children[i].type.search(/Light$/) > -1) {
                this.scene.remove(this.scene.children[i]);
            }
        }

        _.forEach(
            this.lights,
            async function(light) {
                count++;
                this.addLights(light.type, light, count);
            }.bind(this)
        );
    }

    /**
     *  조명 Object를 생성하여 Scene에 추가한다.
     */
    async addLights(lightType, setting, count) {
        var light = null;
        if (lightType == "AmbientLight") {
            light = new THREE.AmbientLight(setting["light color"], setting["intensity"]);
        } else if (lightType == "DirectionalLight") {
            light = new THREE.DirectionalLight(setting["light color"], setting["intensity"]);
        } else if (lightType == "PointLight") {
            light = new THREE.PointLight(setting["light color"], setting["intensity"]);
        }

        _.map(setting, function(val, key) {
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
        
        return light;
    }

    async initGuiLight() {
        if (this.guiLight) {
            this.guiLight.destroy();
        }

        let guiParent = window.document.getElementById("guiContainer");

        const gui = new GUI({ autoPlace: false, container: guiParent });
        this.guiLight = gui;

        this.scene.traverse((child) => {
            if (child.name == "lightTarget") {
                let folder = gui.addFolder(child.name);

                folder.add(child.position, "x", -300, 300, 0.1).onChange((val) => {
                    child.position.x = val;
                    child.updateMatrixWorld(true);
                });
                folder.add(child.position, "y", -300, 300, 0.1).onChange((val) => {
                    child.position.y = val;
                    child.updateMatrixWorld(true);
                });
                folder.add(child.position, "z", -300, 300, 0.1).onChange((val) => {
                    child.position.z = val;
                    child.updateMatrixWorld(true);
                });
            }
            if (child.type == "AmbientLight" || child.type == "DirectionalLight" || child.type == "PointLight") {
                let folder = gui.addFolder(child.name);
                let scene = this.scene;
                let lightList = this.lights;

                let lightSetting = {
                    lightColor: child.color.getHex(),
                    intensity: child.intensity,
                    castShadow: child.castShadow,
                    receiveShadow: child.receiveShadow,
                    visible: child.visible,
                    position: {
                        VectorX: child.position.x,
                        VectorY: child.position.y,
                        VectorZ: child.position.z,
                    },
                    remove: function() {
                        lightList.forEach((light, index) => {
                            if (light.name == child.name) {
                                lightList.splice(index, 1);
                            }
                        });
                        scene.remove(child);
                        folder.destroy();
                    },
                };

                folder.addColor(lightSetting, "lightColor").onChange((val) => {
                    child.color.setHex(val);
                });
                folder.add(lightSetting, "intensity", 0, 2).onChange((val) => {
                    child.intensity = val;
                });
                folder.add(lightSetting, "visible").onChange((val) => {
                    child.visible = val;
                });

                if (child.type != "AmbientLight") {
                    if (child.type == "DirectionalLight") this.lightHelper.push(new THREE.DirectionalLightHelper(child));
                    if (child.type == "PointLight") this.lightHelper.push(new THREE.PointLightHelper(child));

                    folder.add(lightSetting, "castShadow").onChange((val) => {
                        child.castShadow = val;
                        child.updateMatrixWorld(true);
                    });
                    // folder.add(lightSetting, "receiveShadow").onChange((val) => {
                    //     child.receiveShadow = val;
                    //     child.updateMatrixWorld(true);
                    // });

                    let positionFolder = folder.addFolder("Position");

                    positionFolder.add(lightSetting.position, "VectorX", -300, 300, 0.1).onChange((val) => {
                        child.position.x = val;
                        child.position.setLength(200);
                        child.updateMatrixWorld(true);
                    });
                    positionFolder.add(lightSetting.position, "VectorY", -300, 300, 0.1).onChange((val) => {
                        child.position.y = val;
                        child.position.setLength(200);
                        child.updateMatrixWorld(true);
                    });
                    positionFolder.add(lightSetting.position, "VectorZ", -300, 300, 0.1).onChange((val) => {
                        child.position.z = val;
                        child.position.setLength(200);
                        child.updateMatrixWorld(true);
                    });

                    // this.lightCameraHelper.push(new THREE.CameraHelper(child.shadow.camera));

                    if (child.type == "DirectionalLight") {
                        let shadowFolder = folder.addFolder("Shadow");
                        // let shadowCameraFolder = folder.addFolder("Camera");

                        lightSetting.shadow = {
                            camera: {
                                top: child.shadow.camera.top,
                                left: child.shadow.camera.left,
                                right: child.shadow.camera.right,
                                bottom: child.shadow.camera.bottom,
                            },
                            mapSizeX: child.shadow.mapSize.x,
                            mapSizeY: child.shadow.mapSize.y,
                            bias: child.shadow.bias,
                            radius: child.shadow.radius,
                        };

                        // shadowCameraFolder.add(lightSetting.shadow.camera, "top", -50, 50, 0.1).onChange((val) => {
                        //     child.shadow.camera.top = val;
                        //     child.shadow.camera.updateProjectionMatrix();
                        // });
                        // shadowCameraFolder.add(lightSetting.shadow.camera, "left", -50, 50, 0.1).onChange((val) => {
                        //     child.shadow.camera.left = val;
                        //     child.shadow.camera.updateProjectionMatrix();
                        // });
                        // shadowCameraFolder.add(lightSetting.shadow.camera, "right", -50, 50, 0.1).onChange((val) => {
                        //     child.shadow.camera.right = val;
                        //     child.shadow.camera.updateProjectionMatrix();
                        // });
                        // shadowCameraFolder.add(lightSetting.shadow.camera, "bottom", -50, 50, 0.1).onChange((val) => {
                        //     child.shadow.camera.bottom = val;
                        //     child.shadow.camera.updateProjectionMatrix();
                        // });
                        shadowFolder.add(lightSetting.shadow, "mapSizeX", 0, 4096, 1).onChange((val) => {
                            child.shadow.mapSize.x = val;
                            child.shadow.camera.updateProjectionMatrix();
                        });
                        shadowFolder.add(lightSetting.shadow, "mapSizeY", 0, 4096, 1).onChange((val) => {
                            child.shadow.mapSize.y = val;
                            child.shadow.camera.updateProjectionMatrix();
                        });
                        shadowFolder.add(lightSetting.shadow, "bias", -0.001, 0.001, 0.0001).onChange((val) => {
                            child.shadow.bias = val;
                            child.shadow.camera.updateProjectionMatrix();
                        });
                        shadowFolder.add(lightSetting.shadow, "radius", 0, 10, 0.1).onChange((val) => {
                            child.shadow.radius = val;
                            child.shadow.camera.updateProjectionMatrix();
                        });
                    }
                    if (child.type == "PointLight") {
                        let shadowFolder = folder.addFolder("Shadow");

                        lightSetting.distance = child.distance;
                        lightSetting.decay = child.decay;

                        lightSetting.shadow = {
                            // cameraFar: child.shadow.camera.far,
                            bias: child.shadow.bias,
                            radius: child.shadow.radius,
                        };

                        folder.add(lightSetting, "distance", 0, 1000, 0.1).onChange((val) => {
                            child.distance = val;
                        });
                        folder.add(lightSetting, "decay", 0, 5, 0.1).onChange((val) => {
                            child.decay = val;
                        });
                        // shadowFolder.add(lightSetting.shadow, "cameraFar", 1, 2048, 0.1).onChange((val) => {
                        //     child.shadow.camera.far = val;
                        //     child.shadow.camera.updateProjectionMatrix();
                        // });
                        shadowFolder.add(lightSetting.shadow, "bias", -0.001, 0.001, 0.0001).onChange((val) => {
                            child.shadow.bias = val;
                            child.shadow.camera.updateProjectionMatrix();
                        });
                        shadowFolder.add(lightSetting.shadow, "radius", 0, 10, 0.1).onChange((val) => {
                            child.shadow.radius = val;
                            child.shadow.camera.updateProjectionMatrix();
                        });
                    }
                }

                folder.add(lightSetting, "remove");
            }
        });

        // this.lightCameraHelper.forEach((helper) => {
        //     this.scene.add(helper);
        // });
        // this.lightHelper.forEach((helper) => {
        //     this.scene.add(helper);
        // });

        // gui.close();
    }

    async addLightGUI(child) {
        if (child.name == "lightTarget") {
            let folder = this.guiLight.addFolder(child.name);

            folder.add(child.position, "x", -300, 300, 0.1).onChange((val) => {
                child.position.x = val;
                child.updateMatrixWorld(true);
            });
            folder.add(child.position, "y", -300, 300, 0.1).onChange((val) => {
                child.position.y = val;
                child.updateMatrixWorld(true);
            });
            folder.add(child.position, "z", -300, 300, 0.1).onChange((val) => {
                child.position.z = val;
                child.updateMatrixWorld(true);
            });
        }
        if (child.type == "AmbientLight" || child.type == "DirectionalLight" || child.type == "PointLight") {
            let folder = this.guiLight.addFolder(child.name);
            let scene = this.scene;
            let lightList = this.lights;

            let lightSetting = {
                lightColor: child.color.getHex(),
                intensity: child.intensity,
                castShadow: child.castShadow,
                receiveShadow: child.receiveShadow,
                visible: child.visible,
                position: {
                    VectorX: child.position.x,
                    VectorY: child.position.y,
                    VectorZ: child.position.z,
                },
                remove: function() {
                    lightList.forEach((light, index) => {
                        if (light.name == child.name) {
                            lightList.splice(index, 1);
                        }
                    });
                    scene.remove(child);
                    folder.destroy();
                },
            };

            folder.addColor(lightSetting, "lightColor").onChange((val) => {
                child.color.setHex(val);
            });
            folder.add(lightSetting, "intensity", 0, 2).onChange((val) => {
                child.intensity = val;
            });
            folder.add(lightSetting, "visible").onChange((val) => {
                child.visible = val;
            });

            if (child.type != "AmbientLight") {
                if (child.type == "DirectionalLight") this.lightHelper.push(new THREE.DirectionalLightHelper(child));
                if (child.type == "PointLight") this.lightHelper.push(new THREE.PointLightHelper(child));

                folder.add(lightSetting, "castShadow").onChange((val) => {
                    child.castShadow = val;
                    child.updateMatrixWorld(true);
                });
                // folder.add(lightSetting, "receiveShadow").onChange((val) => {
                //     child.receiveShadow = val;
                //     child.updateMatrixWorld(true);
                // });

                let positionFolder = folder.addFolder("Position");

                positionFolder.add(lightSetting.position, "VectorX", -300, 300, 0.1).onChange((val) => {
                    child.position.x = val;
                    child.position.setLength(200);
                    child.updateMatrixWorld(true);
                });
                positionFolder.add(lightSetting.position, "VectorY", -300, 300, 0.1).onChange((val) => {
                    child.position.y = val;
                    child.position.setLength(200);
                    child.updateMatrixWorld(true);
                });
                positionFolder.add(lightSetting.position, "VectorZ", -300, 300, 0.1).onChange((val) => {
                    child.position.z = val;
                    child.position.setLength(200);
                    child.updateMatrixWorld(true);
                });

                // this.lightCameraHelper.push(new THREE.CameraHelper(child.shadow.camera));

                if (child.type == "DirectionalLight") {
                    let shadowFolder = folder.addFolder("Shadow");
                    // let shadowCameraFolder = folder.addFolder("Camera");

                    lightSetting.shadow = {
                        camera: {
                            top: child.shadow.camera.top,
                            left: child.shadow.camera.left,
                            right: child.shadow.camera.right,
                            bottom: child.shadow.camera.bottom,
                        },
                        mapSizeX: child.shadow.mapSize.x,
                        mapSizeY: child.shadow.mapSize.y,
                        bias: child.shadow.bias,
                        radius: child.shadow.radius,
                    };

                    // shadowCameraFolder.add(lightSetting.shadow.camera, "top", -50, 50, 0.1).onChange((val) => {
                    //     child.shadow.camera.top = val;
                    //     child.shadow.camera.updateProjectionMatrix();
                    // });
                    // shadowCameraFolder.add(lightSetting.shadow.camera, "left", -50, 50, 0.1).onChange((val) => {
                    //     child.shadow.camera.left = val;
                    //     child.shadow.camera.updateProjectionMatrix();
                    // });
                    // shadowCameraFolder.add(lightSetting.shadow.camera, "right", -50, 50, 0.1).onChange((val) => {
                    //     child.shadow.camera.right = val;
                    //     child.shadow.camera.updateProjectionMatrix();
                    // });
                    // shadowCameraFolder.add(lightSetting.shadow.camera, "bottom", -50, 50, 0.1).onChange((val) => {
                    //     child.shadow.camera.bottom = val;
                    //     child.shadow.camera.updateProjectionMatrix();
                    // });
                    shadowFolder.add(lightSetting.shadow, "mapSizeX", 0, 4096, 1).onChange((val) => {
                        child.shadow.mapSize.x = val;
                        child.shadow.camera.updateProjectionMatrix();
                    });
                    shadowFolder.add(lightSetting.shadow, "mapSizeY", 0, 4096, 1).onChange((val) => {
                        child.shadow.mapSize.y = val;
                        child.shadow.camera.updateProjectionMatrix();
                    });
                    shadowFolder.add(lightSetting.shadow, "bias", -0.001, 0.001, 0.0001).onChange((val) => {
                        child.shadow.bias = val;
                        child.shadow.camera.updateProjectionMatrix();
                    });
                    shadowFolder.add(lightSetting.shadow, "radius", 0, 10, 0.1).onChange((val) => {
                        child.shadow.radius = val;
                        child.shadow.camera.updateProjectionMatrix();
                    });
                }
                if (child.type == "PointLight") {
                    let shadowFolder = folder.addFolder("Shadow");

                    lightSetting.distance = child.distance;
                    lightSetting.decay = child.decay;

                    lightSetting.shadow = {
                        // cameraFar: child.shadow.camera.far,
                        bias: child.shadow.bias,
                        radius: child.shadow.radius,
                    };

                    folder.add(lightSetting, "distance", 0, 1000, 0.1).onChange((val) => {
                        child.distance = val;
                    });
                    folder.add(lightSetting, "decay", 0, 5, 0.1).onChange((val) => {
                        child.decay = val;
                    });
                    // shadowFolder.add(lightSetting.shadow, "cameraFar", 1, 2048, 0.1).onChange((val) => {
                    //     child.shadow.camera.far = val;
                    //     child.shadow.camera.updateProjectionMatrix();
                    // });
                    shadowFolder.add(lightSetting.shadow, "bias", -0.001, 0.001, 0.0001).onChange((val) => {
                        child.shadow.bias = val;
                        child.shadow.camera.updateProjectionMatrix();
                    });
                    shadowFolder.add(lightSetting.shadow, "radius", 0, 10, 0.1).onChange((val) => {
                        child.shadow.radius = val;
                        child.shadow.camera.updateProjectionMatrix();
                    });
                }
            }

            folder.add(lightSetting, "remove");
        }
    }
}

export { LightsSetting };
