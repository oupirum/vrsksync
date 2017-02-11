var watch = require('node-watch');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var connect = require('./connection');
var md5 = require('md5');

var mode;
var projectName;
var projectDir;
var hashSecret = getHashSecret();
parseArgs();

if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
	console.error('directory "' + projectDir + '" does not exists');
	process.exit();
}

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
			update(dataSnap.val());
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
			} else if (fs.statSync(filename).isDirectory()) {
				console.log('create dir', filename);
				data.dir = true;
			} else {
				console.log('update', filename);
				var content = fs.readFileSync(filename, {encoding: 'utf-8'});
				data.content = content;
			}
			attachHash(data);
			ref.push(data);
		} catch(err) {
			console.error(err);
		}
	}
	
	function update(data) {
		try {
			if (!checkHash(data)) {
				console.error('wrong hashsum for "' + data.path + '"');
				return;
			}
			var relPath = data.path;
			if (relPath) {
				var absPath = path.join(projectDir, relPath);
				var content = data.content;
				var del = data.del;
				var dir = data.dir;
				if (del) {
					console.log('delete', absPath);
					if (fs.statSync(absPath).isDirectory()) {
						fs.rmdirSync(absPath);
					} else {
						fs.unlinkSync(absPath);
					}
				} else if (dir) {
					console.log('create dir', absPath);
					mkdirp.sync(absPath);
				} else {
					console.log('update', absPath);
					var parent = path.dirname(absPath);
					if (!fs.existsSync(parent)) {
						mkdirp.sync(parent);
					}
					fs.writeFileSync(absPath, content, {encoding: 'utf-8'});
				}
			}
		} catch(err) {
			console.error(err);
		}
	}
	
	function attachHash(data) {
		if (hashSecret) {
			data.hash = calcHash(data);
		}
	}
	
	function checkHash(data) {
		if (hashSecret) {
			return data.hash === calcHash(data);
		}
		return true;
	}
	
	function calcHash(data) {
		return md5(hashSecret +
			data.path +
			data.del +
			data.dir +
			data.content);
	}
}

function getHashSecret() {
	var config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
	return config.hashSecret;
}

function parseArgs() {
	var argsNum = process.argv.length;
	if (process.argv.length < 4) {
		printUsage();
		process.exit();
	}
	mode = process.argv[argsNum - 3];
	projectName = process.argv[argsNum - 2];
	if (!/^[a-z0-9]{1,100}$/i.test(projectName)) {
		console.error('incorrect project token, must be ^[a-z0-9]{1,100}$');
		process.exit();
	}
	projectDir = path.resolve(process.argv[argsNum - 1]);
	
	for (var i = 0; i < process.argv.length; i++) {
		if (process.argv[i] == '--hash' || process.argv[i] == '-h') {
			hashSecret = process.argv[i + 1];
		}
	}
}

function printUsage() {
	console.log('Usage: \n' + 
			'$ node ./vrsksync send my_token my_directory\n' +
			'or\n' +
			'$ node ./vrsksync receive my_token my_directory\n' +
			' where: \n' +
			'  - my_token - your unique token (project id), must be\n'+
			'      same on source and target\n' +
			'  - my_directory - your local directory to sync\n');
}
