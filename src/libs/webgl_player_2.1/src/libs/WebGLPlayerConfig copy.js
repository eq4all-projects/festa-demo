class WebGLPlayerConfig {
  constructor(system, env) {
    this.system = system;
    this.env = env || "development";
    this.getAvatarList = system === "CMS2.0" ? "avatars" : "/avatars";

    const config = {
      AzureService: {
        fileOrigin: process.env.AZURE_SERVICE_FILE_ORIGIN,
        APIOrigin: process.env.AZURE_SERVICE_API_ORIGIN,
      },
      "CMS2.0": {
        webpOrigin: "/static/gifs/",
        fileOrigin: process.env.CMS2_FILE_ORIGIN,
        APIOrigin: process.env.CMS2_API_ORIGIN,
      },
      webOS: {
        fileOrigin: process.env.WEBOS_FILE_ORIGIN,
        APIOrigin: process.env.WEBOS_API_ORIGIN,
      },
      NKS: {
        fileOrigin: process.env.NKS_FILE_ORIGIN,
        APIOrigin:
          this.env === "production"
            ? process.env.PROD_NKS_API_ORIGIN
            : process.env.DEV_NKS_API_ORIGIN,
      },
      museum: {
        fileOrigin: process.env.MUSEUM_FILE_ORIGIN,
        APIOrigin: process.env.MUSEUM_API_ORIGIN,
      },
      TestServer: {
        fileOrigin: process.env.TEST_SERVER_FILE_ORIGIN,
        APIOrigin: process.env.TEST_SERVER_API_ORIGIN,
      },
    };

    const systemConfig = config[system];
    if (systemConfig) {
      Object.assign(this, systemConfig);
    }

    console.log("Environment Variables:", {
      AZURE_SERVICE_FILE_ORIGIN: process.env.AZURE_SERVICE_FILE_ORIGIN,
      AZURE_SERVICE_API_ORIGIN: process.env.AZURE_SERVICE_API_ORIGIN,
      CMS2_FILE_ORIGIN: process.env.CMS2_FILE_ORIGIN,
      CMS2_API_ORIGIN: process.env.CMS2_API_ORIGIN,
      WEBOS_FILE_ORIGIN: process.env.WEBOS_FILE_ORIGIN,
      WEBOS_API_ORIGIN: process.env.WEBOS_API_ORIGIN,
      NKS_FILE_ORIGIN: process.env.NKS_FILE_ORIGIN,
      DEV_NKS_API_ORIGIN: process.env.DEV_NKS_API_ORIGIN,
      PROD_NKS_API_ORIGIN: process.env.PROD_NKS_API_ORIGIN,
      MUSEUM_FILE_ORIGIN: process.env.MUSEUM_FILE_ORIGIN,
      MUSEUM_API_ORIGIN: process.env.MUSEUM_API_ORIGIN,
      TEST_SERVER_FILE_ORIGIN: process.env.TEST_SERVER_FILE_ORIGIN,
      TEST_SERVER_API_ORIGIN: process.env.TEST_SERVER_API_ORIGIN,
    });
  }

  characterJsonFileAPI() {
    const fileMap = {
      AzureService: "models/Character.json",
      museum: "models/Character.json",
      NKS: "models/Character.json",
      "CMS2.0": "Character.json",
      webOS: "/json",
    };
    return fileMap[this.system];
  }

  characterJSONParse(json) {
    const parseMap = {
      AzureService: json.Model,
      museum: json.Model,
      NKS: json.Model,
      TestServer: json.Model,
      "CMS2.0": `characters/${json.Name}/${json.Model.split("/")[2]}`,
      webOS: `/${json.Model.split("/")[2].split(".")[0]}`,
    };
    return parseMap[this.system];
  }

  getCharacterFileName(json) {
    return json.Model.split("/")[2].split(".")[0];
  }

  lightAPI(characterName) {
    const lightMap = {
      AzureService: `models/${characterName}/${characterName}.light`,
      museum: `models/${characterName}/${characterName}.light`,
      NKS: `models/${characterName}/${characterName}.light`,
      TestServer: `models/${characterName}/${characterName}.light`,
      "CMS2.0": `characters/${characterName}/${characterName}.light`,
      webOS: `/json/${characterName}.light`,
    };
    return lightMap[this.system];
  }

  getSentenceInfoAPI(id) {
    if (this.system === "CMS2.0") {
      return `sentences/${id}`;
    }
    return null;
  }

  getSentenceAPI(id) {
    const sentenceMap = {
      AzureService: "service-api/sendtoplayerregardlessofclscode/",
      "CMS2.0": `sentences/${id}/glosses`,
    };
    return sentenceMap[this.system];
  }

  getLv4SentenceAPI() {
    const lv4Map = {
      AzureService: "service-api/playerbylv4/",
      museum: "service-api/playerbylv4/",
      TestServer: "service-api/playerbylv4/",
      "CMS2.0": "",
    };
    return lv4Map[this.system];
  }

  getTextSentenceAPI() {
    if (this.system === "AzureService") {
      return "service-api/sentenceplayer/";
    }
    return null;
  }

  getEq4FileAPI() {
    const eq4Map = {
      AzureService: "service-api/eq4file/",
      museum: "service-api/eq4file/",
      TestServer: "service-api/eq4file/",
      "CMS2.0": "",
      NKS: "",
      webOS: "/animation",
    };
    return eq4Map[this.system];
  }

  getEq4Filepath(animation) {
    if (["AzureService", "NKS", "museum", "TestServer"].includes(this.system)) {
      return animation;
    } else if (this.system === "CMS2.0") {
      if (animation.filepath === "/Adam/ManualSignLang/") {
        return `animations/Base/KSL/${animation.id}.eq4`;
      } else {
        return `animations${animation.filepath}${animation.filename}`;
      }
    } else if (this.system === "webOS") {
      let fileName = animation
        .split("/")
        .pop()
        .replace(".eq4", "")
        .split("_")[0];
      return isNaN(fileName) ? fileName : fileName.split("_")[0];
    }
  }

  getEq4FileAllListAPI() {
    const eq4ListMap = {
      AzureService: "service-api/eq4Files",
      NKS: "service-api/eq4Files",
      museum: "service-api/eq4Files",
      TestServer: "service-api/eq4Files",
      "CMS2.0": undefined,
      webOS: "/json/eq4Files.json",
    };
    return eq4ListMap[this.system];
  }

  getAvatarStructureAPI(avatarName) {
    const avatarMap = {
      AzureService: "service-api/retrieve-customavatar/",
      NKS: "service-api/retrieve-customavatar/",
      "CMS2.0": `avatars/structure/${avatarName}`,
      webOS: "/json/customAvatar.json",
      museum: "service-api/retrieve-customavatar/",
      TestServer: "service-api/retrieve-customavatar/",
    };
    return avatarMap[this.system];
  }

  getPartFileAPI(character, part) {
    const partMap = {
      AzureService: `models/${character}/${part}.FBX`,
      NKS: `models/${character}/${part}.FBX`,
      museum: `models/${character}/${part}.FBX`,
      TestServer: `models/${character}/${part}.FBX`,
      "CMS2.0":
        part.search(".FBX") > -1
          ? `characters/${character}/${part}`
          : `characters/${character}/${part}.FBX`,
      webOS: part,
    };
    return partMap[this.system];
  }

  getTextureFileAPI(character, part) {
    const textureMap = {
      AzureService: `models/${character}/${part}`,
      NKS: `models/${character}/${part}`,
      museum: `models/${character}/${part}`,
      TestServer: `models/${character}/${part}`,
      "CMS2.0": `characters/${character}/${encodeURIComponent(part)}`,
    };
    return textureMap[this.system];
  }

  getIdleFile() {
    const idleMap = {
      AzureService: "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4",
      museum: "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4",
      TestServer: "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4",
      "CMS2.0": "animations/Base/ETC/Idle/Avatar_Male01@Idle02.eq4",
      webOS: "/Avatar_Male01@Idle",
      NKS: "models/Adam/Idle/Avatar_Male01@Idle.eq4",
    };
    return idleMap[this.system];
  }

  getLeftArmIdleFile() {
    const leftArmMap = {
      AzureService: "?filepath=Adam/Idle/Avatar_Male01@Idle_LeftArm.eq4",
      museum: "?filepath=Adam/Idle/Avatar_Male01@Idle_LeftArm.eq4",
      TestServer: "?filepath=Adam/Idle/Avatar_Male01@Idle_LeftArm.eq4",
      "CMS2.0": "animations/Base/ETC/Idle/Avatar_Male01@Idle_LeftArm.eq4",
      webOS: "/Avatar_Male01@Idle_LeftArm",
      NKS: "models/Adam/Idle/Avatar_Male01@Idle.eq4",
    };
    return leftArmMap[this.system];
  }

  getAngryFile() {
    const angryMap = {
      AzureService: "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4",
      museum: "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4",
      TestServer: "?filepath=Adam/Idle/Avatar_Male01@Idle.eq4",
      "CMS2.0": "animations/Base/ETC/NonManualSignLang/Angry_2.eq4",
      webOS: "/Avatar_Male01@Idle",
      NKS: "models/Adam/Idle/Avatar_Male01@Idle.eq4",
    };
    return angryMap[this.system];
  }

  getDynamicWord(dynamic) {
    return `dynamic_word_type/${dynamic}`;
  }

  healthCheckAPI() {
    if (this.system === "AzureService") {
      return {
        url: "service-api/retrieve-customavatar/",
        data: {
          type: 13,
          search: "Eve",
          by: 23,
          method: 1,
          input_change_flag: 1,
        },
      };
    }
    return null;
  }

  getAutoTranslationAPI() {
    if (this.system === "AzureService") {
      return "https://service-az.eq4all.co.kr:5016/";
    }
    return null;
  }
}

export { WebGLPlayerConfig };
