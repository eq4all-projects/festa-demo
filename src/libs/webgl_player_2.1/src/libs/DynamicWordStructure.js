class DynamicWordStructure {
    constructor(dynamicWord) {
        this.dynamicWord = dynamicWord;
        this.aniData = {
            id: "",
            components: [],
            attribute: dynamicWord.id,
            componentName: dynamicWord.componentName,
            default_finger_spell_type: dynamicWord.default_finger_spell_type,
            hand_attribute: dynamicWord.hand_attribute,
            is_created: true,
        };
    }
    async makeStructure() {
        if (this.dynamicWord.suffix !== null) {
            // this.aniData.componentName = `${this.dynamicWord.suffix}${this.aniData.componentName}`;

            this.aniData.suffix_component = this.dynamicWord.suffix_animations;
            this.aniData.affix = this.dynamicWord.suffix;
            this.aniData.affix_type = "suffix";
        } else if (this.dynamicWord.prefix !== null) {
            // this.aniData.componentName = `${this.dynamicWord.prefix}${this.aniData.componentName}`;
            this.aniData.prefix_component = this.dynamicWord.prefix_animations;
            this.aniData.affix = this.dynamicWord.prefix;
            this.aniData.affix_type = "prefix";
        } else if (this.dynamicWord.breakpoint !== null) {
            this.aniData.breakpoint_component = this.dynamicWord.breakpoint_component;
            this.aniData.affix = this.dynamicWord.breakpoint;
            this.aniData.affix_type = "breakpoint";
        }
        // else if (this.dynamicWord.prefix === null && this.dynamicWord.suffix === null && this.dynamicWord.breakpoint === null) {
        // if (this.dynamicWord.id === 19) {
        //     this.aniData.default_finger_spell_type = this.dynamicWord.default_finger_spell_type;
        //     this.aniData.hand_attribute = this.dynamicWord.hand_attribute;
        //     this.aniData.is_created = true;
        // }
        // }

        return this.aniData;
    }
}

export { DynamicWordStructure };
