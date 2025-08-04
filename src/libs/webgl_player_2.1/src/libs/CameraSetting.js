import * as _ from "lodash";

import * as THREE from "three";
import { FBXLoader } from "./FBXLoader";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";

import { WebGLPlayerConfig } from "./WebGLPlayerConfig";
import { callAxios, apiDispatcher } from "./APIs";

/**
 *  Scene에 적용될 카메라 값을 설정한다. (CMS v2.0 Admin page)
 */
class CameraSetting {
    constructor(camera, controls, controlsTarget, system) {
        this.scene = scene;

        // Lights
        this.camera = camera;
        this.controls = controls;
        this.controlsTarget = controlsTarget;

        // Config
        this.system = system;
        this.config = new WebGLPlayerConfig(system);
    }

    async initGUICameraPosition() {
        let guiParent = window.document.getElementById("guiContainer");

        const gui = new GUI({ autoPlace: false, container: guiParent });
        this.guiLight = gui;

        let camera = this.camera;
        let controls = this.controls;
        let controlsTarget = this.controlsTarget;

        let cameraFolder = gui.addFolder("Camera");
        let controlsFolder = gui.addFolder("Controls");

        cameraFolder.add(camera.position, "x", -1000, 1000, 0.01).onChange((val) => {
            camera.position.x = val;
            camera.updateMatrixWorld(true);
        });
        cameraFolder.add(camera.position, "y", -1000, 1000, 0.01).onChange((val) => {
            camera.position.y = val;
            camera.updateMatrixWorld(true);
        });
        cameraFolder.add(camera.position, "z", -1000, 1000, 0.01).onChange((val) => {
            camera.position.z = val;
            camera.updateMatrixWorld(true);
        });

        controlsFolder.add(controlsTarget, "x", -1000, 1000, 0.01).onChange((val) => {
            controlsTarget.x = val;
            controls.target = controlsTarget;
            controls.update();
        });
        controlsFolder.add(controlsTarget, "y", -1000, 1000, 0.01).onChange((val) => {
            controlsTarget.y = val;
            controls.target = controlsTarget;
            controls.update();
        });
        controlsFolder.add(controlsTarget, "z", -1000, 1000, 0.01).onChange((val) => {
            controlsTarget.z = val;
            controls.target = controlsTarget;
            controls.update();
        });
    }
}

export { CameraSetting };
