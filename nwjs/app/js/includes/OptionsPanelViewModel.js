/**
 * Created by User on 30.12.15.
 */
define(
	["./ViewportPanelViewModel", "./ImageModel", "./ImageContainer", "./EyeletsImageLayer", "./LoadingScreen"],
	function(ViewportPanelViewModel, ImageModel, ImageContainer, EyeletsImageLayer, LoadingScreen){
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

		return OptionsPanelViewModel;
	}
);