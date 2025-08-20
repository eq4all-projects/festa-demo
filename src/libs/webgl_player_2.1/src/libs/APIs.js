import axios from "axios";

const callAxios = async (url, method, data, params, system) => {
  const options = {
    url: url,
    method: method,
    data: data,
    params: params,
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6003";
  if (
    url.search("https://service-az.eq4all.co.kr:8003/") > -1 ||
    url.search("https://museum.eq4all.co.kr:8000/") > -1 ||
    url.search(API_URL) > -1
  ) {
    options.headers = { version: "0.1" };
  }

  if (system === "AzureService") {
    if (url.search(".eq4$") > -1) {
      // options.headers["Accept"] = "text/plain";
      // options.headers["Content-Type"] = "text/plain; charset=x-user-defined";
      // options.headers = {
      //     Accept: "text/plain",
      //     "Content-Type": "text/plain; charset=x-user-defined",
      // };
    }
  } else if (system === "CMS2.0") {
    if (url.search("animations-gif") > -1) {
      // options.headers = {
      //     Accept: "text/plain",
      //     "Content-Type": "text/plain; charset=x-user-defined",
      // };

      options.headers = {
        "Content-Type": "multipart/form-data",
      };
    }
  }

  try {
    const response = await axios(options);
    return response;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};

function queryStringList(queryString) {
  let result = {};

  if (!queryString) {
    return result;
  }

  let string = queryString.split("?")[1];
  let strings = string.split("&");

  strings.map((query) => {
    let tmp = query.split("=");
    result[tmp[0]] = tmp[1];
  });

  return result;
}

/**
 *   local resource load
 */
async function xhrRequest(url, fileType, data, params, system) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (xhr.readyState === xhr.DONE) {
        if (fileType == "arrayBuffer") {
          const fileReader = new FileReader();

          fileReader.readAsArrayBuffer(xhr.response);
          fileReader.onload = function (e) {
            resolve(e.target.result);
          };
        } else if (fileType == "dataUrl") {
          const fileReader = new FileReader();

          fileReader.readAsDataURL(xhr.response);
          fileReader.onload = function (e) {
            resolve(e.target.result);
          };
        } else {
          let xhrResult = JSON.parse(xhr.responseText);

          let result = {
            data: Array.isArray(xhrResult) ? xhrResult : [xhrResult],
          };

          resolve(result);
        }
      } else {
        reject(xhr.responseText);
      }
    };

    if (typeof params == "object") {
      params = params.filepath;
    }
    xhr.open("GET", `${url}${params}`, true);
    if (fileType == "arrayBuffer" || fileType == "dataUrl") {
      xhr.responseType = "blob";
    } else {
      xhr.overrideMimeType("application/json");
    }
    xhr.send();
  });
}

async function apiDispatcher(url, method, data, params, system) {
  if (system == "webOS") {
    return await xhrRequest(url, method, data, params, system);
  } else {
    return await callAxios(url, method, data, params, system);
  }
}

export { callAxios, queryStringList, xhrRequest, apiDispatcher };
