/**
 * @author madblade
 * @author takahiro (Takahiro Aoyagi / Fujitsu)
 * adapted from https://github.com/mrdoob/three.js/blob/master/examples/jsm/animation/CCDIKSolver.js
 * and https://sites.google.com/site/auraliusproject/ccd-algorithm
 * MIT license.
 */

import { Quaternion, Vector3 } from "three";

function CCD() {
    this.q = new Quaternion();
    this.targetVec = new Vector3();
    this.effectorPos = new Vector3();
    this.effectorVec = new Vector3();
    this.linkPos = new Vector3();
    this.invLinkQ = new Quaternion();
    this.linkScale = new Vector3();
    this.axis = new Vector3();
    this.vector = new Vector3();

    // Fingerspell Angles
    this.prevForeArmAngle = null;
    this.prevArmAngle = null;
    this.prevShoulderAngle = null;
}

const SMALL_ANGLE = 1e-5;
const SMALL_DISTANCE = 1e-5;

CCD.prototype.solve = function (
    chain,
    targetPoint,
    iterations,
    constraints,
    activateConstraints,
    isFingerSpell,
    weight,
    isBlending
) {
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
        if (isFingerSpell) {
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
        } else {
            let rotated = this.iterate(
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
    }
};

CCD.prototype.iterateFingerspell = function (
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
    let math = Math; // reference overhead reduction in loop
    // perf/don’t reallocate at every pass
    let q = this.q;
    let targetVec = this.targetVec;
    let effectorPos = this.effectorPos;
    let effectorVec = this.effectorVec;
    let linkPos = this.linkPos;
    let invLinkQ = this.invLinkQ;
    let linkScale = this.linkScale;
    let axis = this.axis;
    let vector = this.vector;

    let rotated = false;

    // From end effector to base
    const kl = links.length;
    let _effectorQ = new Quaternion();

    for (let k = 0; k < kl; k++) {
        const id = links[k].id;
        // if (id !== k) throw Error('Please specify all links in the constraints array.');
        let link = bones[id];

        // Skip this link and following links.
        // (this skip can be used for performance optimization)
        if (links[k].enabled === false) break;

        let limitation = links[k].limitation;
        let rotationMin = links[k].rotationMin;
        let rotationMax = links[k].rotationMax;

        // if (k == 0) {
        //     link.position.add(new Vector3(-1, 0, 0));
        //     link.updateMatrixWorld(true);
        // }

        // Don't use getWorldPosition/Quaternion() here for the performance
        // because they call updateMatrixWorld(true) inside.
        link.matrixWorld.decompose(linkPos, invLinkQ, linkScale);
        invLinkQ.invert();
        effectorPos.setFromMatrixPosition(effector.matrixWorld);

        // Check distance from target
        // let distance = effectorPos.distanceTo(targetPoint);
        // if (distance < SMALL_DISTANCE) break;

        // Work in link world.
        effectorVec.subVectors(effectorPos, linkPos);
        effectorVec.applyQuaternion(invLinkQ);
        effectorVec.normalize();

        targetVec.subVectors(targetPos, linkPos);
        targetVec.applyQuaternion(invLinkQ);
        targetVec.normalize();

        let angle = targetVec.dot(effectorVec);

        if (angle > 1.0) angle = 1.0;
        else if (angle < -1.0) angle = -1.0;

        angle = math.acos(angle);

        // Skip if changing angle is too small to prevent bone vibration.
        if (angle < SMALL_ANGLE) continue;

        if (ik.minAngle !== undefined && angle < ik.minAngle) angle = ik.minAngle;
        if (ik.maxAngle !== undefined && angle > ik.maxAngle) angle = ik.maxAngle;

        axis.crossVectors(effectorVec, targetVec);
        axis.normalize();

        if (k == 0 && this.prevForeArmAngle !== null && isBlending) {
            // angle = this.prevForeArmAngle + ((angle - this.prevForeArmAngle) * weight);
        } else if (k == 1 && this.prevArmAngle !== null && isBlending) {
            // angle = this.prevArmAngle + (angle - this.prevArmAngle) * weight;
        } else if (k == 2 && this.prevArmAngle !== null && isBlending) {
            // angle = this.prevShoulderAngle + (angle - this.prevShoulderAngle) * weight;
        } else if (weight !== null) {
            angle = angle * weight;
        }

        // Apply.
        q.setFromAxisAngle(axis, angle);
        link.quaternion.multiply(q);

        if (k == 0 || k == 1) {
            _effectorQ = new Quaternion();
            _effectorQ.setFromAxisAngle(axis, -angle);
            effector.quaternion.premultiply(_effectorQ);
        }

        if (activateConstraints && limitation !== undefined) {
            let c = link.quaternion.w;
            if (c > 1.0) c = 1.0;
            let c2 = math.sqrt(1 - c * c);
            link.quaternion.set(limitation.x * c2, limitation.y * c2, limitation.z * c2, c);
        }

        // ? softify at min/max
        if (activateConstraints && rotationMin !== undefined)
            link.rotation.setFromVector3(vector.setFromEuler(link.rotation).max(rotationMin));
        if (activateConstraints && rotationMax !== undefined)
            link.rotation.setFromVector3(vector.setFromEuler(link.rotation).min(rotationMax));

        if (k == 0) {
            this.prevForeArmAngle = angle;
        } else if (k == 1) {
            this.prevArmAngle = angle;
        } else if (k == 2) {
            this.prevShoulderAngle = angle;
        }

        link.updateMatrixWorld(true);
        rotated = true;
    }
    return rotated;
};

CCD.prototype.iterate = function (
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
    let math = Math; // reference overhead reduction in loop
    // perf/don’t reallocate at every pass
    let q = this.q;
    let targetVec = this.targetVec;
    let effectorPos = this.effectorPos;
    let effectorVec = this.effectorVec;
    let linkPos = this.linkPos;
    let invLinkQ = this.invLinkQ;
    let linkScale = this.linkScale;
    let axis = this.axis;
    let vector = this.vector;

    let rotated = false;

    // From end effector to base
    const kl = links.length;
    for (let k = kl - 1; k >= 0; --k) {
        let _effectorQ = new Quaternion();
        const id = links[k].id;
        // if (id !== k) throw Error('Please specify all links in the constraints array.');
        let link = bones[id];

        // Skip this link and following links.
        // (this skip can be used for performance optimization)
        if (links[k].enabled === false) break;

        let limitation = links[k].limitation;
        let rotationMin = links[k].rotationMin;
        let rotationMax = links[k].rotationMax;

        // Don't use getWorldPosition/Quaternion() here for the performance
        // because they call updateMatrixWorld(true) inside.
        link.matrixWorld.decompose(linkPos, invLinkQ, linkScale);
        invLinkQ.invert();
        effectorPos.setFromMatrixPosition(effector.matrixWorld);

        // Check distance from target
        let distance = effectorPos.distanceTo(targetPoint);
        if (distance < SMALL_DISTANCE) break;

        // Work in link world.
        effectorVec.subVectors(effectorPos, linkPos);
        effectorVec.applyQuaternion(invLinkQ);
        effectorVec.normalize();

        targetVec.subVectors(targetPos, linkPos);
        targetVec.applyQuaternion(invLinkQ);
        targetVec.normalize();

        let angle = targetVec.dot(effectorVec);
        if (angle > 1.0) angle = 1.0;
        else if (angle < -1.0) angle = -1.0;
        angle = math.acos(angle);

        // Skip if changing angle is too small to prevent bone vibration.
        if (angle < SMALL_ANGLE) continue;
        if (ik.minAngle !== undefined && angle < ik.minAngle) angle = ik.minAngle;
        if (ik.maxAngle !== undefined && angle > ik.maxAngle) angle = ik.maxAngle;
        axis.crossVectors(effectorVec, targetVec);
        axis.normalize();

        if (isFingerSpell) {
            if (k == 0 && this.prevForeArmAngle !== null && isBlending) {
                // angle = this.prevForeArmAngle + ((angle - this.prevForeArmAngle) * weight);
            } else if (k == 1 && this.prevArmAngle !== null && isBlending) {
                // angle = this.prevArmAngle + (angle - this.prevArmAngle) * weight;
            } else if (k == 2 && this.prevArmAngle !== null && isBlending) {
                // angle = this.prevShoulderAngle + (angle - this.prevShoulderAngle) * weight;
            } else if (weight !== null) {
                angle = angle * weight;
            }
        }

        // Apply.
        q.setFromAxisAngle(axis, angle);
        let qq = new Quaternion();
        qq.copy(link.quaternion).multiply(q);
        link.quaternion.multiply(q);
        // ? think about this slerp function.
        link.quaternion.slerp(qq, 0.05);

        if (isFingerSpell) {
            if (k == 0) {
                _effectorQ = new Quaternion();
                _effectorQ.setFromAxisAngle(axis, -angle / 2);
                effector.quaternion.premultiply(_effectorQ);
            }
        }

        if (activateConstraints && limitation !== undefined) {
            let c = link.quaternion.w;
            if (c > 1.0) c = 1.0;
            let c2 = math.sqrt(1 - c * c);
            link.quaternion.set(limitation.x * c2, limitation.y * c2, limitation.z * c2, c);
        }

        // ? softify at min/max
        if (activateConstraints && rotationMin !== undefined)
            link.rotation.setFromVector3(vector.setFromEuler(link.rotation).max(rotationMin));
        if (activateConstraints && rotationMax !== undefined)
            link.rotation.setFromVector3(vector.setFromEuler(link.rotation).min(rotationMax));

        if (isFingerSpell) {
            if (k == 0) {
                this.prevForeArmAngle = angle;
            } else if (k == 1) {
                this.prevArmAngle = angle;
            } else if (k == 2) {
                this.prevShoulderAngle = angle;
            }
        }

        link.updateMatrixWorld(true);
        rotated = true;
    }
    return rotated;
};

export { CCD };
