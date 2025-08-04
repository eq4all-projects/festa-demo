import { CCD } from "./CCD";
import { FABRIK } from "./FABRIK";
import { CustomizingIK } from "./CustomizingIK";

const Solver = {
    CCD: "CCD",
    FABRIK: "FABRIK",
    CUSTOM: "CUSTOM",
};

/**
 *  IK 계산을 위한 실제 Solver를 연결한다.
 */
class IKSolver {
    constructor() {
        this.ccdSolver = new CCD();
        this.fabrikSolver = new FABRIK();
        this.customizingIKSolver = new CustomizingIK();
    }

    solve(solver, chain, target, iterations, constraints, activateConstraints, isFingerSpell, weight, isBlending) {
        switch (solver) {
            case Solver.CCD:
                this.ccdSolver.solve(
                    chain,
                    target,
                    iterations,
                    constraints,
                    activateConstraints,
                    isFingerSpell,
                    weight,
                    isBlending
                );
                break;
            case Solver.FABRIK:
                this.fabrikSolver.solve(chain, target, iterations, constraints, activateConstraints);
            case Solver.CUSTOM:
                this.customizingIKSolver.solve(
                    chain,
                    target,
                    iterations,
                    constraints,
                    activateConstraints,
                    isFingerSpell,
                    weight,
                    isBlending
                );
                break;
        }
    }
}

export { IKSolver, Solver };
