class WebGLPlayerConfig {
  constructor(system) {
    this.system = system;

    if (system === "AzureService") {
      // this.fileOrigin = "https://tiny-appsvr.eq4all.co.kr:444/";
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6003";
      this.fileOrigin = `${API_URL}/service-api/`;
      this.APIOrigin = `${API_URL}/`;
      this.getAvatarList = "/avatars";
    } else if (system === "CMS2.0") {
      this.webpOrigin = "/static/gifs/";
      this.fileOrigin = "/static/models/";
      this.APIOrigin = "/api/v1/";
      this.getAvatarList = "avatars";
    } else if (system === "webOS") {
      this.fileOrigin = "resource";
      this.APIOrigin = "resource";
      this.getAvatarList = "/avatars";
    } else if (system === "NKS") {
      this.fileOrigin = "https://contents.suzitown.com/";
      this.APIOrigin = "https://web-sl-avatar-player.suzitown.com/api/";
    } else if (system === "museum") {
      // this.fileOrigin = "http://192.168.1.250:8005/service-api/";
      // this.APIOrigin = "http://192.168.1.250:8005/";
      this.fileOrigin = "http://101.79.81.249:8000/service-api/";
      this.APIOrigin = "http://101.79.81.249:8002/";
      this.getAvatarList = "/avatars";
    } else if (system === "TestServer") {
      this.fileOrigin = "http://192.168.1.250:8005/service-api/";
      this.APIOrigin = "http://192.168.1.250:8005/";
      this.getAvatarList = "/avatars";
    }
  }

  characterJsonFileAPI() {
    if (this.system === "AzureService") {
      return "models/Character.json";
    } else if (this.system === "CMS2.0") {
      return "Character.json";
    } else if (this.system === "webOS") {
      return "/json";
    } else if (this.system === "NKS") {
      return "models/Character.json";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "models/Character.json";
    }
  }

  // characterJsonFileQuery() {
  //     if (this.system === "AzureService") {
  //         return {};
  //     } else if (this.system === "CMS2.0") {
  //         return "Character.json";
  //     } else if (this.system === "webOS") {
  //         return "/Character.json";
  //     }
  // }

  characterJSONParse(json) {
    if (this.system === "AzureService") {
      return json.Model;
    } else if (this.system === "CMS2.0") {
      let characterFileName = json.Model.split("/");
      return "characters/" + json.Name + "/" + characterFileName[2];
    } else if (this.system === "webOS") {
      let characterFileName = json.Model.split("/");
      return `/${characterFileName[2].split(".")[0]}`;
    } else if (this.system === "NKS") {
      return json.Model;
    } else if (this.system === "museum" || this.system === "TestServer") {
      return json.Model;
    }
  }

  getCharacterFileName(json) {
    let characterFileName = json.Model.split("/");
    let split = characterFileName[2].split(".");
    return split[0];
  }

  // getCharacters() {
  //     return "characters";
  // }

  lightAPI(characterName) {
    if (this.system === "AzureService") {
      return "models/" + characterName + "/" + characterName + ".light";
    } else if (this.system === "CMS2.0") {
      return "characters/" + characterName + "/" + characterName + ".light";
    } else if (this.system == "webOS") {
      return `/json/${characterName}.light`;
    } else if (this.system === "NKS") {
      return "models/" + characterName + "/" + characterName + ".light";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "models/" + characterName + "/" + characterName + ".light";
    }
  }

  getSentenceInfoAPI(id) {
    if (this.system === "AzureService") {
      // return "service-api/sendtoplayerregardlessofclscode/";
    } else if (this.system === "CMS2.0") {
      return "sentences/" + id;
    }
  }

  getSentenceAPI(id) {
    if (this.system === "AzureService") {
      return "service-api/sendtoplayerregardlessofclscode/";
    } else if (this.system === "CMS2.0") {
      return "sentences/" + id + "/glosses";
    }
  }

  // setSentenceAPI(id) {
  //     if (this.system === "AzureService") {
  //         return null;
  //         // return "service-api/sendtoplayerregardlessofclscode/";
  //     } else if (this.system === "CMS2.0") {
  //         return "sentences/" + id + "/glosses";
  //     }
  // }

  getLv4SentenceAPI() {
    if (this.system === "AzureService") {
      return "service-api/playerbylv4/";
    } else if (this.system === "CMS2.0") {
      return "";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "service-api/playerbylv4/";
    }
  }

  getTextSentenceAPI() {
    if (this.system === "AzureService") {
      return "service-api/sentenceplayer/";
    }
  }

  getEq4FileAPI() {
    if (this.system === "AzureService") {
      return "service-api/eq4file/";
    } else if (this.system === "CMS2.0") {
      return "";
    } else if (this.system === "webOS") {
      return "/animation";
    } else if (this.system === "NKS") {
      return "";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "service-api/eq4file/";
    }
  }

