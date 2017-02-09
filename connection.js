var firebase = require('firebase');

module.exports = function(username) {
	var app = firebase.initializeApp({
		databaseURL: 'https://verisk-e9095.firebaseio.com'
	});
	return app.database().ref(username);
};
