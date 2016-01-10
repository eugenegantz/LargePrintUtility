/**
 * Created by User on 30.12.15.
 */
define(
	["./ViewportPanelViewModel", "./ImageModel", "./ImageContainer", "./EyeletsImageLayer", "./LoadingScreen", "./config"],
	function(ViewportPanelViewModel, ImageModel, ImageContainer, EyeletsImageLayer, LoadingScreen, config){
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
				// "change [name='eyelets_step']": "_eventChangeEyeletsStep",
				"change [name='margin']": "_eventChangePageMargin",
				"change [name='eyelets_diameter']": "_eventChangeEyeletsDiam",
				// "change [name*='eyelets_amount_']": "_eventChangeEyeletsAmount2",
				// "change [name*='eyelets_step_length_']": "_eventChangeStepLength2",
				"change [name='eyelets_placement_format']": "_eventChangedPlacementFormat",
				"change [name*='eyelets_amount_'],[name*='eyelets_step_length_'],[name*='eyelets_step_auto_length_']": "_eventChangeEyeletsParam",
				"click [name='save_button']": "_eventClickSaveButton"
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


			"interfaceSetEyeletsAmount": function(amount){
				$("[name*='eyelets_amount_']",this.el).val(amount);
			},


			"getSidesNumber": function(){
				var value = $('[name="eyelets_placement_format"]:checked',this.el).val();
				if (  value == "corners" || value == "perimeter"  ) {
					return 4;

				} else if (  value == "short" || value == "long"  ) {
					return 2;

				}
			},


			"_interfaceGetEyelets": function(){
				var eyelets = {};
				var tmp, c;
				var side;
				var inputs = $(
					[
						'[name*="eyelets_step_auto_length_"]',
						'[name*="eyelets_step_length_"]',
						'[name*="eyelets_amount_"]'
					].join(","),
					this.el
				);

				var regExp = new RegExp("_left|_right|_top|_bottom","g");

				tmp = ["top","bottom","left","right"];

				for(c=0; c<tmp.length; c++){
					eyelets[tmp[c]] = {
						"amount": null,
						"stepLength": null,
						"isStepAutoLength": null
					};
				}

				for(c=0; c<inputs.length; c++){
					if (  side = inputs[c].name.match(regExp)  ){
						side = side[0].replace("_","");
					} else {
						continue;
					}

					if (  inputs[c].name.match("step_auto_length")  ){
						eyelets[side].isStepAutoLength = inputs[c].checked;
					}

					if (  inputs[c].name.match("step_length")  ){
						eyelets[side].stepLength = inputs[c].value;
					}

					if (  inputs[c].name.match("amount_")  ){
						eyelets[side].amount = inputs[c].value;
					}

				}

				return eyelets;
			},


			"_interfaceSetEyelets": function(eyelets){
				if (  typeof eyelets != "object"  ) return;
				if (  Array.isArray(eyelets)  ) return;

				var
					amount = 4,
					amountSum = 0,
					stepLength = null,
					stepLength_ = null;
					isStepAutoLength = true;

				var filterArg = {};

				for(var side in eyelets){
					if (  !eyelets.hasOwnProperty(side)  ) continue;

					if (  eyelets[side].hasOwnProperty("amount")  ){
						amount = parseInt(eyelets[side].amount);
						if (  isNaN(amount)  ) amount = 4;
					}

					amountSum += amount;

					if (
						eyelets[side].hasOwnProperty("stepLength")
						&& eyelets[side].stepLength
					){
						stepLength = parseFloat(eyelets[side].stepLength);
						if (  isNaN(stepLength) || stepLength < 0  ) stepLength = 1;
					}

					stepLength_ = stepLength;

					if (  eyelets[side].hasOwnProperty("isStepAutoLength")  ){
						isStepAutoLength = Boolean(eyelets[side].isStepAutoLength);
						if (  isStepAutoLength  ) {
							stepLength = null;
						}
					}

					filterArg["amount_" + side] = amount;
					filterArg["stepLength" + _utils.stringCapFirst(side)] = stepLength;
					filterArg["stepAutoLength" + _utils.stringCapFirst(side)] = isStepAutoLength;

					$('[name="eyelets_step_auto_length_'+side+'"]', this.el).get(0).checked = isStepAutoLength;
					$('[name="eyelets_step_length_'+side+'"]', this.el).val(stepLength_);
					$('[name="eyelets_amount_'+side+'"]', this.el).val(amount);

					if (!isStepAutoLength){
						$('[name="eyelets_step_length_'+side+'"]', this.el).get(0).removeAttribute("disabled");
					} else {
						$('[name="eyelets_step_length_'+side+'"]', this.el).get(0).setAttribute("disabled","1");
					}

				}

				if (  amountSum  ){
					filterArg.amount = amountSum;
				}

				$('[name="eyelets_amount"]', this.el).val(amountSum);

				this.filters.eyelets.set(filterArg);

				if (  $('[name="source_file"]', this.el).val()  ){
					this.render();
				}

			},


			"_autoEyelets": function(){
				var image = this._operImageContainer.image;
				var rect = image.getRect({"units":"cm","round":4});
				var tmp;

				var margin = $("[name='margin']",this.el).val();

				var perimeter = (rect.w + rect.h - (margin * 2)) * 2;

				var amount = parseInt($("[name='eyelets_amount']",this.el).val());

				if (  isNaN(amount) || amount < 4  ) amount = 4;

				/*
				if (  tmp = amount % this.getSidesNumber()  ){
					amount -= tmp;
				}
				*/

				// if (  amount % 4 > 0  ) amount += amount % 4;

				var stepLength = Math.round((perimeter / amount) * 1000) / 1000;

				var filtersProps = {
					"amount": amount,

					"amount_left":		null,
					"amount_right":		null,
					"amount_top":		null,
					"amount_bottom":	null,

					"stepLengthTop":		null,
					"stepLengthBottom":	null,
					"stepLengthLeft":		null,
					"stepLengthRight":		null
				};

				this.filters.eyelets.set("stepLength", stepLength);
				this.filters.eyelets.set(filtersProps);

				var eyeletsData = this.filters.eyelets.getEyelets();

				var tmp = {"left":{},"right":{},"top":{},"bottom":{}};

				for(var prop in tmp){
					if (!tmp.hasOwnProperty(prop)) continue;
					tmp[prop].amount = eyeletsData[prop].length;
					tmp[prop].stepLength =  eyeletsData[prop].length ? eyeletsData[prop][0].stepLength : null;
					tmp[prop].stepAutoLength = true;
				}

				this._interfaceSetEyelets(tmp);

				$("[name='eyelets_step']",this.el).val(stepLength);
			},


			"_eventChangeEyeletsParam": function(){
				this._interfaceSetEyelets(this._interfaceGetEyelets());
			},


			"_eventChangePageMargin": function(){

				// this._eventChangeEyeletsAmount();
				// this._eventChangeEyeletsStep();

				var tmp = this._interfaceGetEyelets();

				var isStepAutoLength = true;

				for(var prop in tmp){
					if (  !tmp.hasOwnProperty(prop)  ) continue;
					if (  !tmp[prop].isStepAutoLength  ){
						isStepAutoLength = false;
						break;
					}
				}

				this.filters.eyelets.set("pageMargin", parseFloat($("[name='margin']",this.el).val()));

				if (  isStepAutoLength  ){
					this._autoEyelets();
				} else {
					this.render();
				}

			},


			"_eventChangeStepLength2": function(){

				var filtersProps = {};
				var value, tmp, side;

				var inputs = $('[name*="eyelets_step_length_"]',this.el);

				var regExp = new RegExp(["_left", "_right", "_top", "_bottom"].join("|"),"g");

				for(var c=0; c<inputs.length; c++){
					if (  tmp = inputs[c].name.match(regExp)  ){
						side = tmp[0].replace("_","");
					} else {
						continue;
					}

					value = parseFloat(inputs[c].value);
					if (isNaN(value)) value = 1;
					if (!value) value = 1;

					filtersProps["stepLength" + _utils.stringCapFirst(side)] = value;
				}

				this.filters.eyelets.set(filtersProps);

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

				this.filters.eyelets.set({
					"amount": amount,
					"amount_left": amount,
					"amount_right": amount,
					"amount_top": amount,
					"amount_bottom": amount
				});

				this.interfaceSetEyeletsAmount(amount);

				this.render();

			},


			"_eventChangeEyeletsAmount": function(){

				this._autoEyelets();

			},


			"_eventChangeEyeletsAmount2": function(e){
				var tmp = $("[name*='eyelets_amount_']",this.el);
				var key, value;
				var amountSum = 0;

				for(var c=0; c<tmp.length; c++){
					value = tmp[0].value;
					if (!value) value = 2;
					if (isNaN(value)) value = 2;
					value = parseInt(value);
					value = Math.abs(value);
					if (value < 2) value = 2;

					tmp[0].value = value;

					amountSum += value;

					switch (e.currentTarget.name) {
						case "eyelets_amount_top":
							key = "amount_top";
							break;
						case "eyelets_amount_bottom":
							key = "amount_bottom";
							break;
						case "eyelets_amount_left":
							key = "amount_left";
							break;
						case "eyelets_amount_right":
							key = "amount_right";
							break;
					}

					this.filters.eyelets.set(key,value);

					this.render();
				}

				$('[name="eyelets_amount"]').val(amountSum);
			},


			"_eventChangeEyeletsDiam": function(){

				var diam = $('[name="eyelets_diameter"]', this.el).val();

				diam = parseFloat(diam);

				this.filters.eyelets.set("diameter", diam);

				var tmp = this._interfaceGetEyelets();

				var isStepAutoLength = true;

				for(var prop in tmp){
					if (  !tmp.hasOwnProperty(prop)  ) continue;
					if (  !tmp[prop].isStepAutoLength  ){
						isStepAutoLength = false;
						break;
					}
				}

				if (  isStepAutoLength  ){
					this._autoEyelets();
				} else {
					this.render();
				}

			},


			"_eventChangedPlacementFormat": function(){
				var value = $('[name="eyelets_placement_format"]:checked',this.el).val();

				this.filters.eyelets.set("placementFormat", value);

				var tmp = ["left", "right", "top", "bottom"];

				for(var c=0; c<tmp.length; c++){
					this.filters.eyelets.set("stepLength" + _utils.stringCapFirst(tmp[c]), null);
				}

				this._autoEyelets();

			},


			"_eventChangedDestFile": function(){
				// alert();
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
								self._eventChangePageMargin();
								self._eventChangeEyeletsDiam();
								self._eventChangeEyeletsAmount();
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


			"_eventClickSaveButton": function(){

				var modFs = require("fs");
				var modPath = require("path");
				var modChildProcess = require("child_process");

				var path = $('[name="destination_file"]',this.el).val();

				if (  !$('[name="source_file"]',this.el).val()  ){
					alert("Укажите путь к исходному файлу");
					return;
				}

				if (  !path  ){
					alert("Укажите путь к конечному файлу");
					return;
				}

				// -------------------------------------------------------------------

				var path_ = modPath.parse(path);

				if (  !modFs.existsSync(path_.dir)  ){
					if (  confirm("Указанная вами директория не существует. Создать её?")  ){
						modFs.mkdirSync(path_.dir);
					}
				}

				// -------------------------------------------------------------------

				var imScript = this.filters.eyelets.getIMagickScript({
					"dest": path,
					"script": true
				});

				console.log(imScript);

				// -------------------------------------------------------------------

				var date = new Date();

				var imScriptPath = modPath.join(config.tmp_dir, date.getTime() + "_im_script.txt");

				imScriptPath = imScriptPath.replace("\\","/");

				modFs.writeFileSync(imScriptPath, imScript);

				// -------------------------------------------------------------------

				var cmd = config.im_magick + ' -script "'+imScriptPath+'" ';

				modChildProcess.exec(
					cmd,
					function(err, stdOut, stdErr){
						if (err){
							var win = open("","Error");
							var body = win.document.querySelector("body");
							body.innerHTML = [err, stdOut, stdErr].join("<br />");
							return;
						}
						alert("Сохранено");
					}
				);

			},


			"initialize": function(){

				this.instances.push(this);

				this.filters = {};

				this.filters.eyelets = new EyeletsImageLayer();

				this._interfaceSetEyelets({
					"left": {"amount": 4, "stepAutoLength": true},
					"right": {"amount": 4, "stepAutoLength": true},
					"top": {"amount": 4, "stepAutoLength": true},
					"bottom": {"amount": 4, "stepAutoLength": true}
				});

			}

		});

		return OptionsPanelViewModel;
	}
);