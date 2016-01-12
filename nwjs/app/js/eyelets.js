/**
 * Created by User on 23.11.15.
 */

var modProcess = require("process");

global.__dirname = modProcess.cwd();

_test = Object.create(null);

_test.App = require("nw.gui");

_utils = {
	"split": function(d,s){
		if (arguments.length < 2) return;
		if (typeof s != "string") return;
		if (  typeof d == "string"  ) d = [d];
		if (  !Array.isArray(d)  ) return;

		var regexp = new RegExp("[" + d.join("") + "]", "g");
		s = s.replace(regexp, d[0]);
		return s.split(d[0]);
	},

	"stringCapFirst": function(str){
		if (typeof str != "string") return "";
		if (!str.length) return "";
		return str[0].toUpperCase() + str.slice(1,str.length);
	},

	"arrayIntersect": function(){
		var merged = [];
		for(var c=0; c<arguments.length; c++){
			merged = merged.concat(arguments[c]);
		}
		var tmp = {};
		var res = [];
		for(c=0; c<merged.length; c++){
			if (  tmp.hasOwnProperty(merged[c])  ){
				res.push(merged[c]);
				continue;
			}
			tmp[merged[c]] = 1;
		}
		return res;
	}
};

requirejs.config({
	//By default load any module IDs from js/lib
	baseUrl: './js/includes',
	//except, if the module ID starts with "app",
	//load it from the js/app directory. paths
	//config is relative to the baseUrl, and
	//never includes a ".js" extension since
	//the paths config could be for a directory.
	paths: {
		// app: '../app'
	}
});

$(document).ready(function(){

	requirejs(
		["config", "./LoadingScreen", "./OptionsPanelViewModel", "./ViewportPanelViewModel"],
		function(config, LoadingScreen, OptionsPanelViewModel, ViewportPanelViewModel){

			var modGui = require("nw.gui");

			var win = modGui.Window.get();

			win.height = 768;
			win.width = 1024;

			win.title = "Утилита для широкоформатной печати";

			// ----------------------------------------------------------------------------------------

			var modPath = require("path");

			var modFs = require("fs");

			// ----------------------------------------------------------------------------------------

			if (
				!config.im_convert
				|| !config.im_identify
			){
				alert("Не удалось найти ImageMagick компоненты");
				return;
			}

			// ----------------------------------------------------------------------------------------

			modFs.readdir(
				config.tmp_dir,
				function(err, files){
					if (err) return;
					for(var c=0; c<files.length; c++){
						(function(){
							var path = modPath.join(config.tmp_dir + "/" + files[c]);
							modFs.unlink(path);
						})();
					}
				}
			);

			// ----------------------------------------------------------------------------------------

			LoadingScreen.prototype.getInstance().showLoading(false);

			// ----------------------------------------------------------------------------------------

			new OptionsPanelViewModel({});

			// ----------------------------------------------------------------------------------------

			new ViewportPanelViewModel({});

		}
	);

});
