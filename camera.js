const video = document.querySelector('#webcam'); //canny
const enableWebcamButton = document.querySelector('#enableWebcamButton');  // canny
const enableWebcamButton2 = document.querySelector('#enableWebcamButton2'); // pencil
const disableWebcamButton = document.querySelector('#disableWebcamButton'); // canny
const canvas = document.querySelector('#outputCanvas');// canny

var TL=undefined ;
var TH=undefined ;
var flag = undefined ; // true 代表是 Canny、False代表Pencil

function checkvalue() {
    // 判斷TH、TL格式
	TL=document.getElementById("TL").value;
	TH=document.getElementById("TH").value;
	if ( TL == '' || TL == undefined || TL == null ) {
	  alert("尚未輸入Threshold1");
	  return false ;
	} // if
	
	if ( TH == '' || TH == undefined || TH == null ) {
	  alert("尚未輸入Threshold2");
	  return false ;
	} // if
	
	if ( !isNumber(TH) || !isNumber(TL) ) {
	  alert("請輸入數字");
	  return false ;
	} // if 
	
	if( parseInt(TL) > parseInt(TH) ){
		alert("Threshold1 需小於 Threshold2\n請重新輸入");
		return false   ;
	} // if 
	
	if ( ( TH > 255 || TH < 1 ) || ( TL > 255 || TL < 1 ) ) {
		alert("Input需在0~255之間\n請重新輸入");
		return false   ;
	} // if 

	flag = true ; // 設定成Cannoy
	enableCam() ; // 執行相機流程
	return true  ;
}

function isNumber(val){

    var regPos = /^[0-9]+.?[0-9]*/; //判断是否是数字。
  
    if(regPos.test(val) ){
        return true;
    }else{
        return false;
    }
}

// --------------以上為input的判斷-------------------

function onOpenCvReady() {
  document.querySelector('#status').innerHTML = 'opencv.js is ready.';
  /* enable the button */
  enableWebcamButton.disabled = false;
  enableWebcamButton2.disabled = false;
}

/* Check if webcam access is supported. */
function getUserMediaSupported() {
  /* Check if both methods exists.*/
  
  return !!(navigator.mediaDevices &&
	navigator.mediaDevices.getUserMedia);
    /* alternative approach 
    return ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
    */
}
  
  /* 
   * If webcam is supported, add event listener to button for when user
   * wants to activate it to call enableCam function which we will 
   * define in the next step.
   */

if ( getUserMediaSupported()) {
	
	enableWebcamButton.addEventListener('click', checkvalue); // cannoy
	enableWebcamButton2.addEventListener('click', enableCam); // pencil
	disableWebcamButton.addEventListener('click', disableCam); // terminate
} else {
	console.warn('getUserMedia() is not supported by your browser');
}

function enableCam() {
  // 若flag為true則代表是canny、不可設成pencil
  if ( flag != true ) {
	flag = false ;
  } // if 

  
  /* disable this button once clicked.*/
  // event.target.disabled = true; // 移到相機成功開啟後
  
  /* show the video and canvas elements */
  document.querySelector("#liveView").style.display = "block";

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', processVid);
  })
  .catch(function(err){
    console.error('Error accessing media devices.', error);
  });
  
};


function disableCam(event) {
    event.target.disabled = true;
    enableWebcamButton.disabled = false;
    enableWebcamButton2.disabled = false;
    /* stop streaming */
    video.srcObject.getTracks().forEach(track => {
      track.stop();
    })

    /* clean up. some of these statements should be placed in processVid() */
    video.srcObject = null;
    video.removeEventListener('loadeddata', processVid);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    document.querySelector("#liveView").style.dissplay = "none";
	
	flag = undefined ; // reset判斷的flag
}

function processVid() {
	
	/* disable this button once clicked.*/

    if (video.srcObject == null) {
      return;
    }
    let cap = new cv.VideoCapture(video);
    /* 8UC4 means 8-bit unsigned int, 4 channels */
    let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    cap.read(frame);
	
	
	enableWebcamButton.disabled = true; // pencil true、cannoy false
	enableWebcamButton2.disabled = true; // cannoy true、pencil false
	/* show the disable webcam button once clicked.*/
	disableWebcamButton.disabled = false;
    if ( flag == true ) {
		processFrame(frame);
	} // if 
	else if ( flag == false ) {
		processFrame2(frame);
	} // else if 
}

function processFrame(src) {
    let dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.Canny(src, dst, parseInt(TL), parseInt(TH) );
    cv.imshow('outputCanvas', dst);
    src.delete();
    dst.delete();
    /* Call this function again to keep processing when the browser is ready. */
    window.requestAnimationFrame(processVid);
}

function processFrame2(src) { // pencil 
    let dst = new cv.Mat();
	let dst_smooth = new cv.Mat() ;
	let dst_invert = src ;
	let dst_gray = new cv.Mat() ;
	let dst_blend = new cv.Mat() ;
    cv.cvtColor(src, dst_gray, cv.COLOR_RGBA2GRAY); // 灰色
	// ----------負片------------
	cv.bitwise_not( dst_gray, dst_invert )
	// ----------模糊------------
	let ksize = new cv.Size(21, 21);
	cv.GaussianBlur(dst_invert, dst_smooth, ksize, 0, 0, cv.BORDER_DEFAULT); // 模糊
	// -----------------blend mode ----------------
	for ( j = 0 ; j < dst_smooth.rows ; j++ ) {
		for( i = 0 ; i < dst_smooth.cols ; i++ ) {
			dst_smooth.ucharPtr(j,i)[0] = 255 - dst_smooth.ucharPtr(j,i)[0] ;
		} // for 
	} // for 
	cv.divide( dst_gray, dst_smooth, dst_blend, scale = 256 )
    cv.imshow('outputCanvas', dst_blend );
    src.delete();
    dst.delete();
    dst_smooth.delete();
	dst_gray.delete();
	dst_blend.delete();
    /* Call this function again to keep processing when the browser is ready. */
    window.requestAnimationFrame(processVid);
}



