var orientationBound = false,
	focused = false,
	active = false,
	enabled = false,
	calibration = 0,
	samples = [0, 0, 0, 0];

var scroller = {
	rate: 0,
	interval: null,
	tick: function(){
		window.scrollBy(0, this.rate);
	},
	setSpeed: function(rate){
		this.rate = rate;
		if (rate === 0 && this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		} else if (rate !== 0 && !this.interval) {
			this.interval = setInterval(this.tick.bind(this), 15);
		}
	}
}

function handleOrientation(e){
	var tilt, rate;
	samples.push(e.beta - calibration);
	samples.shift();
	tilt = samples.reduce(function(acc, n){ return acc + n; }, 0) / samples.length;
	if(Math.abs(tilt) > 1){
		rate = Math.pow(Math.abs(tilt), 1.5) * (tilt < 0 ? 1 : -1);
		scroller.setSpeed(rate);
	} else {
		scroller.setSpeed(0);
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
		scroller.setSpeed(0);
		for (var i = samples.length - 1; i >= 0; i--){
			samples[i] = 0;
		}
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