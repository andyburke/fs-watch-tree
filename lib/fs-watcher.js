/*
 * - keeps track of watched files
 * - simplifies closing all watchers
 * - simplifies closing some watchers, like all those under a directory
 */

var fs = require("fs");

var isWindows = process.platform === "win32"; // the path library does not
var fileSeparator = isWindows ? "\\" : "/";   // expose the fileSeparator :-o

function close(o) { o.closer.close(); }

function forEachWatcher(fn) {
    var key;
    for (key in this.watchers) {
        if (this.watchers.hasOwnProperty(key)) {
            fn(this.watchers[key]);
        }
    }
}

function isInDir(file, dir) {
    var dirPath = dir.name + this.fileSeparator;
    return file.name.substring(0, dirPath.length) === dirPath;
}

module.exports = {
    create: function () {
        var instance = Object.create(this);
        instance.watchers = {};
        instance.fileSeparator = fileSeparator;
        return instance;
    },

    watch: function (file, callback) {
        if (this.watchers[file.name]) {
            return false; // watch not added
        }

        var closer = fs.watch(file.name, function (event) {
            return callback(event, file);
        });
        closer.on('error', function (error) {
            fs.exists(file.name, function (exists) {
                if (exists) {
                    throw error;
                } else {
                    console.log("Watching error occurred for non existing " +
                                "file: " + file.name + " (" + error + ")");
                }
            });
        });

        this.watchers[file.name] = {
            file: file,
            closer: closer
        };
        
        return true;
    },

    unwatch: function (file) {
        if (!this.watchers[file.name]) {
            return false; // no file to unwatch
        }
        
        close(this.watchers[file.name]);
        delete this.watchers[file.name];
        return true;
    },

    unwatchDir: function (dir) {
        this.unwatch(dir);
        forEachWatcher.call(this, function (watcher) {
            var file = watcher.file;
            if (isInDir.call(this, file, dir)) { this.unwatch(file); }
        }.bind(this));
    },

    end: function () {
        forEachWatcher.call(this, close);
    }
};