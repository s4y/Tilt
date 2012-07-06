var orientationBound = false,
	focused = false,
	active = false,
	enabled = false,
	calibration = 0,
	config = null,
	samples = [0, 0, 0, 0];

var scroller = {
	rate: 0,
	maxInterval: 60,
	curInterval: null,
	interval: null,
	reducedSpeed: false,
	tick: function(){
		window.scrollBy(0, this.rate);
	},
	setSpeed: function(rate){
		var magnitude = Math.abs(rate);
		this.rate = rate;
		if (rate === 0 && this.interval) {
			clearInterval(this.interval);
			this.interval = null;
			this.reducedSpeed = false;
		} else if (magnitude > 0 && magnitude < 1) {
			if (this.interval){
				clearInterval(this.interval);
			}
			this.rate = 1 * (rate < 0 ? -1 : 1);
			this.interval = setInterval(this.tick.bind(this), 15 / magnitude);
			this.reducedSpeed = true;
		} else if (rate !== 0 && (!this.interval || this.reducedSpeed)) {
			if (this.interval) {
				clearInterval(this.interval);
			}
			this.interval = setInterval(this.tick.bind(this), 15);
			this.reducedSpeed = false;
		}
	}
}

function handleOrientation(e){
	var tilt, rate;
	samples.push(e.beta - calibration);
	samples.shift();
	tilt = samples.reduce(function(acc, n){ return acc + n; }, 0) / samples.length;
	if(Math.abs(tilt) > config.deadZone){
		rate = Math.pow(Math.abs(tilt) - config.deadZone, 1.5) * (tilt < 0 ? 1 : -1);
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
	var oldSamples, i, smoothness;
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
	if ('config' in message){
		if (!config || config.smoothness != message.config.smoothness) {
			oldSamples = samples;
			samples = [];
			smoothness = message.config.smoothness;
			for (i = 0; i < smoothness; i++){
				if(oldSamples.length){
					samples.unshift(oldSamples.pop());
				} else {
					samples.unshift(0);
				}
			}
		}
		config = message.config;
	}
});
