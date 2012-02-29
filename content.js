var orientationBound = false,
	focused = false,
	active = false,
	enabled = false,
	calibration = 0;

function handleOrientation(e){
	var tilt = e.beta - calibration, delta;
	if(Math.abs(tilt) > 2){
		delta = Math.pow(Math.abs(tilt) / 2, 2.5) * (tilt < 0 ? 1 : -1);
		window.scrollBy(0, delta); 
	}
};

function handleFocus(){
	focused = true;
	if (enabled) {
		setActive(true);
	}
}

function handleBlur(){
	focused = false;
	setActive(false);
}

window.addEventListener('focus', handleFocus, false);
window.addEventListener('blur', handleBlur, false);

function setActive(active){
	if (!orientationBound && active){
		window.addEventListener('deviceorientation', handleOrientation, false);
		orientationBound = true;
	} else if (orientationBound && !active) {
		window.removeEventListener('deviceorientation', handleOrientation, false);
		orientationBound = false;
	}
}


var port = chrome.extension.connect();
port.onMessage.addListener(function(message){
	if (message.active){
		handleFocus();
	}
	if ('calibration' in message) {
		calibration = message.calibration;
	}
	if ('enabled' in message) {
		if (message.enabled) {
			enabled = true;
			if (focused) {
				setActive(true);
			}
		} else {
			enabled = false;
			setActive(false);
		}
	}
});
