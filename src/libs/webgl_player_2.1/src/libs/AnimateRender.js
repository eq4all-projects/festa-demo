let reqAniFrame = 0;

/** 
 *
 *  @수정일시 : 2024. 04. 11
 *  @함수내용 : 수어 애니메이션 시작
 *  @param {null}
 *  @return {void}
 * 
*/
function createRender() {
    module.webGLPlayer.webGlRender();
    reqAniFrame = requestAnimationFrame(createRender);             
}

/** 
 *
 *  @수정일시 : 2024. 04. 11
 *  @함수내용 : 수어 애니메이션 종료
 *  @param {null}
 *  @return {void} 
 * 
*/

function cancelRender() {
    cancelAnimationFrame(reqAniFrame);
}

/** 
 *  @수정일시 : 2024. 04. 11
 *  @함수내용 : 수어 애니메이션 종료 및 자원 회수
 *  @param {null}
 *  @return {void} 
 * 
*/

function removeRender() {
    cancelRender();
    module.webGLPlayer.unloadFBXModel();
}

/** 
 *  @수정일시 : 2024. 04. 11
 *  @함수내용 : 수어 애니메이션 새로고침
 *  @param {null}
 *  @return {void} 
 * 
*/

function refreshRender() { 
    removeRender();
    createRender();
}

/** 
 *  @수정일시 : 2024. 04. 11
 *  @함수내용 : 수어 애니메이션 callback에 따른 동작
 *  @param {Object} callback
 *  @return {void} 
 * 
*/

function callbackRender(callback) {
    if(callback.message === "play done"){
        removeRender();
    }else if(callback.message === "play stop") {
        refreshRender();
    }
}