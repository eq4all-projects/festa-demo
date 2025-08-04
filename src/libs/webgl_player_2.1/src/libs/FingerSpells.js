import * as _ from "lodash";

import { JSONStructure } from "./JSONStructure";
import { WebGLPlayerConfig } from "./WebGLPlayerConfig";
import { callAxios, apiDispatcher } from "./APIs";
import { DynamicWordStructure } from "./DynamicWordStructure";

class FingerSpells {
  constructor(version, system) {
    // Version
    this.protocolVersion = version;

    // Data
    this.jsonStructure = new JSONStructure();

    this.config = new WebGLPlayerConfig(system);
  }

  /**
   *  Protocol v0.3은 아래 Attribute 값에 따라 처리 방식을 나눈다.
   *
   *  Attribute
   *  -1 : None
   *  0 : Finger
   *  1 : Expression
   *  2 : Sign (Animation)
   *  3 : Reference
   *  4 : Emotion
   *  5 : Emoticon
   *  6 : All
   *  10 : Digit Number
   *  11 : Decimal
   *  12 : Animation
   *  13 : VariableIgnore
   *  14 : VaribleMap 지도
   *  15 : VariableImage 변수 텍스트 이미지 처리
   *  16 : VariableSign 변수 수어 처리
   *  17 : FingerNumber 지화+ 숫자
   *  18 : FingerCipher 지화+ 숫자(자릿수)
   *  20 : Blank
   */

  /**
   *  지화가 문장 처음이나 마지막에 올 경우 Idle 동작이 없으면 손이 튄다. 이를 해결하기 위해 문장 처음이나 마지막에 Idle을 추가한다.
   */
  async _3_SetFingerSpellIdle(sData) {
    try {
      if (
        sData[0].wAttribute === 0 ||
        sData[0].wAttribute === 10 ||
        sData[0].wAttribute === 11 ||
        sData[0].wAttribute === 16 ||
        sData[0].wAttribute === 17 ||
        sData[0].wAttribute === 18
      ) {
        sData.unshift(_.cloneDeep(this.jsonStructure._3_idleStructure));
      }
      if (
        sData[sData.length - 1].wAttribute === 0 ||
        sData[sData.length - 1].wAttribute === 10 ||
        sData[sData.length - 1].wAttribute === 11 ||
        sData[sData.length - 1].wAttribute === 16 ||
        sData[sData.length - 1].wAttribute === 17 ||
        sData[sData.length - 1].wAttribute === 18
      ) {
        sData.push(_.cloneDeep(this.jsonStructure._3_idleStructure));
      }

      return sData;
    } catch (e) {
      return [];
    }
  }

  async _4_SetFingerSpellIdle(sData) {
    // sData.unshift(_.cloneDeep(this.jsonStructure._4_idleStructure));
    // sData.push(_.cloneDeep(this.jsonStructure._4_idleStructure));
    return sData;
  }

  /**
   *  지화의 attribute 값과 형태 분석을 통해 해당하는 카테고리를 알아낸다.
   */
  async _3_SetFingerSpellAttribute(sData, dynamicVariables) {
    let englishCheck = /[a-zA-Z]/;

    _.map(sData, function (data) {
      let var_id = data.sl_composition.data[0].variable_id - 1;

      if (data.wAttribute === 0) {
        if (englishCheck.test(data.word)) {
          data.wAttribute = "English";
        } else {
          data.wAttribute = "Korean";
        }
      } else if (data.wAttribute === 10) {
        if (data.word.search("-") > -1) {
          data.wAttribute = "PhoneNumber";
        } else {
          data.wAttribute = "DigitNumber";
        }
      } else if (data.wAttribute === 11) {
        data.wAttribute = "Decimal";
      } else if (data.wAttribute === 16) {
        switch (data.sl_composition.data[0].variable_type) {
          case 86:
          case 94:
            data.variable = true;
            // data.wAttribute = "DigitNumber";
            // data.sl_composition.data[0].attribute = "DigitNumber";
            data.wAttribute = "Decimal";
            data.sl_composition.data[0].attribute = "Decimal";

            if (var_id > -1) {
              let replacedNum = dynamicVariables[var_id].replaceAll(",", "");
              data.sl_composition.data[0].selected_word = replacedNum;
              data.word = dynamicVariables[var_id];
            }
            break;
          case 87:
          case 95:
            data.variable = true;
            data.wAttribute = "Hours";
            data.sl_composition.data[0].attribute = "Hours";

            if (var_id > -1) {
              let replacedNum = dynamicVariables[var_id].replaceAll(",", "");
              data.sl_composition.data[0].selected_word = replacedNum;
              data.word = dynamicVariables[var_id];
            }
            break;
          case 88:
          case 96:
            data.variable = true;
            data.wAttribute = "Time";
            data.sl_composition.data[0].attribute = "Time";

            if (var_id > -1) {
              let replacedNum = dynamicVariables[var_id].replaceAll(",", "");
              data.sl_composition.data[0].selected_word = replacedNum;
              data.word = dynamicVariables[var_id];
            }
            break;
          case 89:
          case 97:
            data.variable = true;
            data.wAttribute = "Week";
            data.sl_composition.data[0].attribute = "Week";
            if (var_id > -1) {
              // let replacedNum = dynamicVariables[var_id].replaceAll(",", "");
              data.sl_composition.data[0].selected_word =
                dynamicVariables[var_id];
              data.word = dynamicVariables[var_id];
            }
            break;
          case 90:
          case 98:
            data.variable = true;
            data.wAttribute = "Month";
            data.sl_composition.data[0].attribute = "Month";
            if (var_id > -1) {
              let replacedNum = dynamicVariables[var_id].replaceAll(",", "");
              data.sl_composition.data[0].selected_word = replacedNum;
              data.word = dynamicVariables[var_id];
            }
            break;
          case 91:
          case 83:
            data.variable = true;
            data.wAttribute = "Date";
            data.sl_composition.data[0].attribute = "Date";
            if (var_id > -1) {
              // let replacedNum = dynamicVariables[var_id].replaceAll(",", "");
              data.sl_composition.data[0].selected_word =
                dynamicVariables[var_id];
              data.word = dynamicVariables[var_id];
            }
            break;
          case 92:
          case 93:
            // people
            data.variable = true;
            data.wAttribute = "People";
            data.sl_composition.data[0].attribute = "People";
            if (var_id > -1) {
              let replacedNum = dynamicVariables[var_id].replace(/[^0-9]/g, "");
              data.sl_composition.data[0].selected_word = replacedNum;
              data.word = dynamicVariables[var_id];
            }
            break;
        }
      } else if (data.wAttribute === 17) {
        data.wAttribute = "FingerDigitNumber";
      } else if (data.wAttribute === 18) {
        data.wAttribute = "FingerDecimal";
      }
    });

    return sData;
  }

  /**
   *  migration 된 지화 데이터가 비어있을 때 자동으로 생성될 수 있도록 입력
   */
  async _4_SetFingerSpellAttribute(sData, dynamicVariables) {
    await Promise.all(
      _.map(
        sData,
        async function (data, idx) {
          // 문장 자체에 변수가 존재할 경우
          if (data.type == 4) {
            // 문장 자체 변수가 Array로 전달되었을 경우
            if (dynamicVariables && dynamicVariables.length > 0) {
              data.gloss = dynamicVariables[parseInt(data.variableId) - 1];

              if (data.animations.length == 0) {
                data.animations.push({
                  attribute: data.subType,
                  componentName: data.gloss,
                  components: [],
                  idx: 1,
                  id: "",
                  dynamic: true,
                  is_created: true,
                });

                let resData = await this.SetDynamicWordAni(data);
                data.animations[0] = resData;
              } else {
                // data.animations[0] = {
                //     attribute: data.subType,
                //     componentName: data.gloss,
                //     components: [],
                //     idx: 1,
                //     id: "",
                //     dynamic: true,
                //     is_created: true,
                // };

                let resData = await this.SetDynamicWordAni(data);
                data.animations[0] = resData;
              }
            }
            // 문장 자체 변수가 존재하지만, 별도 Array가 전달되지 않았을 경우 ex) 블렌딩 페이지
            else {
              data.gloss = "변수";

              if (data.animations.length == 0) {
                data.animations.push({
                  attribute: data.subType,
                  componentName: data.gloss,
                  components: [],
                  idx: 1,
                  id: "",
                });

                data.animations[0].components.push({
                  Speed: 1,
                  Transition_Duration: 0.3,
                  Transition_Offset: 0,
                  Exit_Time: 100,
                  animationName: data.gloss,
                  filename: "25209.eq4",
                  filepath: "/Base/KSL/",
                  id: 25209,
                  dynamicDefault: true,
                });
              } else {
                data.animations[0].attribute = data.subType;
                data.animations[0].componentName = data.gloss;

                if (data.animations[0].components.length == 0) {
                  data.animations[0].components.push({
                    Speed: 1,
                    Transition_Duration: 0.3,
                    Transition_Offset: 0,
                    Exit_Time: 100,
                    animationName: data.gloss,
                    filename: "25209.eq4",
                    filepath: "/Base/KSL/",
                    id: 25209,
                    dynamicDefault: true,
                  });
                }
              }
            }
          }
          // 문장 자체 변수는 없고, 변수 타입만 사용되었을 경우
          else {
            if (data.type !== 1 && data.animations.length == 0) {
              data.animations.push({
                attribute: data.subType,
                componentName: data.gloss,
                components: [],
                idx: 1,
                id: "",
              });
            }
          }
        }.bind(this)
      )
    );
    console.log(sData);
    return sData;
  }

  async SetDynamicWordAni(data) {
    let apiDispatcherRes = await apiDispatcher(
      this.config.APIOrigin + this.config.getDynamicWord(data.subType),
      "GET"
    );
    let dynamicWord = apiDispatcherRes.data.results;
    dynamicWord.componentName = data.gloss;
    let dynamicWordStructure = new DynamicWordStructure(dynamicWord);
    let structure = await dynamicWordStructure.makeStructure();

    return structure;
  }

  /**
   *  wAttribute를 참조하여 각 지화의 Animation 정보를 설정하기 위한 진입 함수
   */
  async _3_SetFingerSpellAniData(sData, additiveAnimationsFile) {
    await Promise.all(
      _.map(
        sData,
        async function (data, idx) {
          switch (data.wAttribute) {
            case "Korean":
              data = await this.setFingerspellKorean(data);
              break;
            case "English":
              data = await this.setFingerspellEnglish(data);
              break;
            case "Decimal":
              // data = await this._3_setFingerspellDecimal(data);
              data = await this._3_setFingerspellDecimalUpdate(data);
              break;
            case "Hours":
              data = await this._3_setFingerspellHours(data);
              break;
            case "Time":
              data = await this._3_setFingerspellTime(
                data,
                idx,
                additiveAnimationsFile
              );
              break;
            case "Week":
              data = await this._3_setFingerspellWeek(data);
              break;
            case "Month":
              data = await this._3_setFingerspellMonth(data);
              break;
            case "Date":
              data = await this._3_setFingerspellDate(data);
              break;
            case "People":
              data = await this._3_setFingerspellPeople(data);
              break;
          }
        }.bind(this)
      )
    );

    return sData;
  }

