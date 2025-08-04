import * as _ from "lodash";

import { Matrix4, Quaternion, Vector3 } from "three";

class CustomizingIK {
    constructor() {
        // Fingerspell Angles
        this.prevForeArmAngle = null;
        this.prevArmAngle = null;
        this.prevShoulderAngle = null;

        this.SMALL_ANGLE = 1e-5;
        this.SMALL_DISTANCE = 1e-5;

        this.interpolationTimer = 0;
        this.chestInterpolationTimer = 0;
        this.spineAxisChange = false;
    }

    solve(chain, targetPoint, iterations, constraints, activateConstraints, isFingerSpell, weight, isBlending) {
        let bones = chain; // skeleton.bones;
        let nbIterations = iterations !== undefined ? iterations : 1;

        let ik = constraints;

        let effector = bones[ik.effector];
        // let target = bones[ik.target];
        // don't use getWorldPosition() here for the performance
        // because it calls updateMatrixWorld( true ) inside.
        // targetPos.setFromMatrixPosition(target.matrixWorld);
        let targetPos = targetPoint;
        let links = ik.links;
        for (let j = 0; j < nbIterations; j++) {
            let rotated = this.iterateFingerspell(
                links,
                bones,
                ik,
                effector,
                targetPoint,
                targetPos,
                activateConstraints,
                isFingerSpell,
                weight,
                isBlending
            );

            if (!rotated) break;
        }

        // const shoulderRange = 0.0005; // 어깨 흔들림 범위 (라디안)
        // const chestRange = 0.0007;
        // const spineRange = 0.001;
        // const interpolationDuration = 3; // 보간 지속 시간 (초)
        // const chestInterpolationDuration = 3.2; // 보간 지속 시간 (초)

        // const t = this.interpolationTimer / interpolationDuration;
        // const chestT = this.chestInterpolationTimer / chestInterpolationDuration;

        // const rightArm = _.findIndex(bones, function (bone) {
        //     return bone.name === "RightArm";
        // });
        // const leftShoulder = _.findIndex(bones, function (bone) {
        //     return bone.name === "LeftShoulder";
        // });
        // const chest = _.findIndex(bones, function (bone) {
        //     return bone.name === "Chest";
        // });
        // const spine = _.findIndex(bones, function (bone) {
        //     return bone.name === "Spine";
        // });

        // let leftShoulderPos = new Vector3();
        // leftShoulderPos.setFromMatrixPosition(bones[leftShoulder].matrixWorld).normalize();
        // let chestPos = new Vector3();
        // chestPos.setFromMatrixPosition(bones[chest].matrixWorld).normalize();

        // const leftShoulderRotation = new Quaternion().setFromAxisAngle(
        //     leftShoulderPos,
        //     -shoulderRange * Math.sin(t * 2 * Math.PI)
        // );
        // const chestRotation = new Quaternion().setFromAxisAngle(
        //     new Vector3(0, 0, 1),
        //     -chestRange * Math.sin(chestT * 2 * Math.PI)
        // );

        // let spineT = chestT;
        // if (chestT === 0) {
        //     this.spineAxisChange = !this.spineAxisChange;
        // }
        // if (this.spineAxisChange) {
        //     spineT = -spineT;
        // }
        // const spineRotation = new Quaternion().setFromAxisAngle(
        //     new Vector3(1, 0, 0),
        //     spineRange * Math.sin(spineT * 2 * Math.PI)
        // );

        // Spine
        // bones[chest].quaternion.multiply(chestRotation);
        // bones[spine].quaternion.multiply(spineRotation);

        // this.interpolationTimer += 1 / 60;
        // if (this.interpolationTimer > interpolationDuration) {
        //     this.interpolationTimer = 0;
        // }

        // this.chestInterpolationTimer += 1 / 60;
        // if (this.chestInterpolationTimer > chestInterpolationDuration) {
        //     this.chestInterpolationTimer = 0;
        // }
    }

