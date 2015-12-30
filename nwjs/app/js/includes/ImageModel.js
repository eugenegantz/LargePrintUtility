/**
 * Created by User on 30.12.15.
 */
define(
	["./config"],
	function(config){
		return Backbone.Model.extend({

			"initialize": function(A){

				if (typeof A != "object") return;

				if (typeof A.path != "string") return;

				if (  typeof A.callback == "function"  ){
					this.callback = A.callback;
				} else {
					this.callback = function(){};
				}

				var self = this;

				var path = A.path;

				var modChildProcess = require("child_process");

				var child = modChildProcess.exec(
					'"'+ config.im_identify +'" -units PixelsPerInch -format "%w,%h,%x,%y,%r,%m,%@,%U"  "'+ path +'"  ',
					function (error, stdout, stderr) {

						console.log('stdout: ' + stdout);

						console.log('stderr: ' + stderr);

						if (error !== null) {
							console.log('exec error: ' + error);
						}

						if (!stdout){
							self.callback(error,stderr)
						}

						var imgData = stdout.split(",");

						/*
						 * r = class colorspace;
						 * m = file extension
						 * %@ - BoundingBox
						 * %U - Units
						 * */

						console.log(imgData);

						self.set(
							"rect",
							{
								"w": parseFloat(imgData[0]),
								"h": parseFloat(imgData[1]),
								"y": 0,
								"x": 0
							}
						);

						//var bbox = self.set("boudingBox", imgData[6]);

						var bbox = _utils.split(["+","x"], imgData[6]);

						self.set(
							"brect",
							{
								"w": parseFloat(bbox[0]),
								"h": parseFloat(bbox[1]),
								"x": parseFloat(bbox[2]),
								"y": parseFloat(bbox[3])
							}
						);

						self.set("DPI", parseFloat(imgData[2]));

						self.set("path", path);

						console.log(this, child);

						self.callback(null, null);

					}
				);

			},

			"init": function(callback){
				if (typeof callback == "function"){
					this.callback = callback;
				}
			},

			"getRect": function(A){

				if (  typeof A != "object"  ) A = {};

				var brect = (  typeof A.brect == "undefined" ? false : Boolean(A.brect)  );

				var k;
				var DPI = this.get("DPI");
				var DPmm = (DPI / 2.54) / 10;

				var units = typeof A.units == "string" ? A.units.toLowerCase() : "px";

				var round = typeof A.round == "undefined" ? -1 : parseInt(A.round);

				if (  units == "mm"  ){
					k = DPmm;

				} else if (  units == "m"  ) {
					k = DPmm * 1000;

				} else if (  units == "cm"  ) {
					k = DPmm * 10;

				} else {
					k = 1;

				}

				var rect = brect ? this.get("brect") : this.get("rect");

				var rect_ = {};

				for(var prop in rect){
					if (  !rect.hasOwnProperty(prop)  ) continue;

					rect_[prop] = rect[prop] / k;

					if (  round > -1  ){
						rect_[prop] = Math.round(rect_[prop] * Math.pow(10,round)) / Math.pow(10,round);
					}
				}


				return rect_;

			},

			"getBRect": function(A){
				if (typeof A != "object") A = {};
				A.brect = true;
				return this.getRect(A);
			},

			"saveAs": function(A){

				var self = this;
				var modFs = require("fs");
				var modPath = require("path");
				var modChildProcess = require("child_process");

				if (typeof A != "object") return;

				if (typeof A.path != "string") return;

				var callback = typeof A.callback == "function" ? A.callback : function(){};

				var destPath = A.path;

				var parsedPath = modPath.parse(destPath);

				var destDir = parsedPath.dir;

				if (  !modFs.existsSync(destDir)  ){
					return;
				}

				var size = typeof A.size == "object" ? A.size : null;

				var cmdSize = "";

				if (  size  ){
					cmdSize = size.width+"x"+size.height;
				}

				modChildProcess.exec(
					'"'+ config.im_convert +'" "'+self.get("path")+'"[0] '+cmdSize+' "'+destPath+'"',
					function(){
						callback();
					}
				)

			}

		});
	}
);