  async _4_SetFingerSpellAniData(sData, additiveAnimationsFile) {
    // console.log(sData);
    await Promise.all(
      _.map(
        sData,
        async function (data) {
          await Promise.all(
            _.map(
              data.animations,
              async function (animation) {
                if (data.v1_id) animation["v1_id"] = true;
                // if (animation.components.length == 0) {
                switch (animation.attribute) {
                  case 2:
                    animation.components = await this._4_setFingerspellKorean(
                      animation
                    );
                    break;
                  case 3:
                    animation.components = await this._4_setFingerspellEnglish(
                      animation
                    );
                    break;
                  case 4:
                    animation.components = await this._4_setFingerspellNumber(
                      animation
                    );
                    break;
                  case 5:
                    animation.components = await this._4_setFingerspellDecimal(
                      animation
                    );
                    // animation.components = await this._4_setFingerspellDecimalUpdate(animation);
                    break;
                  case 6:
                    animation.components =
                      await this._4_setFingerspellDecimalPoint(animation);
                    break;
                  case 19:
                    animation.components = await this._4_setFingerspellDate(
                      animation
                    );
                    break;
                  case 73:
                    animation.components = await this._4_setFingerspellHours(
                      animation
                    );
                    break;
                  case 48:
                    animation.components = await this._4_setFingerspellTime(
                      animation,
                      additiveAnimationsFile
                    );
                    break;
                  case 65:
                    animation.components = await this._4_setFingerspellWeek(
                      animation
                    );
                    break;
                  case 66:
                    animation.components = await this._4_setFingerspellMonth(
                      animation
                    );
                    break;
                  default:
                    if (animation.is_created) {
                      if (animation.affix_type === "suffix") {
                        let splitedName = animation.componentName.split(
                          animation.affix
                        )[0];
                        let clonedAni = _.cloneDeep(animation);
                        clonedAni.componentName = splitedName;

                        animation.components = await this._4_checkFingerSpell(
                          clonedAni
                        );
                        let suffixAni = [];

                        _.map(animation.suffix_component, (component) => {
                          _.map(component.components, (comp) => {
                            comp.attribute = animation.attribute;
                            // comp["suffix"] = 1;
                            // comp["affix"] = "suffix";
                            // comp.hand_attribute = animation.hand_attribute;
                            suffixAni.push(comp);
                          });
                        });
                        animation.components.push(...suffixAni);
                      } else if (animation.affix_type === "prefix") {
                        let splitedName = animation.componentName.split(
                          animation.affix
                        )[1];
                        let clonedAni = _.cloneDeep(animation);
                        clonedAni.componentName = splitedName;

                        animation.components = await this._4_checkFingerSpell(
                          clonedAni
                        );
                        let prefixAni = [];
                        _.map(animation.prefix_component, (component) => {
                          _.map(component.components, (comp) => {
                            comp.attribute = component.attribute;
                            prefixAni.push(comp);
                          });
                        });
                        animation.components.unshift(...prefixAni);
                        // delete animation.prefix;
                      } else if (animation.affix_type === "breakpoint") {
                        let prevData = _.cloneDeep(animation);
                        prevData.componentName = prevData.componentName.split(
                          animation.affix
                        )[0];
                        let prevComponent = await this._4_checkFingerSpell(
                          prevData
                        );

                        let nextData = _.cloneDeep(animation);
                        nextData.componentName = nextData.componentName.split(
                          animation.affix
                        )[1];
                        let nextComponent = await this._4_checkFingerSpell(
                          nextData
                        );
                        animation.components = [
                          ...prevComponent,
                          animation.breakpoint_component,
                          ...nextComponent,
                        ];
                        // delete animation.breakpoint;
                      }

                      delete animation.is_created;
                    } else {
                      _.map(animation.components, (component) => {
                        if (animation.affix_type) {
                          // component["affix"] = animation.affix;
                          component["affix_type"] = animation.affix_type;
                          component["hand_attribute"] =
                            animation.hand_attribute;
                        }
                      });
                    }
                }
                // }
              }.bind(this)
            )
          );
        }.bind(this)
      )
    );

    await Promise.all(
      _.map(sData, async function (data) {
        await Promise.all(
          _.map(data.animations, async function (animation) {
            if (animation.dynamic) {
              await Promise.all(
                _.map(animation.components, async function (component) {
                  component.dynamic = true;
                })
              );
            }
          })
        );
      })
    );

    return sData;
  }

  async _4_checkFingerSpell(animation) {
    switch (animation.default_finger_spell_type) {
      case 2:
        return await this._4_setFingerspellKorean(animation);
      case 3:
        return await this._4_setFingerspellEnglish(animation);
      case 4:
        return await this._4_setFingerspellNumber(animation);
      case 5:
        return await this._4_setFingerspellDecimal(animation);
      case 6:
        return await this._4_setFingerspellDecimalPoint(animation);
      default:
        return [];
    }
  }

  /**
   *  한글 지화의 데이터 구조를 작성한다.
   */
  async setFingerspellKorean(data) {
    data.word = data.word
      .replace(/ /g, "")
      .replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, "");
    data.splitWord = [];

    await Promise.all(
      _.map(
        data.word,
        async function (spell) {
          let tempSplit = await this.getConsonantVowel(spell);
          data.splitWord.push(tempSplit);
        }.bind(this)
      )
    );

    let tmpAnimationInfo = data.sl_composition.data[0];
    tmpAnimationInfo.Transition_Offset = 0;
    tmpAnimationInfo.Exit_Time = 100;

    data = await this.getAnimationInfoKorean(data);
    data = await this.setDefaultAnimationInfo(data, tmpAnimationInfo);

