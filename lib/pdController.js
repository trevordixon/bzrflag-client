var normalizeAngle = require('./normalizeAngle');

function pdController(yt, xt, prev_yt, prev_xt, timeChange, Kp, Kd, differenceFunction) {
	Kp = Kp || 0.1;
	Kd = Kd || 0.1;
	if(differenceFunction === undefined) {
		differenceFunction = function(a, b) { return normalizeAngle(a - b); };
	}

	var p = Kp * differenceFunction(yt, xt);
	if(prev_yt === undefined || prev_xt === undefined || timeChange === undefined) {
		return p;
	} else {
		return p + Kd * (differenceFunction(yt, xt) - differenceFunction(prev_yt, prev_xt))/timeChange;
	}
}

function pdControllerError(currentError, lastError, timeChange, Kp, Kd) {
	Kp = Kp || 0.1;
	Kd = Kd || 0.1;
	var pd = Kp * currentError + Kd * lastError / timeChange;
	return pd;
}

module.exports = {
	pdController: pdController,
	pdControllerError: pdControllerError
}