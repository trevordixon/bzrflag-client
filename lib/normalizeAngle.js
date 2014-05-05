// Take any angle and return angle between +pi, -pi
function normalizeAngle(angle) {
	while(angle > Math.PI) {
		angle = angle - 2 * Math.PI;
	}
	while(angle < -Math.PI) {
		angle = angle + 2 * Math.PI;
	}
	return angle;
}

module.exports = normalizeAngle;