    return data;
  }

  async _4_setFingerspellKorean(data) {
    data.componentName = data.componentName
      .replace(/ /g, "")
      .replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, "");
    // let currentLetterIndex = -1;

    // let createdComponents = [];
    // let idx = -1;

    data.splitWord = [];

    await Promise.all(
      _.map(
        data.componentName,
        async function (spell) {
          let tempSplit = await this.getConsonantVowel(spell);
          data.splitWord.push(tempSplit);
        }.bind(this)
      )
    );
    if (data.components.length == 0) {
      data.components = await this._4_getAnimationInfoKorean(data);
    } else {
      await Promise.all(
        _.map(data.components, (component) => {
          component.Transition_Duration = 0.4;
        })
      );
    }

    return data.components;
  }

  /**
   *  쌍자음, 합성모음 등을 분리한다.
   */
  async getAnimationInfoKorean(data) {
    let AnimationIndexList = [];
    let PosIndexList = [];

    let doubleConsonant = {
      ㄲ: ["ㄱ", "ㄱ"],
      ㄸ: ["ㄷ", "ㄷ"],
      ㅃ: ["ㅂ", "ㅂ"],
      ㅆ: ["ㅅ", "ㅅ"],
      ㅉ: ["ㅈ", "ㅈ"],
      ㄳ: ["ㄱ", "ㅅ"],
      ㄵ: ["ㄴ", "ㅈ"],
      ㄶ: ["ㄴ", "ㅎ"],
      ㄺ: ["ㄹ", "ㄱ"],
      ㄻ: ["ㄹ", "ㅁ"],
      ㄼ: ["ㄹ", "ㅂ"],
      ㄽ: ["ㄹ", "ㅅ"],
      ㄾ: ["ㄹ", "ㅌ"],
      ㄿ: ["ㄹ", "ㅍ"],
      ㅀ: ["ㄹ", "ㅎ"],
      ㅄ: ["ㅂ", "ㅅ"],
    };
    let doubleVowel = {
      ㅘ: ["ㅗ", "ㅏ"],
      ㅙ: ["ㅗ", "ㅐ"],
      ㅝ: ["ㅜ", "ㅓ"],
      ㅞ: ["ㅜ", "ㅔ"],
    };

    await Promise.all(
      _.map(data.splitWord, async function (word) {
        await Promise.all(
          _.map(word, function (spell, position) {
            if (!spell) return;

            if (position === "f") {
              PosIndexList.push("f1");
              if (_.keys(doubleConsonant).includes(spell))
                PosIndexList.push("f2");
            } else if (position === "s") {
              if (
                spell == "ㅗ" ||
                spell == "ㅛ" ||
                spell == "ㅜ" ||
                spell == "ㅠ" ||
                spell == "ㅡ" ||
                spell == "ㅚ" ||
                spell == "ㅟ" ||
                spell == "ㅢ"
              ) {
                PosIndexList.push("s2");
              } else {
                if (_.keys(doubleVowel).includes(spell)) {
                  PosIndexList.push("s2");
                  PosIndexList.push("s1");
                } else PosIndexList.push("s1");
              }
            } else if (position == "t") {
              PosIndexList.push("t1");
              if (_.keys(doubleConsonant).includes(spell))
                PosIndexList.push("t2");
            }

            if (_.keys(doubleConsonant).includes(spell)) {
              AnimationIndexList.push(...doubleConsonant[spell]);
            } else if (_.keys(doubleVowel).includes(spell)) {
              AnimationIndexList.push(...doubleVowel[spell]);
            } else {
              AnimationIndexList.push(spell);
            }
          })
        );
      })
    );

    AnimationIndexList.push(-1);
    PosIndexList.push(-1);

    let obj = {
      animationIndexes: AnimationIndexList,
      positionIndexes: PosIndexList,
    };

    data["fingerSpellInfo"] = _.cloneDeep(obj);

    return data;
  }
  async _4_getAnimationInfoKorean(data) {
    let doubleConsonant = {
      ㄲ: ["ㄱ", "ㄱ"],
      ㄸ: ["ㄷ", "ㄷ"],
      ㅃ: ["ㅂ", "ㅂ"],
      ㅆ: ["ㅅ", "ㅅ"],
      ㅉ: ["ㅈ", "ㅈ"],
      ㄳ: ["ㄱ", "ㅅ"],
      ㄵ: ["ㄴ", "ㅈ"],
      ㄶ: ["ㄴ", "ㅎ"],
      ㄺ: ["ㄹ", "ㄱ"],
      ㄻ: ["ㄹ", "ㅁ"],
      ㄼ: ["ㄹ", "ㅂ"],
      ㄽ: ["ㄹ", "ㅅ"],
      ㄾ: ["ㄹ", "ㅌ"],
      ㄿ: ["ㄹ", "ㅍ"],
      ㅀ: ["ㄹ", "ㅎ"],
      ㅄ: ["ㅂ", "ㅅ"],
    };
    let doubleVowel = {
      ㅘ: ["ㅗ", "ㅏ"],
      ㅙ: ["ㅗ", "ㅐ"],
      ㅝ: ["ㅜ", "ㅓ"],
      ㅞ: ["ㅜ", "ㅔ"],
    };

    let currentLetterIndex = -1;
    let createdComponents = [];
    let createdIdx = -1;

    await Promise.all(
      _.map(data.splitWord, async function (word, idx) {
        await Promise.all(
          _.map(word, function (value, key) {
            if (!!value) {
              ++createdIdx;
              let dataStructure = {
                id: "",
                animationName: value,
                filename: `Avatar_Male01@${value}.eq4`,
                filepath: `/Base/ETC/FingerSpell_Figure/Hangeul/`,
                fingerSpellPosition: `${key}1`,
                fingerSpellAxisPoint: `${key}1`,
                isFingerspell: true,
                totalWordLength: data.componentName.length,
                currentLetterIndex: currentLetterIndex,
                // attribute: data.attribute,
                attribute: 2,
                Transition_Duration: 0.2,
                Transition_Offset: 0,
                Speed: 1.2,
                _4_finger: true,
              };

              if (key === "f") {
                currentLetterIndex++;
                dataStructure.currentLetterIndex = currentLetterIndex;
                createdComponents.push(_.cloneDeep(dataStructure));
                if (_.keys(doubleConsonant).includes(value)) {
                  createdComponents[
                    createdIdx
                  ].filename = `Avatar_Male01@${doubleConsonant[value][0]}.eq4`;
                  createdComponents[createdIdx].animationName =
                    doubleConsonant[value][0];
                  createdComponents[createdIdx].currentLetterIndex =
                    currentLetterIndex;

                  dataStructure.animationName = doubleConsonant[value][1];
                  dataStructure.filename = `Avatar_Male01@${doubleConsonant[value][1]}.eq4`;

                  currentLetterIndex++;
                  dataStructure.currentLetterIndex = currentLetterIndex;

                  createdComponents.push(_.cloneDeep(dataStructure));
                  createdIdx++;
                }
              } else if (key === "s") {
                if (
                  value == "ㅗ" ||
                  value == "ㅛ" ||
                  value == "ㅜ" ||
                  value == "ㅠ" ||
                  value == "ㅡ" ||
                  value == "ㅚ" ||
                  value == "ㅟ" ||
                  value == "ㅢ"
                ) {
                  dataStructure.fingerSpellPosition = "s2";
                  dataStructure.fingerSpellAxisPoint = "s2";
                  createdComponents.push(_.cloneDeep(dataStructure));
                } else {
                  dataStructure.fingerSpellPosition = "s1";
                  dataStructure.fingerSpellAxisPoint = "s1";
                  createdComponents.push(_.cloneDeep(dataStructure));
                  if (_.keys(doubleVowel).includes(value)) {
                    createdComponents[
                      createdIdx
                    ].filename = `Avatar_Male01@${doubleVowel[value][0]}.eq4`;
                    createdComponents[createdIdx].animationName =
                      doubleVowel[value][0];
                    createdComponents[createdIdx].currentLetterIndex =
                      currentLetterIndex;
                    createdComponents[createdIdx].fingerSpellPosition = "s2";
                    createdComponents[createdIdx].fingerSpellAxisPoint = "s2";

                    dataStructure.fingerSpellPosition = "s1";
                    dataStructure.fingerSpellAxisPoint = "s1";
                    dataStructure.animationName = doubleVowel[value][1];
                    dataStructure.currentLetterIndex = currentLetterIndex;
                    dataStructure.filename = `Avatar_Male01@${doubleVowel[value][1]}.eq4`;
                    createdComponents.push(_.cloneDeep(dataStructure));
                    createdIdx++;
                  }
                }
              } else if (key === "t") {
                dataStructure.fingerSpellPosition = "t1";
                dataStructure.fingerSpellAxisPoint = "t1";
                createdComponents.push(_.cloneDeep(dataStructure));

                if (_.keys(doubleConsonant).includes(value)) {
                  createdComponents[
                    createdIdx
                  ].filename = `Avatar_Male01@${doubleConsonant[value][0]}.eq4`;
                  createdComponents[createdIdx].animationName =
                    doubleConsonant[value][0];
                  createdComponents[createdIdx].currentLetterIndex =
                    currentLetterIndex;

                  dataStructure.animationName = doubleConsonant[value][1];
                  dataStructure.currentLetterIndex = currentLetterIndex;
                  dataStructure.fingerSpellPosition = "t2";
                  dataStructure.fingerSpellAxisPoint = "t2";
                  dataStructure.filename = `Avatar_Male01@${doubleConsonant[value][1]}.eq4`;
                  createdComponents.push(_.cloneDeep(dataStructure));
                  createdIdx++;
                }
              }
            }
          })
        );
      })
    );

    return createdComponents;
  }

  /**
   *  한글 지화 텍스트의 자모음을 분리하여 배열화
   */
  async getConsonantVowel(kor) {
    const f = [
      "ㄱ",
      "ㄲ",
      "ㄴ",
      "ㄷ",
      "ㄸ",
      "ㄹ",
      "ㅁ",
      "ㅂ",
      "ㅃ",
      "ㅅ",
      "ㅆ",
      "ㅇ",
      "ㅈ",
      "ㅉ",
      "ㅊ",
      "ㅋ",
      "ㅌ",
      "ㅍ",
      "ㅎ",
    ];
    const s = [
      "ㅏ",
      "ㅐ",
      "ㅑ",
      "ㅒ",
      "ㅓ",
      "ㅔ",
      "ㅕ",
      "ㅖ",
      "ㅗ",
      "ㅘ",
      "ㅙ",
      "ㅚ",
      "ㅛ",
      "ㅜ",
      "ㅝ",
      "ㅞ",
      "ㅟ",
      "ㅠ",
      "ㅡ",
      "ㅢ",
      "ㅣ",
    ];
    const t = [
      "",
      "ㄱ",
      "ㄲ",
      "ㄳ",
      "ㄴ",
      "ㄵ",
      "ㄶ",
      "ㄷ",
      "ㄹ",
      "ㄺ",
      "ㄻ",
      "ㄼ",
      "ㄽ",
      "ㄾ",
      "ㄿ",
      "ㅀ",
      "ㅁ",
      "ㅂ",
      "ㅄ",
      "ㅅ",
      "ㅆ",
      "ㅇ",
      "ㅈ",
      "ㅊ",
      "ㅋ",
      "ㅌ",
      "ㅍ",
      "ㅎ",
    ];

    const ga = 44032;
    let uni = kor.charCodeAt(0);

    uni = uni - ga;

    let fn = parseInt(uni / 588);
    let sn = parseInt((uni - fn * 588) / 28);
    let tn = parseInt(uni % 28);

    return {
      f: f[fn],
      s: s[sn],
      t: t[tn],
    };
  }

  /**
   *  영어 지화의 데이터 구조를 작성한다.
   */
  async setFingerspellEnglish(data) {
    data.word = data.word
      .replace(/ /g, "")
      .replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, "");

    let tmpAnimationInfo = data.sl_composition.data[0];
    tmpAnimationInfo.Transition_Offset = 0;
    tmpAnimationInfo.Exit_Time = 100;

    data = await this.getAnimationInfoEnglish(data);
    data = await this.setDefaultAnimationInfo(data, tmpAnimationInfo);

    return data;
  }
  async _4_setFingerspellEnglish(data) {
    data.componentName = data.componentName
      .replace(/ /g, "")
      .replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, "");
    let currentLetterIndex = -1;
    let createdComponents = [];

    await Promise.all(
      _.map(
        data.componentName,
        async function (spell, idx) {
          let dataStructure = {
            id: "",
            animationName: spell,
            filename: `Avatar_Male01@${spell.toUpperCase()}.eq4`,
            filepath: `/Base/ETC/FingerSpell_Figure/Alphabet/`,
            isFingerspell: true,
            totalWordLength: data.componentName.length,
            currentLetterIndex: ++currentLetterIndex,
            // attribute: data.attribute,
            attribute: 3,
            Transition_Duration: 0.4,
            Transition_Offset: 0,
            _4_finger: true,
            Speed: 1.2,
          };

          if (data.components.length == 0) {
            createdComponents.push(_.cloneDeep(dataStructure));
          } else {
            _.map(dataStructure, (value, key) => {
              if (!data.components[idx].hasOwnProperty(key)) {
                if (key !== "_4_finger")
                  data.components[idx][key] = dataStructure[key];
              }
            });
          }
        }.bind(this)
      )
    );
    if (createdComponents.length > 0) {
      data.components = createdComponents;
    }
    return data.components;
  }

  /**
   *  숫자 지화의 데이터 구조를 작성한다.
   */
  async _4_setFingerspellNumber(data) {
    data.componentName = data.componentName
      .replace(/ /g, "")
      .replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, "");
    let currentLetterIndex = 0;

    let createdComponents = [];
    await Promise.all(
      _.map(
        data.componentName,
        async function (spell, idx) {
          let dataStructure = {
            id: "",
            animationName: spell,
            filename: `Avatar_Male01@${spell}.eq4`,
            filepath: `/Base/ETC/FingerSpell_Figure/Number/`,
            isFingerspell: true,
            totalWordLength: data.componentName.length,
            currentLetterIndex: ++currentLetterIndex,
            // attribute: data.attribute,
            attribute: 4,
            Transition_Duration: 0.3,
            Transition_Offset: 0,
            Speed: 1.2,
            _4_finger: true,
          };

          if (data.components.length == 0) {
            createdComponents.push(_.cloneDeep(dataStructure));
          } else {
            _.map(dataStructure, (value, key) => {
              if (!data.components[idx].hasOwnProperty(key)) {
                if (key !== "_4_finger")
                  data.components[idx][key] = dataStructure[key];
              }
            });
          }
        }.bind(this)
      )
    );
    if (createdComponents.length > 0) {
      data.components = createdComponents;
    }
    return data.components;
  }

  /**
   *  숫자(십진수) 지화의 데이터 구조를 작성한다.
   */
  async _4_setFingerspellDecimal(data) {
    let sliceNumber = data.componentName.length - 1;
    let tmpDecimal = [];
    let spliceDecimal = [];
    let decimalAnimations = [];
    let currentLetterIndex = 0;
    // let resArr = [];
    for (let i = sliceNumber; i >= 0; i--) {
      let tmp = data.componentName.substr(i, 1);
      tmpDecimal.push(tmp);

      if (
        (sliceNumber >= 4 && (data.componentName.length - i) % 4 == 0) ||
        i == 0
      ) {
        tmpDecimal = tmpDecimal.reverse();
        let joinString = tmpDecimal.join("");
        spliceDecimal.push(joinString);
        tmpDecimal = [];
      }
    }
    _.forEachRight(spliceDecimal, (value, index) => {
      if (value.length == 1 || value.length == 2) {
        if (value != "00") {
          if (value == "10") {
            if (spliceDecimal.length > 1) {
              decimalAnimations.push("Avatar_Male01@10");
            } else {
              decimalAnimations.push("Avatar_Male01@10ㅇ");
            }
          } else {
            decimalAnimations.push("Avatar_Male01@" + value);
          }
        }
      } else {
        if (value.length == 3) {
          if (value[0] != 0)
            decimalAnimations.push("Avatar_Male01@" + value[0] + "00");
          if (value[1] != 0) {
            decimalAnimations.push("Avatar_Male01@" + value[1] + value[2]);
          } else {
            if (value[2] != 0) {
              decimalAnimations.push("Avatar_Male01@" + value[2]);
            }
          }
        } else {
          if (value[0] != 0)
            decimalAnimations.push("Avatar_Male01@" + value[0] + "000");
          if (value[1] != 0)
            decimalAnimations.push("Avatar_Male01@" + value[1] + "00");
          if (value[2] != 0) {
            decimalAnimations.push("Avatar_Male01@" + value[2] + value[3]);
          } else {
            if (value[3] != 0) {
              decimalAnimations.push("Avatar_Male01@" + value[3]);
            }
          }
        }
      }

      if (index == 3) {
        decimalAnimations.push("Avatar_Male01@조");
      } else if (index == 2) {
        if (spliceDecimal.length > 2) {
          if (value != "0000") {
            decimalAnimations.push("Avatar_Male01@억");
          }
        } else {
          decimalAnimations.push("Avatar_Male01@억");
        }
      } else if (index == 1) {
        if (spliceDecimal.length > 2) {
          if (value != "0000") {
            decimalAnimations.push("Avatar_Male01@일만");
          }
        } else {
          if (value.length == 1) {
            decimalAnimations.pop();
            decimalAnimations.push(`Avatar_Male01@${value}0000`);
          } else {
            decimalAnimations.push("Avatar_Male01@일만");
          }
        }
      }
    });

    let createdComponents = [];
    _.map(decimalAnimations, (ani, index) => {
      let filename = `${ani}.eq4`;
      let filepath = `/Base/ETC/FingerSpell_Figure/Number/`;

      let dataStructure = {
        id: "",
        animationName: ani.split("@")[1],
        // filename: `${ani}.eq4`,
        // filepath: `/Adam/FingerSpell_Figure/Number/`,
        filename: filename,
        filepath: filepath,
        isFingerspell: true,
        totalWordLength: decimalAnimations.length,
        currentLetterIndex: ++currentLetterIndex,
        attribute: 5,
        // attribute: 5,
        Transition_Duration: 0.3,
        Transition_Offset: 0,
        Speed: 1.2,
        _4_finger: true,
      };
      if (data.components.length == 0) {
        createdComponents.push(_.cloneDeep(dataStructure));
      } else {
        _.map(dataStructure, (value, key) => {
          if (!data.components[index].hasOwnProperty(key)) {
            if (key !== "_4_finger")
              data.components[index][key] = dataStructure[key];
          }
        });
      }
    });

    if (createdComponents.length > 0) {
      data.components = createdComponents;
    }

    return data.components;
  }

  async _3_setFingerspellDecimalUpdate(data) {
    const ResourceNameSuffixOnly = "only";
    const ResourceNameSuffixBack = "back";
    const ResourceNameSuffixDec = "_dec";
    const ResourceNameTenThousand = "10000";
    const IrregularDecimalNumber = [11, 12, 13, 14, 17, 18, 19];
    const eHandFace = {
      Back: 0,
      Front: 1,
    };

    let strNumber = data.word
      .replace(/ /g, "")
      .replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, "");
    strNumber = strNumber.replace(/[^0-9]/g, "");
    let length = strNumber.length;
    let isValid = false;
    let NumberValue = Number(strNumber);

    function DecimalNumberDividedLetterInfo(input) {
      let DecimalNumberDividedLetterInfos = {
        AnimClipNames: "",
        LetterNumber: 0,
        HandFace: 0,
        HandFaceFixed: false,
        CanChangeHandFace: false,
      };
      if (!!input) {
        DecimalNumberDividedLetterInfos.AnimClipNames = input.AnimClipNames;
        DecimalNumberDividedLetterInfos.LetterNumber = input.LetterNumber;
        DecimalNumberDividedLetterInfos.HandFace = input.HandFace;
        DecimalNumberDividedLetterInfos.HandFaceFixed = input.HandFaceFixed;
        DecimalNumberDividedLetterInfos.CanChangeHandFace =
          input.CanChangeHandFace;
      }
      return DecimalNumberDividedLetterInfos;
    }

    function GetAnimResourceName(strNumber, bOnly, bForceBackFace = false) {
      let AnimResourceName;
      if (bOnly) {
        //bOnly 가 true일때 bForceBackFace가 true인 경우는 없다. (실제 리소스도 없음)
        // AnimResourceName = string.Format("{0}{1}{2}", strNumber, ResourceNameSuffixOnly, ResourceNameSuffixDec);
        AnimResourceName = `${strNumber}${ResourceNameSuffixOnly}${ResourceNameSuffixDec}`;
      } else if (bForceBackFace) {
        // AnimResourceName = string.Format("{0}{1}{2}", strNumber, ResourceNameSuffixBack, ResourceNameSuffixDec);
        AnimResourceName = `${strNumber}${ResourceNameSuffixBack}${ResourceNameSuffixDec}`;
      } else {
        // AnimResourceName = string.Format("{0}{1}", strNumber, ResourceNameSuffixDec);
        AnimResourceName = `${strNumber}${ResourceNameSuffixDec}`;
      }
      return AnimResourceName;
    }

    let DecimalNumberDividedLetterInfos = [];
    let animName = "";
    let bHandFaceIsBack = false;

    //10, 20, 30, 40 ~~~ 90
    if (NumberValue < 100 && NumberValue >= 10 && NumberValue % 10 == 0) {
      let DividedLetterInfo = DecimalNumberDividedLetterInfo();
      DividedLetterInfo.AnimClipNames = GetAnimResourceName(strNumber, true);
      DividedLetterInfo.LetterNumber = NumberValue;
      DividedLetterInfo.HandFace =
        NumberValue < 50 ? eHandFace.Front : eHandFace.Back;
      if (NumberValue == 20 || NumberValue == 30 || NumberValue == 40)
        DividedLetterInfo.CanChangeHandFace = true;

      DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
    } else {
      let valUnder10000 = 0;
      // for (let digitCount = length -1; digitCount >= 0; digitCount--) {
      for (let digitCount = length - 1; digitCount >= 0; digitCount--) {
        let digitPos = digitCount % 4;

        let numUnit = digitCount / 4; //단위 : 만, 억, 조
        let numUnitValue = 1; //단위 숫자 (1, 10000, 100000000 )
        if (digitPos == 3) {
          //1만 단위마다	valUnder10000 리셋
          valUnder10000 = 0;
        }

        //Too big Number
        if (numUnit >= 2) {
          break;
        } else if (numUnit == 2) {
          numUnitValue = 100000000;
        } else if (numUnit == 1) {
          numUnitValue = 10000;
        } else {
          numUnitValue = 1;
        }

        //(digitPos == 2|| digitPos == 3)
        if (digitPos >= 2) {
          // let valDigit = 0;
          let valDividedNumber = 0;

          // let strDigit = strNumber.Substring(length - digitCount - 1, 1);
          let strDigit = strNumber.substring(
            length - digitCount - 1,
            length - digitCount
          );

          let valDigit = parseInt(strDigit);
          // if (Int32.TryParse(strDigit, out valDigit) == true && valDigit > 0)
          if (!isNaN(valDigit) && valDigit > 0) {
            switch (digitPos) {
              case 2:
                valDividedNumber = valDigit * 100;
                animName = GetAnimResourceName(valDividedNumber);
                bHandFaceIsBack = true; //100단위 다음 동작이 손등을 보임
                break;
              case 3:
                valDividedNumber = valDigit * 1000;
                animName = GetAnimResourceName(valDividedNumber);
                bHandFaceIsBack = false; //1000단위 다음 동작이 손바닥을 보임
                break;
              default:
                valDividedNumber = valDigit;
                animName = GetAnimResourceName(valDividedNumber);
                break;
            }

            // DividedLetterInfo = new DecimalNumberDividedLetterInfo();
            let DividedLetterInfo = DecimalNumberDividedLetterInfo();
            DividedLetterInfo.AnimClipNames = animName;
            DividedLetterInfo.LetterNumber = valDividedNumber * numUnitValue;
            DividedLetterInfo.HandFace =
              digitPos == 2 ? eHandFace.Front : eHandFace.Back; //백 단위는 손바닥으로 시작 해서 손등으로 끝남
            if (valDigit == 5) {
              DividedLetterInfo.HandFace = eHandFace.Front; //500, 5000 의 경우 손바닥(Front)에서 시작함.
            }
            DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
            valUnder10000 += valDividedNumber;
          }
        }
        //0~99는 예외 값이 많아서 처리가 다름 (digitPos == 1|| digitPos == 0)
        else {
          //만 단위 마다 단위 표시
          let bNumUnitAnimateNeed = false; // 단위 표현이 필요한지 여부 ( 2억3만4 일 경우 '2','억','3','만','4' 5개 이지만. 2억4 일 경우 '2','억','4'로 .. 3개만 표시, 그리고 1의 단위를 표시하면서 같이 표시 했을 경우 필요하지 않아짐.)
          if (numUnit > 0) {
            //만 이상이라면! 단위 수 표시가 필요하다.
            bNumUnitAnimateNeed = true;
          }

          // string strUnder100 = strNumber.Substring(Math.Max(0, length - digitCount - 1), digitPos + 1);
          let strUnder100 = strNumber.substring(
            Math.max(0, length - digitCount - 1),
            Math.max(0, length - digitCount - 1) + digitPos + 1
          ); //digitPos 는 0 or 1
          let valUnder100 = parseInt(strUnder100);

          // if (Int32.TryParse(strUnder100, out valUnder100) == true && valUnder100 > 0)
          //단위 다음의 두자리 수 X 혹은 XX ( XX만, X억, XX, XX 등등 인데 XX는 0 보다 큼)
          if (!isNaN(valUnder100) && valUnder100 > 0) {
            valUnder10000 += valUnder100;
            //{ 11, 12, 13, 14, 17, 18, 19 };
            if (IrregularDecimalNumber.includes(valUnder100)) {
              let DividedLetterInfo = DecimalNumberDividedLetterInfo();
              if (valUnder100 == 11) {
                //11
                let bOnly = false;
                let bFaceBack = bHandFaceIsBack;
                if (numUnit == 1) {
                  animName = GetAnimResourceName(
                    `${ResourceNameTenThousand}_${valUnder100.toString()}`,
                    bOnly,
                    bFaceBack
                  );
                  bNumUnitAnimateNeed = false;
                } else {
                  animName = GetAnimResourceName(
                    `${valUnder100.toString()}`,
                    bOnly,
                    bFaceBack
                  );
                }
                DividedLetterInfo.HandFace = bFaceBack
                  ? eHandFace.Back
                  : eHandFace.Front;
              } else {
                //12,13,14,17,18,19
                if (numUnit == 1) {
                  animName = GetAnimResourceName(
                    `${ResourceNameTenThousand}_${valUnder100.toString()}`
                  );
                  bNumUnitAnimateNeed = false;
                  bHandFaceIsBack = false; //12,13,14,17,18,19 만은 만을 표시하면서 다시 손바닥이 앞으로 보인다.
                } else {
                  animName = GetAnimResourceName(`${valUnder100.toString()}`);
                  bHandFaceIsBack = true;
                }
                DividedLetterInfo.HandFace = eHandFace.Back; //12,13,14,17,18,19 은 손등으로 시작한다.
              }

              DividedLetterInfo.AnimClipNames = animName;
              DividedLetterInfo.LetterNumber = valUnder100 * numUnitValue;

              DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
            } else {
              let val1 = valUnder100 % 10;
              let val10 = valUnder100 - val1;

              if (val1 == 5) {
                //5로 끝나는 경우 다시 정면으로. (55 제외)
                //55는 예외지만, 55는 단독으로 이미 앞에서 처리함.
                bHandFaceIsBack = false;
              }

              if (valUnder100 == 55) {
                if (numUnit == 1) {
                  //만 단위라면!
                  animName = GetAnimResourceName(
                    `${ResourceNameTenThousand}_${valUnder100.toString()}`
                  );
                  bNumUnitAnimateNeed = false;
                } else {
                  animName = GetAnimResourceName(`${valUnder100.toString()}`);
                }

                let DividedLetterInfo = DecimalNumberDividedLetterInfo();
                DividedLetterInfo.AnimClipNames = animName;
                DividedLetterInfo.HandFace = eHandFace.Back;
                DividedLetterInfo.LetterNumber = valUnder100 * numUnitValue;
                DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
                bHandFaceIsBack = true;
              } else {
                if (val10 != 0) {
                  if (val10 < 50) {
                    let bOnly = false;
                    let bFaceBack = bHandFaceIsBack;
                    animName = GetAnimResourceName(
                      `${val10.toString()}`,
                      bOnly,
                      bFaceBack
                    );
                  } else {
                    animName = GetAnimResourceName(`${val10.toString()}`);
                    bHandFaceIsBack = true;
                  }

                  let DividedLetterInfo = DecimalNumberDividedLetterInfo();
                  DividedLetterInfo.AnimClipNames = animName;
                  DividedLetterInfo.LetterNumber = val10 * numUnitValue;
                  DividedLetterInfo.HandFace = bHandFaceIsBack
                    ? eHandFace.Back
                    : eHandFace.Front;
                  if (val10 < 50 && val1 == 5) {
                    DividedLetterInfo.HandFaceFixed = true;
                  }
                  DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
                }

                if (val1 != 0) {
                  let DividedLetterInfo = DecimalNumberDividedLetterInfo();
                  if (val1 < 5) {
                    let bOnly = false;
                    let bFaceBack = bHandFaceIsBack;
                    if (numUnit == 1 && bFaceBack == false) {
                      //1의 단위가 1~4 중에, 만 단위, 손바닥으로 할 경우
                      animName = GetAnimResourceName(
                        `${ResourceNameTenThousand}_${val1.toString()}`,
                        bOnly,
                        bFaceBack
                      );
                      bNumUnitAnimateNeed = false;
                    } else {
                      animName = GetAnimResourceName(
                        `${val1.toString()}`,
                        bOnly,
                        bFaceBack
                      );
                    }
                    DividedLetterInfo.HandFace = bFaceBack
                      ? eHandFace.Back
                      : eHandFace.Front;
                  } else if (val1 == 5) {
                    if (val10 > 0 && val10 < 50) {
                      // animName = GetAnimResourceName(string.Format("5_{0}", (valUnder100).ToString()));
                      animName = GetAnimResourceName(
                        `5_${valUnder100.toString()}`
                      );
                    } else {
                      animName = GetAnimResourceName(`${val1.toString()}`);
                    }
                    bHandFaceIsBack = false;
                    DividedLetterInfo.HandFace = eHandFace.Front;
                  } //6~9
                  else {
                    if (numUnit == 1) {
                      //만 단위라면!
                      animName = GetAnimResourceName(
                        `${ResourceNameTenThousand}_${val1.toString()}`
                      );
                      bNumUnitAnimateNeed = false;
                      bHandFaceIsBack = false; //6~9만은 만을 표시하면서 다시 손바닥이 앞으로 보인다.
                    } else {
                      animName = GetAnimResourceName(`${val1.toString()}`);
                      bHandFaceIsBack = true;
                    }
                    DividedLetterInfo.HandFace = eHandFace.Back;
                  }

                  DividedLetterInfo.AnimClipNames = animName;
                  DividedLetterInfo.LetterNumber = val1 * numUnitValue;
                  DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
                }
              }
            }
          }
          if (digitPos != 0) {
            //1의 단위만 있는 것이 아니면!
            digitCount -= 1; //2단위를 한 것이므로 -1
          }

          if (valUnder10000 == 0) {
            //아무 숫자도 없다면! 단위를 표시할 필요도 없다.
            bNumUnitAnimateNeed = false;
          }

          if (bNumUnitAnimateNeed) {
            let bOnly = false;
            let bFaceBack = bHandFaceIsBack;
            let numUnitAnimName = "";
            switch (numUnit) {
              case 1:
                numUnitAnimName = GetAnimResourceName(
                  ResourceNameTenThousand,
                  bOnly,
                  bFaceBack
                );
                break;
              //case 2:
              //	numUnitAnimName = "억";
              //	break;
              //case 3:
              //	numUnitAnimName = "조";
              //	break;
              default:
                animName = "";
                break;
            }

            // if (string.IsNullOrEmpty(numUnitAnimName) == false)
            if (!numUnitAnimName && numUnitAnimName !== "") {
              DividedLetterInfo = new DecimalNumberDividedLetterInfo();
              DividedLetterInfo.AnimClipNames = numUnitAnimName;
              DividedLetterInfo.LetterNumber = numUnitValue;
              DividedLetterInfo.HandFace = bFaceBack
                ? eHandFace.Back
                : eHandFace.Front;
              DecimalNumberDividedLetterInfos.Add(DividedLetterInfo);
            }
          }
        }
      }
    }

    if (DecimalNumberDividedLetterInfos.length <= 0) {
      isValid = false;
      console.log(`err return 1`);
      return data.components;
    }

    // make structure
    // let createdComponents = [];
    // let currentLetterIndex = 0;

    // _.map(DecimalNumberDividedLetterInfos, (ani, index) => {
    //     let filename = `Avatar_Male01@${ani.AnimClipNames}.eq4`;
    //     let filepath = `/Base/ETC/FingerSpell_Figure/NumberNew/`;

    //     let dataStructure = {
    //         id: "",
    //         animationName: ani.AnimClipNames,
    //         // filename: `${ani}.eq4`,
    //         // filepath: `/Adam/FingerSpell_Figure/Number/`,
    //         filename: filename,
    //         filepath: filepath,
    //         isFingerspell: true,
    //         totalWordLength: DecimalNumberDividedLetterInfos.length,
    //         currentLetterIndex: ++currentLetterIndex,
    //         attribute: 5,
    //         Transition_Duration: 0.2,
    //         Transition_Offset: 0,
    //         Speed: 0.9,
    //         _4_finger: true,
    //     };
    //     if (data.components.length == 0) {
    //         createdComponents.push(_.cloneDeep(dataStructure));
    //     } else {
    //         _.map(dataStructure, (value, key) => {
    //             if (!data.components[index].hasOwnProperty(key)) {
    //                 if (key !== "_4_finger") data.components[index][key] = dataStructure[key];
    //             }
    //         });
    //     }
    // });

    // if (createdComponents.length > 0) {
    //     data.components = createdComponents;
    // }
    // isValid = true;

    // return data.components;

    let currentWordIndex = -1;
    let tmpAnimationInfo = data.sl_composition.data[0];

    DecimalNumberDividedLetterInfos.forEach((aniInfo, fingerSpellIndex) => {
      currentWordIndex++;
      tmpAnimationInfo.ani_name = aniInfo.AnimClipNames;
      tmpAnimationInfo.fingerSpellIndex = fingerSpellIndex;
      tmpAnimationInfo.fingerSpellPosition = 1000000;
      tmpAnimationInfo.currentWordIndex = currentWordIndex;
      tmpAnimationInfo.animation_length =
        DecimalNumberDividedLetterInfos.length;

      tmpAnimationInfo["isFingerspell"] = true;

      // data.sl_composition.data[fingerSpellIndex] = JSON.parse(JSON.stringify(tmpAnimationInfo));
      data.sl_composition.data[fingerSpellIndex] =
        _.cloneDeep(tmpAnimationInfo);
    });

    return data;
  }

  async _4_setFingerspellDecimalUpdate(data) {
    const ResourceNameSuffixOnly = "only";
    const ResourceNameSuffixBack = "back";
    const ResourceNameSuffixDec = "_dec";
    const ResourceNameTenThousand = "10000";
    const IrregularDecimalNumber = [11, 12, 13, 14, 17, 18, 19];
    const eHandFace = {
      Back: 0,
      Front: 1,
    };

    let strNumber = data.componentName;
    let length = strNumber.length;
    let isValid = false;
    let NumberValue = Number(strNumber);

    function DecimalNumberDividedLetterInfo(input) {
      let DecimalNumberDividedLetterInfos = {
        AnimClipNames: "",
        LetterNumber: 0,
        HandFace: 0,
        HandFaceFixed: false,
        CanChangeHandFace: false,
      };
      if (!!input) {
        DecimalNumberDividedLetterInfos.AnimClipNames = input.AnimClipNames;
        DecimalNumberDividedLetterInfos.LetterNumber = input.LetterNumber;
        DecimalNumberDividedLetterInfos.HandFace = input.HandFace;
        DecimalNumberDividedLetterInfos.HandFaceFixed = input.HandFaceFixed;
        DecimalNumberDividedLetterInfos.CanChangeHandFace =
          input.CanChangeHandFace;
      }
      return DecimalNumberDividedLetterInfos;
    }

    function GetAnimResourceName(strNumber, bOnly, bForceBackFace = false) {
      let AnimResourceName;
      if (bOnly) {
        //bOnly 가 true일때 bForceBackFace가 true인 경우는 없다. (실제 리소스도 없음)
        // AnimResourceName = string.Format("{0}{1}{2}", strNumber, ResourceNameSuffixOnly, ResourceNameSuffixDec);
        AnimResourceName = `${strNumber}${ResourceNameSuffixOnly}${ResourceNameSuffixDec}`;
      } else if (bForceBackFace) {
        // AnimResourceName = string.Format("{0}{1}{2}", strNumber, ResourceNameSuffixBack, ResourceNameSuffixDec);
        AnimResourceName = `${strNumber}${ResourceNameSuffixBack}${ResourceNameSuffixDec}`;
      } else {
        // AnimResourceName = string.Format("{0}{1}", strNumber, ResourceNameSuffixDec);
        AnimResourceName = `${strNumber}${ResourceNameSuffixDec}`;
      }
      return AnimResourceName;
    }

    let DecimalNumberDividedLetterInfos = [];
    let animName = "";
    let bHandFaceIsBack = false;

    //10, 20, 30, 40 ~~~ 90
    if (NumberValue < 100 && NumberValue >= 10 && NumberValue % 10 == 0) {
      let DividedLetterInfo = DecimalNumberDividedLetterInfo();
      DividedLetterInfo.AnimClipNames = GetAnimResourceName(strNumber, true);
      DividedLetterInfo.LetterNumber = NumberValue;
      DividedLetterInfo.HandFace =
        NumberValue < 50 ? eHandFace.Front : eHandFace.Back;
      if (NumberValue == 20 || NumberValue == 30 || NumberValue == 40)
        DividedLetterInfo.CanChangeHandFace = true;

      DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
    } else {
      let valUnder10000 = 0;
      // for (let digitCount = length -1; digitCount >= 0; digitCount--) {
      for (let digitCount = length - 1; digitCount >= 0; digitCount--) {
        let digitPos = digitCount % 4;

        let numUnit = digitCount / 4; //단위 : 만, 억, 조
        let numUnitValue = 1; //단위 숫자 (1, 10000, 100000000 )
        if (digitPos == 3) {
          //1만 단위마다	valUnder10000 리셋
          valUnder10000 = 0;
        }

        //Too big Number
        if (numUnit >= 2) {
          break;
        } else if (numUnit == 2) {
          numUnitValue = 100000000;
        } else if (numUnit == 1) {
          numUnitValue = 10000;
        } else {
          numUnitValue = 1;
        }

        //(digitPos == 2|| digitPos == 3)
        if (digitPos >= 2) {
          // let valDigit = 0;
          let valDividedNumber = 0;

          // let strDigit = strNumber.Substring(length - digitCount - 1, 1);
          let strDigit = strNumber.substring(
            length - digitCount - 1,
            length - digitCount
          );

          let valDigit = parseInt(strDigit);
          // if (Int32.TryParse(strDigit, out valDigit) == true && valDigit > 0)
          if (!isNaN(valDigit) && valDigit > 0) {
            switch (digitPos) {
              case 2:
                valDividedNumber = valDigit * 100;
                animName = GetAnimResourceName(valDividedNumber);
                bHandFaceIsBack = true; //100단위 다음 동작이 손등을 보임
                break;
              case 3:
                valDividedNumber = valDigit * 1000;
                animName = GetAnimResourceName(valDividedNumber);
                bHandFaceIsBack = false; //1000단위 다음 동작이 손바닥을 보임
                break;
              default:
                valDividedNumber = valDigit;
                animName = GetAnimResourceName(valDividedNumber);
                break;
            }

            // DividedLetterInfo = new DecimalNumberDividedLetterInfo();
            let DividedLetterInfo = DecimalNumberDividedLetterInfo();
            DividedLetterInfo.AnimClipNames = animName;
            DividedLetterInfo.LetterNumber = valDividedNumber * numUnitValue;
            DividedLetterInfo.HandFace =
              digitPos == 2 ? eHandFace.Front : eHandFace.Back; //백 단위는 손바닥으로 시작 해서 손등으로 끝남
            if (valDigit == 5) {
              DividedLetterInfo.HandFace = eHandFace.Front; //500, 5000 의 경우 손바닥(Front)에서 시작함.
            }
            DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
            valUnder10000 += valDividedNumber;
          }
        }
        //0~99는 예외 값이 많아서 처리가 다름 (digitPos == 1|| digitPos == 0)
        else {
          //만 단위 마다 단위 표시
          let bNumUnitAnimateNeed = false; // 단위 표현이 필요한지 여부 ( 2억3만4 일 경우 '2','억','3','만','4' 5개 이지만. 2억4 일 경우 '2','억','4'로 .. 3개만 표시, 그리고 1의 단위를 표시하면서 같이 표시 했을 경우 필요하지 않아짐.)
          if (numUnit > 0) {
            //만 이상이라면! 단위 수 표시가 필요하다.
            bNumUnitAnimateNeed = true;
          }

          // string strUnder100 = strNumber.Substring(Math.Max(0, length - digitCount - 1), digitPos + 1);
          let strUnder100 = strNumber.substring(
            Math.max(0, length - digitCount - 1),
            Math.max(0, length - digitCount - 1) + digitPos + 1
          ); //digitPos 는 0 or 1
          let valUnder100 = parseInt(strUnder100);

          // if (Int32.TryParse(strUnder100, out valUnder100) == true && valUnder100 > 0)
          //단위 다음의 두자리 수 X 혹은 XX ( XX만, X억, XX, XX 등등 인데 XX는 0 보다 큼)
          if (!isNaN(valUnder100) && valUnder100 > 0) {
            valUnder10000 += valUnder100;
            //{ 11, 12, 13, 14, 17, 18, 19 };
            if (IrregularDecimalNumber.includes(valUnder100)) {
              let DividedLetterInfo = DecimalNumberDividedLetterInfo();
              if (valUnder100 == 11) {
                //11
                let bOnly = false;
                let bFaceBack = bHandFaceIsBack;
                if (numUnit == 1) {
                  animName = GetAnimResourceName(
                    `${ResourceNameTenThousand}_${valUnder100.toString()}`,
                    bOnly,
                    bFaceBack
                  );
                  bNumUnitAnimateNeed = false;
                } else {
                  animName = GetAnimResourceName(
                    `${valUnder100.toString()}`,
                    bOnly,
                    bFaceBack
                  );
                }
                DividedLetterInfo.HandFace = bFaceBack
                  ? eHandFace.Back
                  : eHandFace.Front;
              } else {
                //12,13,14,17,18,19
                if (numUnit == 1) {
                  animName = GetAnimResourceName(
                    `${ResourceNameTenThousand}_${valUnder100.toString()}`
                  );
                  bNumUnitAnimateNeed = false;
                  bHandFaceIsBack = false; //12,13,14,17,18,19 만은 만을 표시하면서 다시 손바닥이 앞으로 보인다.
                } else {
                  animName = GetAnimResourceName(`${valUnder100.toString()}`);
                  bHandFaceIsBack = true;
                }
                DividedLetterInfo.HandFace = eHandFace.Back; //12,13,14,17,18,19 은 손등으로 시작한다.
              }

              DividedLetterInfo.AnimClipNames = animName;
              DividedLetterInfo.LetterNumber = valUnder100 * numUnitValue;

              DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
            } else {
              let val1 = valUnder100 % 10;
              let val10 = valUnder100 - val1;

              if (val1 == 5) {
                //5로 끝나는 경우 다시 정면으로. (55 제외)
                //55는 예외지만, 55는 단독으로 이미 앞에서 처리함.
                bHandFaceIsBack = false;
              }

              if (valUnder100 == 55) {
                if (numUnit == 1) {
                  //만 단위라면!
                  animName = GetAnimResourceName(
                    `${ResourceNameTenThousand}_${valUnder100.toString()}`
                  );
                  bNumUnitAnimateNeed = false;
                } else {
                  animName = GetAnimResourceName(`${valUnder100.toString()}`);
                }

                let DividedLetterInfo = DecimalNumberDividedLetterInfo();
                DividedLetterInfo.AnimClipNames = animName;
                DividedLetterInfo.HandFace = eHandFace.Back;
                DividedLetterInfo.LetterNumber = valUnder100 * numUnitValue;
                DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
                bHandFaceIsBack = true;
              } else {
                if (val10 != 0) {
                  if (val10 < 50) {
                    let bOnly = false;
                    let bFaceBack = bHandFaceIsBack;
                    animName = GetAnimResourceName(
                      `${val10.toString()}`,
                      bOnly,
                      bFaceBack
                    );
                  } else {
                    animName = GetAnimResourceName(`${val10.toString()}`);
                    bHandFaceIsBack = true;
                  }

                  let DividedLetterInfo = DecimalNumberDividedLetterInfo();
                  DividedLetterInfo.AnimClipNames = animName;
                  DividedLetterInfo.LetterNumber = val10 * numUnitValue;
                  DividedLetterInfo.HandFace = bHandFaceIsBack
                    ? eHandFace.Back
                    : eHandFace.Front;
                  if (val10 < 50 && val1 == 5) {
                    DividedLetterInfo.HandFaceFixed = true;
                  }
                  DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
                }

                if (val1 != 0) {
                  let DividedLetterInfo = DecimalNumberDividedLetterInfo();
                  if (val1 < 5) {
                    let bOnly = false;
                    let bFaceBack = bHandFaceIsBack;
                    if (numUnit == 1 && bFaceBack == false) {
                      //1의 단위가 1~4 중에, 만 단위, 손바닥으로 할 경우
                      animName = GetAnimResourceName(
                        `${ResourceNameTenThousand}_${val1.toString()}`,
                        bOnly,
                        bFaceBack
                      );
                      bNumUnitAnimateNeed = false;
                    } else {
                      animName = GetAnimResourceName(
                        `${val1.toString()}`,
                        bOnly,
                        bFaceBack
                      );
                    }
                    DividedLetterInfo.HandFace = bFaceBack
                      ? eHandFace.Back
                      : eHandFace.Front;
                  } else if (val1 == 5) {
                    if (val10 > 0 && val10 < 50) {
                      // animName = GetAnimResourceName(string.Format("5_{0}", (valUnder100).ToString()));
                      animName = GetAnimResourceName(
                        `5_${valUnder100.toString()}`
                      );
                    } else {
                      animName = GetAnimResourceName(`${val1.toString()}`);
                    }
                    bHandFaceIsBack = false;
                    DividedLetterInfo.HandFace = eHandFace.Front;
                  } //6~9
                  else {
                    if (numUnit == 1) {
                      //만 단위라면!
                      animName = GetAnimResourceName(
                        `${ResourceNameTenThousand}_${val1.toString()}`
                      );
                      bNumUnitAnimateNeed = false;
                      bHandFaceIsBack = false; //6~9만은 만을 표시하면서 다시 손바닥이 앞으로 보인다.
                    } else {
                      animName = GetAnimResourceName(`${val1.toString()}`);
                      bHandFaceIsBack = true;
                    }
                    DividedLetterInfo.HandFace = eHandFace.Back;
                  }

                  DividedLetterInfo.AnimClipNames = animName;
                  DividedLetterInfo.LetterNumber = val1 * numUnitValue;
                  DecimalNumberDividedLetterInfos.push(DividedLetterInfo);
                }
              }
            }
          }
          if (digitPos != 0) {
            //1의 단위만 있는 것이 아니면!
            digitCount -= 1; //2단위를 한 것이므로 -1
          }

          if (valUnder10000 == 0) {
            //아무 숫자도 없다면! 단위를 표시할 필요도 없다.
            bNumUnitAnimateNeed = false;
          }

          if (bNumUnitAnimateNeed) {
            let bOnly = false;
            let bFaceBack = bHandFaceIsBack;
            let numUnitAnimName = "";
            switch (numUnit) {
              case 1:
                numUnitAnimName = GetAnimResourceName(
                  ResourceNameTenThousand,
                  bOnly,
                  bFaceBack
                );
                break;
              //case 2:
              //	numUnitAnimName = "억";
              //	break;
              //case 3:
              //	numUnitAnimName = "조";
              //	break;
              default:
                animName = "";
                break;
            }

            // if (string.IsNullOrEmpty(numUnitAnimName) == false)
            if (!numUnitAnimName && numUnitAnimName !== "") {
              DividedLetterInfo = new DecimalNumberDividedLetterInfo();
              DividedLetterInfo.AnimClipNames = numUnitAnimName;
              DividedLetterInfo.LetterNumber = numUnitValue;
              DividedLetterInfo.HandFace = bFaceBack
                ? eHandFace.Back
                : eHandFace.Front;
              DecimalNumberDividedLetterInfos.Add(DividedLetterInfo);
            }
          }
        }
      }
    }

    if (DecimalNumberDividedLetterInfos.length <= 0) {
      isValid = false;
      console.log(`err return 1`);
      return data.components;
    }

    // make structure
    let createdComponents = [];
    let currentLetterIndex = 0;

    _.map(DecimalNumberDividedLetterInfos, (ani, index) => {
      let filename = `Avatar_Male01@${ani.AnimClipNames}.eq4`;
      let filepath = `/Base/ETC/FingerSpell_Figure/NumberNew/`;

      let dataStructure = {
        id: "",
        animationName: ani.AnimClipNames,
        // filename: `${ani}.eq4`,
        // filepath: `/Adam/FingerSpell_Figure/Number/`,
        filename: filename,
        filepath: filepath,
        isFingerspell: true,
        totalWordLength: DecimalNumberDividedLetterInfos.length,
        currentLetterIndex: ++currentLetterIndex,
        attribute: 5,
        Transition_Duration: 0.2,
        Transition_Offset: 0,
        Speed: 0.9,
        _4_finger: true,
      };
      if (data.components.length == 0) {
        createdComponents.push(_.cloneDeep(dataStructure));
      } else {
        _.map(dataStructure, (value, key) => {
          if (!data.components[index].hasOwnProperty(key)) {
            if (key !== "_4_finger")
              data.components[index][key] = dataStructure[key];
          }
        });
      }
    });

    if (createdComponents.length > 0) {
      data.components = createdComponents;
    }
    isValid = true;

    return data.components;
  }

  async _3_setFingerspellDecimal(data) {
    data.word = data.word
      .replace(/ /g, "")
      .replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, "");
    let tmpAnimationInfo = data.sl_composition.data[0];
    tmpAnimationInfo.Transition_Offset = 0;
    tmpAnimationInfo.Exit_Time = 100;
    tmpAnimationInfo.Transition_Duration = 0.2;

    let decimalAnimations = [];
    let spliceDecimal = [];
    let sliceNumber = tmpAnimationInfo.selected_word.length - 1;
    let currentWordIndex = -1;
    let tmpDecimal = [];

    for (let i = sliceNumber; i >= 0; i--) {
      let tmp = tmpAnimationInfo.selected_word.substr(i, 1);
      tmpDecimal.push(tmp);

      if (
        (sliceNumber >= 4 &&
          (tmpAnimationInfo.selected_word.length - i) % 4 == 0) ||
        i == 0
      ) {
        tmpDecimal = tmpDecimal.reverse();
        let joinString = tmpDecimal.join("");
        spliceDecimal.push(joinString);
        tmpDecimal = [];
      }
    }

    for (let i = spliceDecimal.length - 1; i >= 0; i--) {
      if (spliceDecimal[i].length == 1 || spliceDecimal[i].length == 2) {
        if (spliceDecimal[i] != "00") {
          // decimalAnimations.push("Avatar_Male01@" + spliceDecimal[i]);
          if (spliceDecimal[i] == "10") {
            if (spliceDecimal.length > 1) {
              decimalAnimations.push("Avatar_Male01@10");
            } else {
              decimalAnimations.push("Avatar_Male01@10ㅇ");
            }
          } else {
            decimalAnimations.push("Avatar_Male01@" + spliceDecimal[i]);
          }
        }
      } else {
        if (spliceDecimal[i].length == 3) {
          if (spliceDecimal[i][0] != 0)
            decimalAnimations.push(
              "Avatar_Male01@" + spliceDecimal[i][0] + "00"
            );
          if (spliceDecimal[i][1] != 0) {
            decimalAnimations.push(
              "Avatar_Male01@" + spliceDecimal[i][1] + spliceDecimal[i][2]
            );
          } else {
            if (spliceDecimal[i][2] != 0) {
              decimalAnimations.push("Avatar_Male01@" + spliceDecimal[i][2]);
            }
          }
        } else {
          if (spliceDecimal[i][0] != 0)
            decimalAnimations.push(
              "Avatar_Male01@" + spliceDecimal[i][0] + "000"
            );
          if (spliceDecimal[i][1] != 0)
            decimalAnimations.push(
              "Avatar_Male01@" + spliceDecimal[i][1] + "00"
            );
          if (spliceDecimal[i][2] != 0) {
            decimalAnimations.push(
              "Avatar_Male01@" + spliceDecimal[i][2] + spliceDecimal[i][3]
            );
          } else {
            if (spliceDecimal[i][3] != 0) {
              decimalAnimations.push("Avatar_Male01@" + spliceDecimal[i][3]);
            }
          }
        }
      }

      if (i == 3) {
        decimalAnimations.push("Avatar_Male01@조");
      } else if (i == 2) {
        if (spliceDecimal.length > 2) {
          if (spliceDecimal[i] != "0000") {
            decimalAnimations.push("Avatar_Male01@억");
          }
        } else {
          decimalAnimations.push("Avatar_Male01@억");
        }
      } else if (i == 1) {
        if (spliceDecimal.length > 2) {
          if (spliceDecimal[i] != "0000") {
            decimalAnimations.push("Avatar_Male01@일만");
          }
        } else {
          if (spliceDecimal[i].length == 1) {
            decimalAnimations.pop();
            decimalAnimations.push(`Avatar_Male01@${spliceDecimal[i]}0000`);
          } else {
            decimalAnimations.push("Avatar_Male01@일만");
          }
        }
      }
    }

    decimalAnimations.forEach((splitWord, fingerSpellIndex) => {
      currentWordIndex++;
      tmpAnimationInfo.ani_name = splitWord;
      tmpAnimationInfo.fingerSpellIndex = fingerSpellIndex;
      tmpAnimationInfo.fingerSpellPosition = 1000000;
      tmpAnimationInfo.currentWordIndex = currentWordIndex;
      tmpAnimationInfo.animation_length = decimalAnimations.length;

      data.sl_composition.data[fingerSpellIndex] = JSON.parse(
        JSON.stringify(tmpAnimationInfo)
      );
    });
    data.sl_composition.data[data.sl_composition.data.length - 1][
      "is_final"
    ] = true;
    data.sl_composition.data[data.sl_composition.data.length - 1][
      "isFingerspell"
    ] = true;

    return data;
  }

  /**
   *  숫자(십진수) 소수점 지화의 데이터 구조를 작성한다.
   */
  async _4_setFingerspellDecimalPoint(data) {
    if (data.components.length === 0) {
      let prevData = _.cloneDeep(data);
      prevData.componentName = prevData.componentName.split(".")[0];
      let prevComponent = await this._4_setFingerspellDecimal(prevData);

      let nextData = _.cloneDeep(data);
      nextData.componentName = nextData.componentName.split(".")[1];
      let nextComponent = await this._4_setFingerspellDecimal(nextData);
      data.components = [
        ...prevComponent,
        data.breakpoint_component,
        ...nextComponent,
      ];
    }

    return data.components;
  }

  async _3_setFingerspellDate(data) {
    let month = "";
    let day = "";
    let monthRegex = data.word.match(/(\d+)월/);
    let dayRegex = data.word.match(/(\d+)일/);
    monthRegex !== null && (month = monthRegex[1]);
    dayRegex !== null && (day = dayRegex[1]);

    let dataArrs = [];

    if (month) {
      let monthObj = {
        1: { id: 4792, animationName: "4792_W_정월" },
        2: { id: 13530, animationName: "13530_W_이월" },
        3: { id: 13301, animationName: "13301_W_삼월" },
        4: { id: 13928, animationName: "13928_W_사월" },
        5: { id: 13319, animationName: "13319_W_오월" },
        6: { id: 13937, animationName: "13937_W_유월" },
        7: { id: 11998, animationName: "11998_W_칠월" },
        8: { id: 13280, animationName: "13280_W_팔월" },
        9: { id: 13358, animationName: "13358_W_구월" },
        10: { id: 24341, animationName: "24341_G_10월" },
        11: { id: 13333, animationName: "13333_W_십일월" },
        12: { id: 24136, animationName: "24136_G_12월" },
      };
      let monthData = {
        attribute: 19,
        ani_id: monthObj[Number(month)].id,
        ani_name: monthObj[Number(month)].animationName,
        animationName: monthObj[Number(month)].animationName,
        selected_word: month,
        Speed: 1,
        attributeSubIdx: 1,
      };

      dataArrs.push(monthData);
    }
    if (day) {
      let dayData = {
        ani_name: `Avatar_Male01@DayNumber${Number(day)}`,
        animationName: `Avatar_Male01@DayNumber${Number(day)}`,
        selected_word: day,
        ani_id: -1,
        attribute: 19,
        Exit_Time: 65,
        Speed: 0.8,
        attributeSubIdx: 2,
      };
      dataArrs.push(dayData);
    }
    data.sl_composition.data = dataArrs;
    return data;
  }
  // attribute: 19 월/일
  async _4_setFingerspellDate(animation) {
    if (animation.is_created) {
      let month = "";
      let day = "";
      let monthRegex = animation.componentName.match(/(\d+)월/);
      let dayRegex = animation.componentName.match(/(\d+)일/);
      monthRegex !== null && (month = monthRegex[1]);
      dayRegex !== null && (day = dayRegex[1]);

      if (month) {
        let monthObj = {
          1: { id: 4792, animationName: "정월" },
          2: { id: 13530, animationName: "이월" },
          3: { id: 13301, animationName: "삼월" },
          4: { id: 13928, animationName: "사월" },
          5: { id: 13319, animationName: "오월" },
          6: { id: 13937, animationName: "유월" },
          7: { id: 11998, animationName: "칠월" },
          8: { id: 13280, animationName: "팔월" },
          9: { id: 13358, animationName: "구월" },
          10: { id: 24341, animationName: "10월" },
          11: { id: 13333, animationName: "십일월" },
          12: { id: 24136, animationName: "12월" },
        };
        let monthData = {
          attribute: 19,
          id: monthObj[Number(month)].id,
          filename: `${monthObj[Number(month)].id}.eq4`,
          filepath: "/Base/KSL/",
          animationName: monthObj[Number(month)].animationName,
          attributeSubIdx: 1,
          // affix_type: "prefix",
        };
        // for (let key in monthData) {
        //     animation[key] = monthData[key];
        // }
        // data.animations.push(monthData);

        animation.components.push(monthData);
      }
      if (day) {
        let dayData = {
          attribute: 5,
          componentName: day,
          components: [],
          id: "",
          idx: 2,
        };
        let decimal = await this._4_setFingerspellDecimal(dayData);

        decimal[0].filename = `${decimal[0].filename.split("@")[0]}@DayNumber${
          decimal[0].filename.split("@")[1]
        }`;
        decimal[0].filepath = `/Base/ETC/FingerSpell_Figure/DayNumber/`;

        // setDynamicWord 변수추가
        decimal[0].attribute = 19;
        decimal[0].attributeSubIdx = 1;
        // decimal[0]["affix_type"] = "prefix";
        // dayData.components.push(decimal);
        // console.log(dayData);
        animation.components.push(decimal[0]);
      }
      // data.animations.splice(0, 1);
      delete animation.is_created;
    }

    return animation.components;
  }

  async _3_setFingerspellHours(data) {
    // hours 시간, 분, 시간+분
    let reHour = new RegExp(/(\d{1,2})시간/);
    let reMinute = new RegExp(/(\d{1,2})분/);
    let replacedHours = data.word.replaceAll(" ", "");
    let regexHour = reHour.exec(replacedHours);
    let regexMinute = reMinute.exec(replacedHours);

    let minuteObj = {
      5: { id: 34306, animationName: "34306_G_5분" },
      10: { id: 25981, animationName: "25981_G_십분" },
      15: { id: 26303, animationName: "26303_G_15분" },
      20: { id: 34324, animationName: "34324_G_20분" },
      25: { id: 34325, animationName: "34325_G_25분" },
      30: { id: 30616, animationName: "30616_G_삼십분" },
      35: { id: 34326, animationName: "34326_G_35분" },
      40: { id: 34327, animationName: "34327_G_40분" },
      45: { id: 34328, animationName: "34328_G_45분" },
      50: { id: 34307, animationName: "34307_G_50분" },
      55: { id: 34308, animationName: "34308_G_55분" },
    };

    let dataArrs = [];

    if (regexHour) {
      let obj = {
        ani_name: `Avatar_Male01@${regexHour[1]}시간`,
        selected_word: regexHour[1],
        ani_id: -1,
        Exit_Time: 85,
        Transition_Duration: 0.2,
        attributeSubIdx: 1,
        // cms2.0 attribute
        attribute: 73,
        Speed: 1,
      };
      dataArrs.push(obj);
    }
    if (regexMinute) {
      let minuteInfo = minuteObj[regexMinute[1]];

      let obj = {
        ani_name: minuteInfo.animationName,
        selected_word: regexMinute[1],
        ani_id: minuteInfo.id,
        Exit_Time: 65,
        Transition_Duration: 0.3,
        attributeSubIdx: 2,
        // cms2.0 attribute
        attribute: 73,
        Speed: 1,
      };
      if (regexHour) {
        obj.Transition_Offset = 15;
        // dummyComp.sl_composition.data[0].attribute = "Hours";
      }
      dataArrs.push(obj);
    }
    data.sl_composition.data = dataArrs;
    return data;
  }
  // attribute: 73 시간 시간/분
  async _4_setFingerspellHours(animation) {
    if (animation.is_created) {
      let hour = "";
      let minute = "";
      let hourRegex = animation.componentName.match(/(\d+)시간/);
      let minuteRegex = animation.componentName.match(/(\d+)분/);

      hourRegex !== null && (hour = hourRegex[1]);
      minuteRegex !== null && (minute = minuteRegex[1]);

      if (hour) {
        let hourData = {
          attribute: 73,
          id: "",
          filename: `Avatar_Male01@${hourRegex[0]}.eq4`,
          filepath: "/Base/ETC/FingerSpell_Figure/Hour/",
          animationName: hourRegex[0],
          attributeSubIdx: 1,
          Transition_Duration: 0.2,
        };
        animation.components.push(hourData);
      }
      if (minute) {
        let minuteObj = {
          5: { id: 34306, animationName: "5분" },
          10: { id: 25981, animationName: "십분" },
          15: { id: 26303, animationName: "15분" },
          20: { id: 34324, animationName: "20분" },
          25: { id: 34325, animationName: "25분" },
          30: { id: 30616, animationName: "삼십분" },
          35: { id: 34326, animationName: "35분" },
          40: { id: 34327, animationName: "40분" },
          45: { id: 34328, animationName: "45분" },
          50: { id: 34307, animationName: "50분" },
          55: { id: 34308, animationName: "55분" },
        };
        let minuteData = {
          attribute: 73,
          id: minuteObj[Number(minute)].id,
          filename: `${minuteObj[Number(minute)].id}.eq4`,
          filepath: "/Base/KSL/",
          animationName: minuteObj[Number(minute)].animationName,
          attributeSubIdx: 2,
          Transition_Offset: 15,
        };
        animation.components.push(minuteData);
      }
      delete animation.is_created;
    }
    return animation.components;
  }

  async _3_setFingerspellTime(data, additiveIdx, additiveAnimationsFile) {
    let resTime = [];
    let re = new RegExp(/(오전|오후)(\d{1,2})시(\d{1,2})*분*/);
    let replacedTime = data.word.replaceAll(" ", "");
    let regexTime = re.exec(replacedTime);
    let hour = null;
    let minute = null;
    let timeString = null;
    let dataArrs = [];

    if (regexTime[1] == "오후") {
      if (parseInt(regexTime[2]) == 12) {
        hour = 12;
      } else {
        hour = parseInt(regexTime[2]) + 12;
      }
    } else {
      if (parseInt(regexTime[2]) == 12) {
        hour = 0;
      } else {
        hour = parseInt(regexTime[2]);
      }
    }

    if (regexTime[3]) {
      minute = parseInt(regexTime[3]);
    } else {
      minute = null;
    }

    if (hour >= 6 && hour <= 11) {
      timeString = "오전";
    } else if (hour == 12 && (minute == null || minute == 0)) {
      timeString = "정오";
      hour = null;
    } else if (hour == 12 && minute != null && minute != 0) {
      timeString = "오후";
    } else if (hour >= 13 && hour <= 16) {
      timeString = "오후";
      hour = hour - 12;
    } else if (hour >= 17 && hour <= 19) {
      timeString = "저녁";
      hour = hour - 12;
    } else if (hour >= 20 && hour <= 23) {
      timeString = "밤";
      hour = hour - 12;
    } else if (hour == 24 || hour == 0) {
      timeString = "밤";
      hour = 12;
    } else if (hour >= 1 && hour <= 5) {
      timeString = "새벽";
    }

    let timeStringObj = {
      새벽: { id: 10639, animationName: "10639_W_새벽" },
      오전: { id: 5838, animationName: "5838_W_오전" },
      정오: { id: 1991, animationName: "1991_W_정오" },
      오후: { id: 5679, animationName: "5679_W_하오" },
      저녁: { id: 13574, animationName: "13574_W_저녁" },
      밤: { id: 1921, animationName: "1921_W_하룻밤" },
      hour: {
        id: -1,
        animationName: "Avatar_Male01@" + hour + "시",
        selected_word: hour,
      },
      time: {
        id: -1,
        animationName: "Avatar_Male01@" + hour + "시" + minute + "분",
        selected_word: hour + "시" + minute + "분",
      },
      timeEtc: {
        id: -1,
        animationName: "Avatar_Male01@" + hour + "시1분",
        selected_word: hour + "시" + minute + "분",
      },
      timeAdditive: {
        id: -1,
        animationName: "Avatar_Male01@1시" + minute + "분",
        selected_word: "1시" + minute + "분",
      },
    };

    let prevObj = {
      attribute: 48,
      ani_name: timeStringObj[timeString].animationName,
      selected_word: timeString,
      ani_id: timeStringObj[timeString].id,
      Exit_Time: minute < 10 ? 65 : 75,
      Speed: 1,
    };
    dataArrs.push(prevObj);

    if (timeString != "정오") {
      if (minute === null || minute === 0) {
        let timeHourData = {
          attribute: 1,
          ani_name: timeStringObj["hour"].animationName,
          selected_word: timeStringObj["hour"].selected_word,
          ani_id: -1,
          Transition_Duration: 0.35,
          Exit_Time: 65,
          Speed: 1,
        };
        dataArrs.push(timeHourData);
      } else if (hour === 1) {
        let timeHourMinuteData = {
          attribute: 48,
          ani_name: timeStringObj["time"].animationName,
          selected_word: timeStringObj["time"].selected_word,
          ani_id: -1,
          Transition_Duration: 0.35,
          Speed: 1,
        };
        dataArrs.push(timeHourMinuteData);
      } else {
        let timeHourData = {
          attribute: 48,
          id: -1,
          ani_name: timeStringObj["timeEtc"].animationName,
          animationName: timeStringObj["timeEtc"].animationName,
          selected_word: timeStringObj["timeEtc"].selected_word,
          attributeSubIdx: 1,
          Transition_Duration: 0.0,
          Exit_Time: 80,
          Speed: 1,
          addtiveIdx: additiveIdx,
        };
        let timeSubHourMinuteData = {
          attribute: 48,
          id: -1,
          ani_name: timeStringObj["timeAdditive"].animationName,
          selected_word: timeStringObj["timeAdditive"].selected_word,
          attributeSubIdx: 2,
          Transition_Duration: 0.2,
          Speed: 1,
          addtiveIdx: additiveIdx,
        };
        // additiveAnimationsFile.push(timeHourData);
        additiveAnimationsFile[additiveIdx] = timeHourData;
        // dataArrs.push(timeHourData);
        dataArrs.push(timeSubHourMinuteData);
      }
    }
    data.sl_composition.data = dataArrs;
    return data;
  }
  // attribute: 48 시각 시/분
  async _4_setFingerspellTime(animation, additiveIdx) {
    if (animation.is_created) {
      let resTime = [];
      let re = new RegExp(/(오전|오후)(\d{1,2})시(\d{1,2})*분*/);
      let replacedTime = animation.componentName.replaceAll(" ", "");
      let regexTime = re.exec(replacedTime);
      let hour = null;
      let minute = null;
      let timeString = null;

      if (regexTime[1] == "오후") {
        if (parseInt(regexTime[2]) == 12) {
          hour = 12;
        } else {
          hour = parseInt(regexTime[2]) + 12;
        }
      } else {
        if (parseInt(regexTime[2]) == 12) {
          hour = 0;
        } else {
          hour = parseInt(regexTime[2]);
        }
      }

      if (regexTime[3]) {
        minute = parseInt(regexTime[3]);
      } else {
        minute = null;
      }

      if (hour >= 6 && hour <= 11) {
        timeString = "오전";
      } else if (hour == 12 && (minute == null || minute == 0)) {
        timeString = "정오";
        hour = null;
      } else if (hour == 12 && minute != null && minute != 0) {
        timeString = "오후";
      } else if (hour >= 13 && hour <= 16) {
        timeString = "오후";
        hour = hour - 12;
      } else if (hour >= 17 && hour <= 19) {
        timeString = "저녁";
        hour = hour - 12;
      } else if (hour >= 20 && hour <= 23) {
        timeString = "밤";
        hour = hour - 12;
      } else if (hour == 24 || hour == 0) {
        timeString = "밤";
        hour = 12;
      } else if (hour >= 1 && hour <= 5) {
        timeString = "새벽";
      }

      let timeStringObj = {
        새벽: { id: 10639, animationName: "새벽" },
        오전: { id: 5838, animationName: "오전" },
        정오: { id: 1991, animationName: "정오" },
        오후: { id: 5679, animationName: "하오" },
        저녁: { id: 13574, animationName: "저녁" },
        밤: { id: 1921, animationName: "하룻밤" },
        // hour: { id: -1, animationName: "Avatar_Male01@" + hour + "시", selected_word: hour },
        // time: {
        //     id: -1,
        //     word: "Avatar_Male01@" + hour + "시" + minute + "분",
        //     selected_word: hour + "시" + minute + "분",
        // },
        // timeEtc: {
        //     id: -1,
        //     word: "Avatar_Male01@" + hour + "시1분",
        //     selected_word: hour + "시" + minute + "분",
        // },
        // timeAdditive: {
        //     id: -1,
        //     word: "Avatar_Male01@1시" + minute + "분",
        //     selected_word: "1시" + minute + "분",
        // },
      };

      let timeStringData = {
        attribute: 48,
        id: timeStringObj[timeString].id,
        filename: `${timeStringObj[timeString].id}.eq4`,
        filepath: "/Base/KSL/",
        animationName: timeStringObj[timeString].animationName,
        // attributeSubIdx: 1,
        Transition_Duration: 0.35,
      };
      animation.components.push(timeStringData);

      if (timeString !== "정오") {
        if (minute === null || minute === 0) {
          let timeHourData = {
            attribute: 1,
            id: "",
            filename: `Avatar_Male01@${hour}시.eq4`,
            filepath: `/Base/ETC/FingerSpell_Figure/Time/`,
            animationName: hour,
            // attributeSubIdx: 2,
            Transition_Duration: 0.35,
          };
          animation.components.push(timeHourData);
        } else if (hour === 1) {
          let timeHourMinuteData = {
            attribute: 48,
            id: "",
            filename: `Avatar_Male01@${hour}시${minute}분.eq4`,
            filepath: `/Base/ETC/FingerSpell_Figure/Time/`,
            animationName: `${hour}시${minute}분`,
            // attributeSubIdx: 0,
            Transition_Duration: 0.35,
          };
          animation.components.push(timeHourMinuteData);
        } else {
          let timeHourData = {
            attribute: 48,
            id: "",
            filename: `Avatar_Male01@${hour}시1분.eq4`,
            filepath: `/Base/ETC/FingerSpell_Figure/Time/`,
            animationName: `${hour}시`,
            attributeSubIdx: 1,
            Transition_Duration: 0.0,
            Exit_Time: 80,
            addtiveIdx: additiveIdx,
          };
          let timeSubHourMinuteData = {
            attribute: 48,
            id: "",
            filename: `Avatar_Male01@1시${minute}분.eq4`,
            filepath: `/Base/ETC/FingerSpell_Figure/Time/`,
            // animationName: `1시${minute}분`,
            animationName: `${hour}시${minute}분`,
            attributeSubIdx: 2,
            Transition_Duration: 0.2,
            addtiveIdx: additiveIdx,
          };
          // animation.components.push(timeHourData);
          additiveAnimationsFile[additiveIdx] = timeHourData;
          animation.components.push(timeSubHourMinuteData);
        }
      }

      delete animation.is_created;
    }

    // return [];
    return animation.components;
  }

  async _3_setFingerspellWeek(data) {
    let weekObj = {
      월: { id: 6029, animationName: "6029_W_월" },
      화: { id: 22953, animationName: "22953_G_화" },
      수: { id: 22757, animationName: "22757_G_물을마시는동작" },
      목: { id: 6681, animationName: "28248_G_나무" },
      금: { id: 27172, animationName: "27172_G_금" },
      토: { id: 22813, animationName: "22813_G_토" },
      일: { id: 33077, animationName: "33077_G_일요일" },
      end: { id: 3718, animationName: "3718_W_태양" },
    };
    let splitWeek = data.word.split(",");
    let dataArrs = [];
    for (let i = 0; i < splitWeek.length; i++) {
      let weekInfo = weekObj[splitWeek[i].split("요일")[0]];
      if (weekInfo) {
        let week = {
          attribute: 65,
          ani_id: weekInfo.id,
          selected_word: splitWeek[i].split("요일")[0],
          ani_name: weekInfo.animationName,
          Exit_Time: 65,
          Speed: 1,
        };
        dataArrs.push(week);
      }
    }

    let weekEnd = {
      attribute: 65,
      ani_id: weekObj["end"].id,
      selected_word: "요일",
      ani_name: weekObj["end"].animationName,
      Speed: 1,
    };

    dataArrs.push(weekEnd);

    data.sl_composition.data = dataArrs;
    return data;
  }
  // attribute: 65 요일
  async _4_setFingerspellWeek(animation) {
    if (animation.is_created) {
      let weekObj = {
        월: { id: 6029, animationName: "월" },
        화: { id: 22953, animationName: "화" },
        수: { id: 22757, animationName: "물을마시는동작" },
        목: { id: 6681, animationName: "나무" },
        금: { id: 27172, animationName: "금" },
        토: { id: 22813, animationName: "토" },
        일: { id: 33077, animationName: "일요일" },
        end: { id: 3718, animationName: "태양" },
      };

      let weekInfo = animation.componentName.split("요일");

      let week = {
        attribute: 65,
        id: weekObj[weekInfo[0]].id,
        filename: `${weekObj[weekInfo[0]].id}.eq4`,
        filepath: "/Base/KSL/",
        animationName: weekObj[weekInfo[0]].animationName,
        Exit_Time: 65,
      };
      let weekEnd = {
        attribute: 65,
        id: weekObj["end"].id,
        filename: `${weekObj["end"].id}.eq4`,
        filepath: "/Base/KSL/",
        animationName: weekObj["end"].animationName,
      };

      animation.components.push(week);
      animation.components.push(weekEnd);
    }
    return animation.components;
  }

  async _3_setFingerspellMonth(data) {
    let replacedMonth = data.word.trim().replace(/ /gi, "");
    let dataArrs = [];
    let monthObj = {
      한달: { id: 24926, animationName: "24926_G_한달" },
      두달: { id: 31059, animationName: "31059_G_두달" },
      세달: { id: 34334, animationName: "34334_G_세달" },
    };

    let month = {
      attribute: 66,
      ani_id: monthObj[replacedMonth].id,
      ani_name: monthObj[replacedMonth].animationName,
      selected_word: replacedMonth,
      Exit_Time: 65,
      Speed: 1,
    };
    dataArrs.push(month);

    data.sl_composition.data = dataArrs;
    return data;
  }
  // attribute: 66 개월
  async _4_setFingerspellMonth(animation) {
    if (animation.is_created) {
      let replacedMonth = animation.componentName.trim().replace(/ /gi, "");

      let monthObj = {
        한달: { id: 24926, animationName: "한달" },
        두달: { id: 31059, animationName: "두달" },
        세달: { id: 34334, animationName: "세달" },
      };

      let month = {
        attribute: 66,
        id: monthObj[replacedMonth].id,
        filename: `${monthObj[replacedMonth].id}.eq4`,
        filepath: "/Base/KSL/",
        animationName: monthObj[replacedMonth].animationName,
      };
      animation.components.push(month);
    }
    return animation.components;
  }

  async _3_setFingerspellPeople(data) {
    data = await this._3_setFingerspellDecimalUpdate(data);
    let people = {
      ani_name: `2696_W_인간`,
      animationName: `2696_W_인간`,
      ani_id: 2696,
      Exit_Time: 100,
      attribute: 67,
      selected_word: `명`,
      Speed: 1,
    };
    data.sl_composition.data.push(people);
    return data;
  }
  /**
   *  영어 지화의 fingerSpellInfo 구조를 작성한다.
   */
  async getAnimationInfoEnglish(data) {
    let AnimationIndexList = [];
    let PosIndexList = [];

    let engs = data.word.split("");
    PosIndexList = new Array(engs.length).fill(10000000);
    PosIndexList.push(-1);
    AnimationIndexList = engs;
    AnimationIndexList.push(-1);

    let obj = {
      animationIndexes: AnimationIndexList,
      positionIndexes: PosIndexList,
    };

    data["fingerSpellInfo"] = _.cloneDeep(obj);

    return data;
  }
  /**
   *  애니메이션 파일명, Duration 등 파일을 불러오기 위한 기본 정보를 설정한다.
   */
  async setDefaultAnimationInfo(data, tmpAnimationInfo) {
    let currentLetterIndex = -1;

    if (data.wAttribute === "Korean") {
      await Promise.all(
        _.map(
          data.fingerSpellInfo.animationIndexes,
          async function (splitWord, index) {
            if (splitWord === -1) return;

            tmpAnimationInfo.Transition_Duration = 0.2;

            if (
              index === 0 ||
              index === data.fingerSpellInfo.animationIndexes.length - 2
            ) {
              // tmpAnimationInfo.Transition_Duration = 0.3;
            }
            if (data.fingerSpellInfo.positionIndexes[index] === "f1") {
              currentLetterIndex++;
            }

            tmpAnimationInfo.ani_name = "Avatar_Male01@" + splitWord;
            tmpAnimationInfo.fingerSpellIndex = index;
            tmpAnimationInfo.fingerSpellPosition =
              data.fingerSpellInfo.positionIndexes[index];
            tmpAnimationInfo.attribute = "Korean";
            tmpAnimationInfo.currentLetterIndex = currentLetterIndex;
            tmpAnimationInfo.totalWordLength = data.word.length;
            tmpAnimationInfo.isFingerspell = true;
            tmpAnimationInfo.speed = 1.2;
            tmpAnimationInfo.Exit_Time = 60;

            data.sl_composition.data[index] = await _.cloneDeep(
              tmpAnimationInfo
            );
          }.bind(this)
        )
      );
    } else if (data.wAttribute === "English") {
      await Promise.all(
        _.map(
          data.fingerSpellInfo.animationIndexes,
          async function (splitWord, index) {
            if (splitWord === -1) return;

            tmpAnimationInfo.Transition_Duration = 0.2;
            currentLetterIndex++;

            tmpAnimationInfo.ani_name = "Avatar_Male01@" + splitWord;
            tmpAnimationInfo.fingerSpellIndex = index;
            tmpAnimationInfo.fingerSpellPosition =
              data.fingerSpellInfo.positionIndexes[index];
            tmpAnimationInfo.attribute = "English";
            tmpAnimationInfo.currentLetterIndex = currentLetterIndex;
            tmpAnimationInfo.totalWordLength = data.word.length;
            tmpAnimationInfo.isFingerspell = true;
            tmpAnimationInfo.Speed = 1;
            tmpAnimationInfo.Exit_Time = 60;

            data.sl_composition.data[index] = await _.cloneDeep(
              tmpAnimationInfo
            );
          }.bind(this)
        )
      );
    }

    return data;
  }
}

export { FingerSpells };
