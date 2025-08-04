class JSONStructure {
    constructor() {
        this._3_idleStructure = {
            definition: "",
            word_meaning: "*애니(25209_G_기본이되는동작)",
            wAttribute: 12,
            wExit_Time: -1,
            wSpeed: [],
            wTransition_Duration: -1,
            wTransition_Offset: -1,
            id: -1,
            word: "*애니(25209_G_기본이되는동작)",
            type: 1,
            sl_composition: {
                Total_Speed: 1,
                data: [
                    {
                        Exit_Time: 65,
                        Speed: [1],
                        Transition_Duration: 0.3,
                        Transition_Offset: -1,
                        ani_id: 25209,
                        ani_name: "25209_G_기본이되는동작",
                        attribute: 2,
                        origin_info: " ",
                        selected_word: "기본이되는동작",
                        variable_id: -1,
                        variable_type: -1,
                        parentIndex: 0,
                        pauseStartDuration: 0,
                        pauseEndDuration: 0,
                        speed: [1],
                    },
                ],
                tag: [],
            },
        };

        this._4_idleStructure = {
            id: -1,
            gloss: "Idle",
            type: 1,
            subType: -1,
            handAttribute: 1,
            processingMethod: -1,
            variableId: -1,
            animations: [
                {
                    id: 25209,
                    componentName: "기본이되는동작",
                    attribute: 1,
                    components: [
                        {
                            id: 25209,
                            filename: "25209_G_기본이되는동작.eq4",
                            filepath: "/Adam/Idle/",
                            animationName: "기본이되는동작",
                        },
                    ],
                },
            ],
        };
    }
}

export { JSONStructure };
