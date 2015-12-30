/**
 * Created by User on 30.12.15.
 */
define(
	["./ImageModel","./config"],
	function(ImageModel, config){
		// ImageContainer
		return Backbone.Model.extend({

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
	}
);