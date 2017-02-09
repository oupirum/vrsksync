var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var connect = require('./connection');

if (process.argv.length < 4) {
	console.log('Usage: \n$ node client.js username my_project_directory');
	process.exit();
}
var username = process.argv[2];
var projectDir = path.resolve(process.argv[3]);

var ref = connect(username);

ref.on('child_added', function(dataSnap) {
	dataSnap.ref.remove();
	
	var relPath = dataSnap.val().path;
	var content = dataSnap.val().content;
	if (relPath) {
		var absPath = path.join(projectDir, relPath);
		console.log('update file', absPath);
		var dir = path.dirname(absPath);
		if (!fs.existsSync(dir)) {
			mkdirp.sync(dir);
		}
		fs.writeFile(absPath, content, function(err) {
			if (err) {
				console.log('error on writing file', err);
			}
		});
	}
});

console.log('waiting for changes for "' + username + '" on "' + projectDir + '" ...');
