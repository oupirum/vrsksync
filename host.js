var firebase = require('firebase');
var watch = require('node-watch');
var path = require('path');
var fs = require('fs');
var connect = require('./connection');

if (process.argv.length < 4) {
	console.log('Usage: \n$ node host.js username my_project_directory');
	process.exit();
}
var username = process.argv[2];
var projectDir = path.resolve(process.argv[3]);

var ref = connect(username);

watch(projectDir, function(filename) {
	if (!fs.existsSync(filename)) {
		return;
	}
	console.log('send file', filename);
	fs.readFile(filename, 'utf-8', function(err, content) {
		if (err) {
			console.error('A vot oblomaisya', err);
			return;
		}
		var relPath = path.relative(projectDir, filename);
		ref.push({
			path: relPath,
			content: content
		});
	});
});

console.log('waiting for changes for "' + username + '" on "' + projectDir + '" ...');
