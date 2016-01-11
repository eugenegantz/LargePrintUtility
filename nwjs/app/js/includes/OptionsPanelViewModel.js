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

						if (  !self._operImageContainer  ) return;

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


			"_interfaceSetDefault": function(){

				/*
				this._interfaceSetEyelets({
					"left": {"amount": 4, "stepAutoLength": true},
					"right": {"amount": 4, "stepAutoLength": true},
					"top": {"amount": 4, "stepAutoLength": true},
					"bottom": {"amount": 4, "stepAutoLength": true}
				});
				*/

				$('[name="eyelets_amount"]',this.el).val("16");

				this._autoEyelets();

				this._refreshEyelets();

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
					stepLength_ = null,
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

				// this.filters.eyelets.set(filterArg);

				if (  $('[name="source_file"]', this.el).val()  ){
					// this.render();
					this._refreshEyelets();
				}

			},


			"_refreshEyelets": function(){

				var margin = parseFloat($("[name='margin']",this.el).val());
				var diam = parseFloat($("[name='eyelets_diameter']",this.el).val());
				var plc = $('[name="eyelets_placement_format"]:checked').val();
				var eyelets = this._interfaceGetEyelets();

				for(var side in eyelets){
					if (  !eyelets.hasOwnProperty(side)  ) continue;
					this.filters.eyelets.set(
						"stepLength"+_utils.stringCapFirst(side),
						(
							eyelets[side].isStepAutoLength
								? null
								: parseFloat(eyelets[side].stepLength)
						)
					);
					this.filters.eyelets.set("amount_"+side, eyelets[side].amount);
				}

				this.filters.eyelets.set("placementFormat", plc);

				this.filters.eyelets.set("pageMargin", margin);

				this.filters.eyelets.set("diameter", diam);

				this.render();

			},


			"_autoEyelets": function(){

				if (  !this._operImageContainer  ) return;

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

				tmp = {"left":{},"right":{},"top":{},"bottom":{}};

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
				this._refreshEyelets();
			},


			"_eventChangePageMargin": function(){

				this._refreshEyelets();

			},


			"_eventChangeEyeletsDiam": function(){

				this._refreshEyelets();

			},


			"_eventChangeStepLength2": function(){

				this._refreshEyelets();

			},


			"_eventChangeEyeletsStep": function(){},


			"_eventChangeEyeletsAmount": function(){

				this._autoEyelets();

				this._refreshEyelets();

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

					// this.filters.eyelets.set(key,value);

					// this.render();
				}

				$('[name="eyelets_amount"]').val(amountSum);

				this._refreshEyelets();
			},


			"_eventChangedPlacementFormat": function(e){

				var plc = e.currentTarget.value;

				var amount = parseInt($('[name="eyelets_amount"]',this.el).val());

				this.filters.eyelets.set("placementFormat", plc);

				if (plc == "perimeter" && amount < 6){
					$('[name="eyelets_amount"]',this.el).val(6);
				}

				this._autoEyelets();

				this._refreshEyelets();

			},


			"_eventChangedDestFile": function(){
				// void 0;
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
								self._interfaceSetDefault();
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

				this._interfaceSetDefault();

			}

		});

		return OptionsPanelViewModel;
	}
);