  getEq4Filepath(animation) {
    if (this.system === "AzureService") {
      return animation;
    } else if (this.system === "CMS2.0") {
      if (animation.filepath == "/Adam/ManualSignLang/") {
        // if (animation.language == 1) return "animations/Base/KSL/" + animation.id + ".eq4";
        // else if (animation.language == 2) return "animations/Base/ASL/" + animation.id + ".eq4";
        return "animations/Base/KSL/" + animation.id + ".eq4";
      } else {
        return "animations" + animation.filepath + animation.filename;
      }
    } else if (this.system === "webOS") {
      let splitAniname = animation.split("/");
      let fileName = splitAniname[splitAniname.length - 1].replace(".eq4", "");
      if (!isNaN(fileName.split("_")[0])) {
        fileName = fileName.split("_")[0];
      }

      return `${fileName}`;
    } else if (this.system === "NKS") {
      return animation;
    } else if (this.system === "museum" || this.system === "TestServer") {
      return animation;
    }
  }

  getEq4FileAllListAPI() {
    if (this.system === "AzureService") {
      return "service-api/eq4Files";
    } else if (this.system === "CMS2.0") {
      return;
    } else if (this.system == "webOS") {
      return "/json/eq4Files.json";
    } else if (this.system === "NKS") {
      return "service-api/eq4Files";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "service-api/eq4Files";
    }
  }

  getAvatarStructureAPI(avatarName) {
    if (this.system === "AzureService") {
      return "service-api/retrieve-customavatar/";
    } else if (this.system === "CMS2.0") {
      return "avatars/structure/" + avatarName;
    } else if (this.system == "webOS") {
      return "/json/customAvatar.json";
    } else if (this.system === "NKS") {
      return "service-api/retrieve-customavatar/";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "service-api/retrieve-customavatar/";
    }
  }

  getPartFileAPI(character, part) {
    if (this.system === "AzureService") {
      return "models/" + character + "/" + part + ".FBX";
    } else if (this.system === "CMS2.0") {
      if (part.search(".FBX") > -1)
        return "characters/" + character + "/" + part;
      else return "characters/" + character + "/" + part + ".FBX";
    } else if (this.system === "webOS") {
      return part;
    } else if (this.system === "NKS") {
      return "models/" + character + "/" + part + ".FBX";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "models/" + character + "/" + part + ".FBX";
    }
  }

  getTextureFileAPI(character, part) {
    if (this.system === "AzureService") {
      return "models/" + character + "/" + part;
    } else if (this.system === "CMS2.0") {
      return "characters/" + character + "/" + encodeURIComponent(part);
    } else if (this.system === "NKS") {
      return "models/" + character + "/" + part;
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "models/" + character + "/" + part;
    }
  }

  getIdleFile() {
    if (this.system === "AzureService") {
      // return "Adam/Idle/Avatar_Male01@Idle.eq4";
      return "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4";
    } else if (this.system === "CMS2.0") {
      return "animations/Base/ETC/Idle/Avatar_Male01@Idle02.eq4";
    } else if (this.system === "webOS") {
      return "/Avatar_Male01@Idle";
    } else if (this.system === "NKS") {
      return "models/Adam/Idle/Avatar_Male01@Idle.eq4";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4";
    }
  }

  getLeftArmIdleFile() {
    if (this.system === "AzureService") {
      // return "Adam/Idle/Avatar_Male01@Idle.eq4";
      return "?filepath=Adam/Idle/Avatar_Male01@Idle_LeftArm.eq4";
    } else if (this.system === "CMS2.0") {
      return "animations/Base/ETC/Idle/Avatar_Male01@Idle_LeftArm.eq4";
    } else if (this.system === "webOS") {
      return "/Avatar_Male01@Idle_LeftArm";
    } else if (this.system === "NKS") {
      return "models/Adam/Idle/Avatar_Male01@Idle.eq4";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4";
    }
  }

  getAngryFile() {
    if (this.system === "AzureService") {
      // return "Adam/Idle/Avatar_Male01@Idle.eq4";
      return "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4";
    } else if (this.system === "CMS2.0") {
      return "animations/Base/ETC/NonManualSignLang/Angry_2.eq4";
    } else if (this.system === "webOS") {
      return "/Avatar_Male01@Idle";
    } else if (this.system === "NKS") {
      return "models/Adam/Idle/Avatar_Male01@Idle.eq4";
    } else if (this.system === "museum" || this.system === "TestServer") {
      return "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4";
    }
  }

  getDynamicWord(dynamic) {
    return `dynamic_word_type/${dynamic}`;
  }

  healthCheckAPI(characterName = "Eve") {
    if (this.system === "AzureService") {
      return {
        url: "service-api/retrieve-customavatar/",
        data: {
          type: 13,
          search: characterName,
          by: 23,
          method: 1,
          input_change_flag: 1,
        },
      };
    } else return null;
  }

  getAutoTranslationAPI() {
    if (this.system === "AzureService") {
      return "https://service-az.eq4all.co.kr:5016/";
    }
  }
}

export { WebGLPlayerConfig };
