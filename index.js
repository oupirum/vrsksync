var watch = require('node-watch');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var connect = require('./connection');

function printUsage() {
	console.log('Usage: \n' + 
			'$ node vrsksync send my_token my_directory\n' +
			'or\n' +
			'$ node vrsksync receive my_token my_directory\n' +
			' where: \n' +
			'  - my_token - your unique token (project id), must be\n'+
			'      same on source and target\n' +
			'  - my_directory - your local directory to sync\n');
}

if (process.argv.length < 4) {
	printUsage();
	process.exit();
}
var mode = process.argv[2];
var projectName = process.argv[3];
if (!/^[a-z0-9]{1,100}$/i.test(projectName)) {
	console.error('incorrect project token, must be ^[a-z0-9]{1,100}$');
	process.exit();
} 
var projectDir = path.resolve(process.argv[4]);

connect(projectName).then(function(ref) {
	listen(ref, projectDir);
}).catch(function(err) {
	console.error('A vot oblomaisya', err);
});

function listen(ref, projectDir) {
	if (mode == 'send') {
		watch(projectDir, function(filename) {
			send(filename);
		});
	} else if (mode == 'receive') {
		ref.on('child_added', function(dataSnap) {
			dataSnap.ref.remove();
			update(dataSnap);
		});
	} else {
		printUsage();
		process.exit();
	}
	console.log('waiting for changes for "' + projectName + '" on "' + projectDir + '" ...');
	
	function send(filename) {
		try {
			var relPath = path.relative(projectDir, filename);
			var data = {
				path: relPath,
			};
			if (!fs.existsSync(filename)) {
				console.log('delete', filename);
				data.del = true;
			} else {
				console.log('update', filename);
				var content = fs.readFileSync(filename, 'utf-8');
				data.content = content;
			}
			ref.push(data);
		} catch(err) {
			console.error(err);
		}
	}
	
	function update(dataSnap) {
		try {
			var relPath = dataSnap.val().path;
			var content = dataSnap.val().content;
			var del = dataSnap.val().del;
			if (relPath) {
				var absPath = path.join(projectDir, relPath);
				if (del) {
					console.log('delete', absPath);
					if (fs.statSync(absPath).isDirectory()) {
						fs.rmdirSync(absPath);
					} else {
						fs.unlinkSync(absPath);
					}
				} else {
					console.log('update', absPath);
					var dir = path.dirname(absPath);
					if (!fs.existsSync(dir)) {
						mkdirp.sync(dir);
					}
					fs.writeFileSync(absPath, content);
				}
			}
		} catch(err) {
			console.error(err);
		}
	}
}