    iterateFingerspell(
        links,
        bones,
        ik,
        effector,
        targetPoint,
        targetPos,
        activateConstraints,
        isFingerSpell,
        weight,
        isBlending
    ) {
        let q = new Quaternion();

        let targetVec = new Vector3();

        let handPos = new Vector3();
        let handVec = new Vector3();
        let handQ = new Quaternion();

        let foreArmPos = new Vector3();
        let invForeArmQ = new Quaternion();
        let foreArmScale = new Vector3();

        let armPos = new Vector3();
        let invArmQ = new Quaternion();
        let armScale = new Vector3();

        let shoulderPos = new Vector3();
        let invShoulderQ = new Quaternion();
        let shoulderScale = new Vector3();

        // let upperChestPos = new Vector3();
        // let invUpperChestQ = new Quaternion();
        // let upperChestScale = new Vector3();

        let axis = new Vector3();
        let vector = new Vector3();
        let angle = 0;
        let distance = 0;

        let shoulderRotationMin = links[2].rotationMin;
        let shoulderRotationMax = links[2].rotationMax;

        // let upperChestRotationMin = links[3].rotationMin;
        // let upperChestRotationMax = links[3].rotationMax;

        let rotated = false;

        const foreArmID = links[0].id;
        const foreArm = bones[foreArmID];

        const armID = links[1].id;
        const arm = bones[armID];

        const shoulderID = links[2].id;
        const shoulder = bones[shoulderID];

        // const upperChestID = links[3].id;
        // const upperChest = bones[upperChestID];

        // Calc ForeArm
        foreArm.matrixWorld.decompose(foreArmPos, invForeArmQ, foreArmScale);
        invForeArmQ.invert();

        handPos.setFromMatrixPosition(effector.matrixWorld);

        distance = handPos.distanceTo(targetPos);
        if (distance < this.SMALL_DISTANCE) return;

        handVec.subVectors(handPos, foreArmPos);
        handVec.applyQuaternion(invForeArmQ);
        handVec.normalize();

        targetVec.subVectors(targetPos, foreArmPos);
        targetVec.applyQuaternion(invForeArmQ);
        targetVec.normalize();

        angle = targetVec.dot(handVec);

        if (angle > 1.0) angle = 1.0;
        else if (angle < -1.0) angle = -1.0;

        angle = Math.acos(angle);

        if (angle >= this.SMALL_ANGLE) {
            if (ik.minAngle !== undefined && angle < ik.minAngle) angle = ik.minAngle;
            if (ik.maxAngle !== undefined && angle > ik.maxAngle) angle = ik.maxAngle;

            axis.crossVectors(handVec, targetVec);
            axis.normalize();

            q.setFromAxisAngle(axis, angle);
            foreArm.quaternion.multiply(q);

            effector.quaternion.premultiply(q.invert());

            foreArm.updateMatrixWorld(true);
            effector.updateMatrixWorld(true);
        }

        // Calc Arm
        arm.matrixWorld.decompose(armPos, invArmQ, armScale);

        invArmQ.invert();

        handPos.setFromMatrixPosition(effector.matrixWorld);

        distance = handPos.distanceTo(targetPos);
        if (distance < this.SMALL_DISTANCE) return;

        handVec.subVectors(handPos, armPos);
        handVec.applyQuaternion(invArmQ);
        handVec.normalize();

        targetVec.subVectors(targetPos, armPos);
        targetVec.applyQuaternion(invArmQ);
        targetVec.normalize();

        angle = targetVec.dot(handVec);

        if (angle > 1.0) angle = 1.0;
        else if (angle < -1.0) angle = -1.0;

        angle = Math.acos(angle);

        if (angle >= this.SMALL_ANGLE) {
            if (ik.minAngle !== undefined && angle < ik.minAngle) angle = ik.minAngle;
            if (ik.maxAngle !== undefined && angle > ik.maxAngle) angle = ik.maxAngle;

            axis.crossVectors(handVec, targetVec);
            axis.normalize();

            q.setFromAxisAngle(axis, angle);
            arm.quaternion.multiply(q);

            effector.quaternion.premultiply(q.invert());

            arm.updateMatrixWorld(true);
            effector.updateMatrixWorld(true);
        }

        // Calc Shoulder
        // shoulder.matrixWorld.decompose(shoulderPos, invShoulderQ, shoulderScale);

        // invShoulderQ.invert();

        // handPos.setFromMatrixPosition(effector.matrixWorld);

        // distance = handPos.distanceTo(targetPos);
        // if (distance < this.SMALL_DISTANCE) return;

        // handVec.subVectors(handPos, shoulderPos);
        // handVec.applyQuaternion(invShoulderQ);
        // handVec.normalize();

        // targetVec.subVectors(targetPos, shoulderPos);
        // targetVec.applyQuaternion(invShoulderQ);
        // targetVec.normalize();

        // angle = targetVec.dot(handVec);

        // if (angle > 1.0) angle = 1.0;
        // else if (angle < -1.0) angle = -1.0;

        // angle = Math.acos(angle);

        // if (angle >= this.SMALL_ANGLE) {
        //     if (ik.minAngle !== undefined && angle < ik.minAngle) angle = ik.minAngle;
        //     if (ik.maxAngle !== undefined && angle > ik.maxAngle) angle = ik.maxAngle;

        //     if (shoulderRotationMin !== undefined)
        //         shoulder.rotation.setFromVector3(vector.setFromEuler(shoulder.rotation).max(shoulderRotationMin));
        //     if (shoulderRotationMax !== undefined)
        //         shoulder.rotation.setFromVector3(vector.setFromEuler(shoulder.rotation).min(shoulderRotationMax));

        //     axis.crossVectors(handVec, targetVec);
        //     axis.normalize();

        //     q.setFromAxisAngle(axis, angle);
        //     shoulder.quaternion.multiply(q);

        //     effector.quaternion.premultiply(q.invert());

        //     shoulder.updateMatrixWorld(true);
        //     effector.updateMatrixWorld(true);
        // }

        shoulder.updateMatrixWorld(true);

        // Calc Upper Chest
        // upperChest.matrixWorld.decompose(upperChestPos, invUpperChestQ, upperChestScale);

        // invUpperChestQ.invert();

        // handPos.setFromMatrixPosition(effector.matrixWorld);

        // distance = handPos.distanceTo(targetPos);
        // if (distance < this.SMALL_DISTANCE) return;

        // handVec.subVectors(handPos, upperChestPos);
        // handVec.applyQuaternion(invUpperChestQ);
        // handVec.normalize();

        // targetVec.subVectors(targetPos, upperChestPos);
        // targetVec.applyQuaternion(invUpperChestQ);
        // targetVec.normalize();

        // angle = targetVec.dot(handVec);

        // if (angle > 1.0) angle = 1.0;
        // else if (angle < -1.0) angle = -1.0;

        // angle = Math.acos(angle);

        // if (angle >= this.SMALL_ANGLE) {
        //     if (ik.minAngle !== undefined && angle < ik.minAngle) angle = ik.minAngle;
        //     if (ik.maxAngle !== undefined && angle > ik.maxAngle) angle = ik.maxAngle;

        //     if (upperChestRotationMin !== undefined)
        //         upperChest.rotation.setFromVector3(vector.setFromEuler(upperChest.rotation).max(upperChestRotationMin));
        //     if (upperChestRotationMax !== undefined)
        //         upperChest.rotation.setFromVector3(vector.setFromEuler(upperChest.rotation).min(upperChestRotationMax));

        //     axis.crossVectors(handVec, targetVec);
        //     axis.normalize();

        //     q.setFromAxisAngle(axis, angle);
        //     upperChest.quaternion.multiply(q);

        //     effector.quaternion.premultiply(q.invert());

        //     upperChest.updateMatrixWorld(true);
        //     effector.updateMatrixWorld(true);
        // }

        rotated = true;

        return rotated;
    }
}

export { CustomizingIK };
