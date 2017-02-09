var firebase = require('firebase');
var fs = require('fs');

module.exports = function(projectName) {
	var config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
	var app = firebase.initializeApp(config);
	if (config.auth.anonymous) {
		return app.auth().signInAnonymously().
				then(function() {
					return app.database().ref('anonymous').child(projectName);
				});
	} else {
		return app.auth().signInWithEmailAndPassword(
				config.auth.email, config.auth.password).then(function() {
					var user = app.auth().currentUser;
					console.log('authorized, email: ' + user.email);
					return app.database().ref(user.uid).child(projectName);
				});
	}
};
