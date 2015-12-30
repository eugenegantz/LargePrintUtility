/**
 * Created by User on 23.11.15.
 */

_test = Object.create(null);

$(document).ready(function(){

	var modPath = require("path");

	var modFs = require("fs");

	var modProcess = require("process");

	global.__dirname = modProcess.cwd();

	// ----------------------------------------------------------------------------------------

	var config = {
		"image_magick_dir": modPath.join(global.__dirname, "/../im"),
		"im_convert": null,
		"im_identify": null
	};

	config.tmp_dir = modPath.join(global.__dirname, "/app/tmp");

	if (  modFs.existsSync(config.image_magick_dir + "/convert.exe")  ){
		config.im_convert = modPath.join(config.image_magick_dir + "/convert.exe");
	}

	if (  modFs.existsSync(config.image_magick_dir + "/identify.exe")  ){
		config.im_identify = modPath.join(config.image_magick_dir + "/identify.exe");
	}

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

	_utils = {
		"split": function(d,s){
			if (arguments.length < 2) return;
			if (typeof s != "string") return;
			if (  typeof d == "string"  ) d = [d];
			if (  !Array.isArray(d)  ) return;

			var regexp = new RegExp("[" + d.join("") + "]", "g");
			s = s.replace(regexp, d[0]);
			return s.split(d[0]);
		}
	};

	// ----------------------------------------------------------------------------------------

	var modGui = require("nw.gui");

	var win = modGui.Window.get();

	win.height = 768;
	win.width = 1024;

	win.title = "Приложение для рассчета установки люверсов";

	// ---------------------------------------------------------------------------------------------------

	var LoadingScreen = Backbone.View.extend({

		"el": null,

		"instances": [],


		"getInstance": function(){

			return this.instances.length ? this.instances[0] : new LoadingScreen();

		},


		"initialize": function(){

			this.instances.push(this);

		},


		"lockScreen": function(arg){

			arg = Boolean(arg);

			if (arg){
				$(".screen-lock").removeClass("hidden");
			} else {
				$(".screen-lock").addClass("hidden");
			}

		},


		"showLoading": function(arg){

			arg = Boolean(arg);

			this.lockScreen(arg);

			if (arg){
				$(".screen-loading").removeClass("hidden");
			} else {
				$(".screen-loading").addClass("hidden");
			}

		}

	});

	LoadingScreen.prototype.getInstance().showLoading(false);

	// ----------------------------------------------------------------------------------------

	var EyeletsImageLayer = Backbone.Model.extend({

		"initialize": function(){

			this.set("stepLength", 1);
			this.set("diameter", 50);
			this.set("pageMargin", 24);
			this.set("amount", 4);
			this.set("placementFormat", "perimeter");

			this.set("container", null);

		},

		"setContext": function(ctx){

			this.set("ctx", ctx);

		},

		"setInstance": function(image){

			this.set("imageInstance", image);

		},

		"applyFilter": function(){

			var ctx = this.get("ctx");

			var canvas = ctx.canvas;

			// --------------------------------------------------------------------------------

			var sides = {
				"top": [],
				"right": [],
				"bottom": [],
				"left": []
			};

			// --------------------------------------------------------------------------------

			var self					= this;
			var amount				= this.get("amount");
			var plc					= this.get("placementFormat");
			var container			= this.get("container");
			var imageInstance	= container.image;
			var rect					= imageInstance.getRect({"units": "cm", "round": 4});
			var margin				= this.get("pageMargin");
			var diam					= this.get("diameter");

			var long				= rect.w > rect.h ? rect.w : rect.h;
			var short			= rect.w < rect.h ? rect.w : rect.h;
			var width			= rect.w;
			var height			= rect.h;
			var mWidth			= width - (margin * 2);
			var mHeight		= height - (margin * 2);
			var P					= (width + height) * 2;
			var ratio				= width / height;

			var stepLength	= (P - (margin * 4)) / amount;

			var sideAmount, pos, c, prop, side, item;

			// --------------------------------------------------------------------------------

			var useSides = [];

			if (  plc == "perimeter"  ){
				useSides = ["top", "right", "bottom", "left"]

			} else if (  ["top", "right", "bottom", "left"].indexOf(plc) > -1  ) {
				useSides = [plc];

			} else if (  plc == "long_sides"  ) {
				useSides = width > height ? ["top", "bottom"] : ["left", "right"];

			} else if (  plc == "short_sides"  ) {
				useSides = width < height ? ["top", "bottom"] : ["left", "right"];

			}

			// --------------------------------------------------------------------------------

			var drawFx = function(item){
				var DPI = imageInstance.get("DPI");
				var DPcm = DPI / 2.54;

				item.x = item.x * DPcm;
				item.y = item.y * DPcm;

				ctx.beginPath();
				ctx.arc(item.x, item.y, (diam * DPcm) / 2, 0, 2*Math.PI, false);
				ctx.strokeStyle="red";
				ctx.lineWidth=4;
				ctx.stroke();
				ctx.fillStyle="white";
				ctx.fill();
			};

			var
				top			= 0,
				bottom		= 0,
				left			= 0,
				right			= 0,
				vPad			= 0,
				hPad			= 0;

			// --------------------------------------------------------------------------------

			for(  prop in sides  ){
				if (  !sides.hasOwnProperty(prop)  ) continue;
				if (  useSides.indexOf(prop) == -1  ) continue;

				side = sides[prop];

				if (  prop == "top"  ){
					sideAmount = Math.round(mWidth / stepLength);

					pos = {"x": diam / 2, "y":margin + (diam / 2)};

					left = pos.x;
					right = pos.x;

					for(c=0; c<sideAmount; c++){
						item = {"x": pos.x, "y": pos.y};
						side.push(item);

						if (  c == sideAmount - 1  ) right = item.x;

						pos.x += stepLength;
					}

					hPad = ( left + mHeight - right ) / 2;

					for(c=0; c<side.length; c++){
						// side[c].x += hPad;
					}

				} else if (  prop == "left"  ) {
					sideAmount = Math.round(mHeight / stepLength);

					pos = {"x":margin + (diam / 2), "y": diam / 2};

					top = pos.y;
					bottom = pos.y;

					for(c=0; c<sideAmount; c++){
						item = {"x": pos.x, "y": pos.y};
						side.push(item);

						if (c == sideAmount - 1){
							bottom = item.y + diam / 2;
						}

						pos.y += stepLength;
					}

					vPad = ( top + mHeight - bottom ) / 2;

					for(c=0; c<side.length; c++){
						side[c].y += vPad;
					}

				} else if (  prop == "bottom"  ) {
					sideAmount = Math.round(mWidth / stepLength);

					pos = {"x": diam / 2, "y":mHeight - (diam / 2)};

					left = pos.x;
					right = pos.x;

					for(c=0; c<sideAmount; c++){
						item = {"x": pos.x, "y": pos.y};
						side.push(item);

						if (  c == sideAmount - 1  ) right = item.x;

						pos.x += stepLength;
					}

					hPad = ( left + mHeight - right ) / 2;

					for(c=0; c<side.length; c++){
						side[c].x += hPad;
					}

				} else if (  prop == "right"  ) {
					sideAmount = Math.round(mHeight / stepLength);

					pos = {"x":mWidth - (diam / 2), "y": diam / 2};

					top = pos.y;
					bottom = pos.y;

					for(c=0; c<sideAmount; c++){
						item = {"x": pos.x, "y": pos.y};
						side.push(item);

						if (c == sideAmount - 1){
							bottom = item.y + diam / 2;
						}

						pos.y += stepLength;
					}

					vPad = ( top + mHeight - bottom ) / 2;

					for(c=0; c<side.length; c++){
						side[c].y += vPad;
					}

				}

			}

			for(prop in sides){
				if (  !sides.hasOwnProperty(prop)  ) continue;

				side = sides[prop];

				if (!side.length) continue;

				for(c=0; c<side.length; c++){

					drawFx(side[c]);

				}

			}

		},

		"applyFilterIMagick": function(){
			// TODO
		}
	});

	// ----------------------------------------------------------------------------------------

	var OptionsPanelViewModel = Backbone.View.extend({

		"instances": [],

		"_operImageContainer": null,

		"getInstance": function(A){
			return this.instances.length ? this.instances[0] : new OptionsPanelViewModel(A);
		},


		"el": $(".app-panel_options").get(0),


		"events": {
			"change  input": "_eventTriggerOptChanged",
			"change [name='source_file']": "_eventChangedSourceFile",
			"change [name='destination_file']": "_eventChangedDestFile",
			"change [name='eyelets_amount']": "_eventChangeEyeletsAmount",
			"change [name='eyelets_step']": "_eventChangeEyeletsStep",
			"change [name='margin']": "_eventChangePageMargin",
			"change [name='eyelets_diameter']": "_eventChangeEyeletsDiam"
		},


		"timers": {
			"render": null,
			"applyLayers": null
		},


		"render": function(){
			var self = this;
			clearTimeout(this.timers.applyLayers);
			this.timers.applyLayers = setTimeout(
				function(){
					self._operImageContainer.applyLayers();
					var b64img = self._operImageContainer.toDataURL({"width":480});
					var image = new Image();

					image.onload = function(){
						var viewportInstance = ViewportPanelViewModel.prototype.getInstance();
						viewportInstance.setImage(this);
					};

					image.src = b64img;
				},
				1000
			);
		},


		"_eventChangePageMargin": function(){

			this._eventChangeEyeletsAmount();
			this._eventChangeEyeletsStep();

			this.filters.eyelets.set("pageMargin", parseFloat($("[name='margin']",this.el).val()));

			this.render();

		},


		"_eventChangeEyeletsStep": function(){

			var image = this._operImageContainer.image;
			var rect = image.getRect({"units":"cm","round":4});

			var margin = $("[name='margin']",this.el).val();

			var stepLen = $("[name='eyelets_step']",this.el).val();

			var perimeter = (rect.w + rect.h - (margin * 2)) * 2;

			var amount = Math.round(perimeter / stepLen);

			if (  amount < 4  ){
				this._eventChangeEyeletsAmount();
				return;
			}

			this.filters.eyelets.set("stepLength", stepLen);
			this.filters.eyelets.set("amount", amount);

			$("[name='eyelets_amount']",this.el).val(amount);

			this.render();

		},


		"_eventChangeEyeletsAmount": function(){

			var image = this._operImageContainer.image;
			var rect = image.getRect({"units":"cm","round":4});

			var margin = $("[name='margin']",this.el).val();

			var perimeter = (rect.w + rect.h - (margin * 2)) * 2;

			var amount = parseInt($("[name='eyelets_amount']",this.el).val());

			if (  amount < 4  ) amount = 4;

			// if (  amount % 4 > 0  ) amount += amount % 4;

			var stepLength = Math.round((perimeter / amount) * 1000) / 1000;

			this.filters.eyelets.set("stepLength", stepLength);
			this.filters.eyelets.set("amount", amount);

			$("[name='eyelets_amount']",this.el).val(amount);

			$("[name='eyelets_step']",this.el).val(stepLength);

			this.render();

		},


		"_eventChangeEyeletsDiam": function(){

			var diam = $('[name="eyelets_diameter"]', this.el).val();

			diam = parseFloat(diam);

			this.filters.eyelets.set("diameter", diam);

			this.render();

		},


		"_eventChangedDestFile": function(){
			alert();
		},


		"_eventChangedSourceFile": function(){

			var self = this;

			// var modFs = require("fs");

			var modPath = require("path");

			var sourceFilePath = $("[name='source_file']", this.el).val();

			if (  !sourceFilePath  ) return;

			var ext = modPath.extname(sourceFilePath).toLowerCase();

			var availExtensions = [".psd",".pdf",".tiff",".tif",".jpg",".jpeg",".eps"];

			if (  availExtensions.indexOf(ext) == -1  ){
				alert("Недопустимое расширение файла");
				$("[name='source_file']", this.el).val("");
				return;
			}

			var viewportInstance = ViewportPanelViewModel.prototype.getInstance();

			var loadingScreenInstance = LoadingScreen.prototype.getInstance();
			loadingScreenInstance.showLoading(1);

			var image = new ImageModel({
				"path": sourceFilePath,
				"callback": function(err){

					if (err){
						alert(err);
						loadingScreenInstance.showLoading(0);
						var errWin = open("about:blank","Error");
						errWin.document.title = "ErrorLog";
						var errBody = errWin.document.querySelector("body");
						errBody.innerHTML = err;
						return;
					}

					self._operImageContainer = new ImageContainer({
						"image": image,
						"callback": function(){
							loadingScreenInstance.showLoading(0);
							var image = new Image();
							image.src = self._operImageContainer.getDataURL({"width":480});
							viewportInstance.setImage(image);
						}
					});

					self._operImageContainer.setLayer(self.filters.eyelets);

					_test._operImageContainer = self._operImageContainer;

				}
			});

		},


		"_eventTriggerOptChanged": function(){

			this.trigger("optChanged");

		},


		"initialize": function(){

			this.instances.push(this);

			this.filters = {};

			this.filters.eyelets = new EyeletsImageLayer();

		}

	});

	new OptionsPanelViewModel({});



	// ----------------------------------------------------------------------------------------

	var ViewportPanelViewModel = Backbone.View.extend({

		"instances": [],


		"getInstance": function(A){
			return this.instances.length ? this.instances[0] : new OptionsPanelViewModel(A);
		},


		"el": $(".app-panel_view").get(0),


		"events": {},


		"setImage": function(image){

			if (  image instanceof Image ){

				image.style.width = "100%";

				var container = $(".panel-body", this.el).get(0);
				container.innerHTML = "";
				container.appendChild(image);

			}

		},

		"setWidth": function(width){
			this.canvasEl.width = width;
		},

		"setHeight": function(height){
			this.canvasEl.height = height;
		},

		"initialize": function(){

			this.canvasEl = document.createElement("canvas");

			// this.setWidth(480);

			// this.setHeight(800);

			// this.ctx = this.canvasEl.getContext("2d");

			// $(".panel-body",this.el).get(0).appendChild(this.canvasEl);

			// this._originImage = new Image();

			this.instances.push(this);

		}

	});

	new ViewportPanelViewModel({});


	// ----------------------------------------------------------------------------------------

	var ImageModel = Backbone.Model.extend({

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

	// ---------------------------------------------------------------------------------------------------

	var ImageContainer = Backbone.Model.extend({

		"initialize": function(){

			if (  !arguments.length  ) return;

			var arg = arguments[0];

			if (  typeof arg.image == "undedefined"  ) return;

			if (  arg.image instanceof ImageModel == false ) return;

			var callback = typeof arg.callback == "function" ? arg.callback : function(){};

			// ................................................................

			// Модули
			var modPath = require("path");
			var self = this;

			// Создание canvas и его контекста
			self.canvasEl = document.createElement("canvas");
			self.ctx = this.canvasEl.getContext("2d");

			// ................................................................
			// Экземпляр ImageModel

			var imageInstance = arg.image;

			var destPath = modPath.join(config.tmp_dir +"/"+ new Date().getTime() + ".jpg");

			// ................................................................
			// Пересохранение ImageInstance в читаемый jpeg

			imageInstance.saveAs({
				"path": destPath,
				"callback": function(){
					var imageElem = new Image();

					imageElem.onload = function(){
						// var container = $(".panel-body",self.el).get(0);
						// container.innerHTML = "";

						// var w = this.width;
						// var h = this.height;
						// var k = w / h;

						// var nw = self.canvasEl.width;
						// var nh = nw / k;

						self.canvasEl.height = this.height;
						self.canvasEl.width = this.width;

						self.ctx.clearRect(0,0,self.canvasEl.width, self.canvasEl.height);
						self.ctx.drawImage(imageElem,0,0,this.width,this.height,0,0,this.width,this.height);
						// container.appendChild(imageElem);

						self.image = imageInstance;

						self.jpeg = imageElem;

						callback();

					};

					imageElem.src = destPath;

				}
			});

			this.layers = [];

		},


		"setLayer": function(layer){

			this.layers.push(layer);

			layer.set("container", this);

		},


		"toDataURL": function(){

			return this.getDataURL.apply(this, arguments);

		},


		"getDataURL": function(arg){

			if (  typeof arg != "object"  ){
				arg = {};
			}

			var r = this.canvasEl.width / this.canvasEl.height;

			// ....................................................

			var width = typeof arg.width != "undefined" && !isNaN(arg.width) ? arg.width : null;

			var height = typeof arg.height != "undefined" && !isNaN(arg.height) ? arg.height : null;

			// ....................................................

			if ( !width && !height ){
				width = this.canvasEl.width;
				height = this.canvasEl.height;

			} else if (  !width  ) {

				width = height / r;

			} else if (  !height  ) {

				height = width / r;

			}

			// ....................................................

			var canvas = document.createElement("canvas");

			canvas.width = width;

			canvas.height = height;

			var ctx = canvas.getContext("2d");

			ctx.drawImage(this.canvasEl, 0, 0, this.canvasEl.width, this.canvasEl.height, 0, 0, width, height);

			// ....................................................

			return canvas.toDataURL();

		},


		"applyLayers": function(){

			var canvas = document.createElement("canvas");

			canvas.width = this.canvasEl.width;
			canvas.height = this.canvasEl.height;

			var ctx = canvas.getContext("2d");

			ctx.width = this.jpeg.width;
			ctx.height = this.jpeg.height;

			ctx.drawImage(this.jpeg,0, 0, this.jpeg.width, this.jpeg.height, 0, 0, this.jpeg.width, this.jpeg.height);

			for(var c=0; c<this.layers.length; c++){

				this.layers[c].setContext(ctx);

				this.layers[c].applyFilter();

			}

			this.ctx.drawImage(canvas,0,0,canvas.width, canvas.height, 0, 0, this.canvasEl.width, this.canvasEl.height);

		}

	});

});
