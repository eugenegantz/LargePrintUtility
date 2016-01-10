/**
 * Created by User on 30.12.15.
 */
define(
	["./config"],
	function(config){
		return Backbone.Model.extend({

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


			"_calcPos": function(arg){
				if (typeof arg != "object") return null;
				var width = typeof arg.width == "undefined" ? null : parseFloat(arg.width);
				var amount = typeof arg.amount == "undefined" ? null : parseInt(arg.amount);

				if (!width || !amount) return null;
			},


			"getEyelets": function(){

				var sides = {
					"top": [],
					"right": [],
					"bottom": [],
					"left": []
				};

				// --------------------------------------------------------------------------------

				var self					= this;
				var amount			= this.get("amount");
				var plc					= this.get("placementFormat");
				var container			= this.get("container");
				var imageInstance	= container.image;
				var rect					= imageInstance.getRect({"units": "cm", "round": 4});
				var margin				= this.get("pageMargin");
				var diam				= this.get("diameter");

				var long				= rect.w > rect.h ? rect.w : rect.h;
				var short			= rect.w < rect.h ? rect.w : rect.h;
				var width			= rect.w;
				var height			= rect.h;
				var mWidth		= width - (margin * 2);
				var mHeight		= height - (margin * 2);
				var P					= (width + height) * 2;
				var ratio				= width / height;
				var ratio2			= long / short;

				var stepLength	= (P - (margin * 4)) / amount;

				var sideAmount, pos, c, prop, side, item;

				// --------------------------------------------------------------------------------

				var useSides = [];

				if (  plc == "perimeter"  ){
					useSides = ["top", "right", "bottom", "left"];
					stepLength = (P - (margin * 4)) / amount;

				} else if (  ["top", "right", "bottom", "left"].indexOf(plc) > -1  ) {
					useSides = [plc];
					if (  ["top","bottom"].indexOf(plc) > -1  ){
						stepLength = mWidth / amount;
					} else {
						stepLength = mHeight / amount;
					}

				} else if (  plc == "long_sides"  ) {
					useSides = width > height ? ["top", "bottom"] : ["left", "right"];
					stepLength = ((long - (margin * 2)) * 2) / amount;

				} else if (  plc == "short_sides"  ) {
					useSides = width < height ? ["top", "bottom"] : ["left", "right"];
					stepLength = ((short - (margin * 2)) * 2) / amount;

				} else if (  plc == "corners"  ) {
					return {
						"top":		[
							{"x":margin, "y":margin, "stepLength": -1},
							{"x":mWidth + margin - diam, "y":margin, "stepLength": -1}
						],
						"bottom":	[
							{"x":margin, "y":mHeight + margin - diam, "stepLength": -1},
							{"x":mWidth + margin - diam, "y":mHeight + margin - diam, "stepLength": -1}
						],
						"left":		[],
						"right":		[]
					};

				}

				// --------------------------------------------------------------------------------

				var calcSideAmount = function(side){
					var sidesCount = 0;
					var tmp;
					var alreadyPlacedEyeletsAmount = 0;
					var merged = sides.top.concat(sides.left, sides.bottom, sides.right);

					if (  self.get("amount_"+side) !== null  ){
						return self.get("amount_"+side);
					}

					var isShortSide;

					if (["top","bottom"].indexOf(side) > -1){
						isShortSide = width < height ? 1 : 0;
					} else {
						isShortSide = height < width ? 1 : 0;
					}

					if (  !merged.length  ){
						tmp = Math.round((["top","bottom"].indexOf(side) > -1 ? mWidth : mHeight) / stepLength);
						if (!isShortSide){
							//tmp = Math.ceil(tmp * ratio2);
						}
						return tmp;
					}

					if (  ["top","bottom"].indexOf(side) > -1  ){
						if (sides.top.length || sides.bottom.length){
							return sides.top.length || sides.bottom.length;
						}
						if (sides.left.length || sides.right.length){
							alreadyPlacedEyeletsAmount = sides.left.length || sides.right.length;
							alreadyPlacedEyeletsAmount *= _utils.arrayIntersect(useSides,["left","right"]).length;
						}
						sidesCount = _utils.arrayIntersect(useSides,["top","bottom"]).length;

					} else if (   ["left","right"].indexOf(side) > -1  ){
						if (sides.right.length || sides.left.length){
							return sides.right.length || sides.left.length;
						}
						if (sides.top.length || sides.bottom.length){
							alreadyPlacedEyeletsAmount = sides.top.length || sides.bottom.length;
							alreadyPlacedEyeletsAmount *= _utils.arrayIntersect(useSides,["top","bottom"]).length;
						}
						sidesCount = _utils.arrayIntersect(useSides,["top","bottom"]).length;

					}

					var sideAmount = (amount - alreadyPlacedEyeletsAmount) / sidesCount;
					if (sideAmount == Infinity) sideAmount = 0;
					return sideAmount;
				};

				var calcSideStepLength = function(side, amount){
					var tmp = self.get("stepLength" + _utils.stringCapFirst(side));
					if (  tmp !== null  ){
						return tmp;
					}

					if (  side == "top" || side == "bottom"  ) {
						return Math.round(((mWidth - diam) / (amount - 1)) * 1000) / 1000;

					} else if (  side == "left" || side == "right"  ){
						tmp = sides.top.concat(sides.bottom);
						return Math.round(((mHeight - (!tmp.length ? diam : 0)) / (amount + (!tmp.length ? -1 : 0))) * 1000) / 1000;

					}
				};

				var
					top			= 0,
					bottom		= 0,
					left			= 0,
					right			= 0,
					vPad			= 0,
					hPad			= 0,
					sideStepLength_ = 0;

				// --------------------------------------------------------------------------------

				for(  prop in sides  ){
					if (  !sides.hasOwnProperty(prop)  ) continue;
					if (  useSides.indexOf(prop) == -1  ) continue;

					side = sides[prop];

					if (  prop == "top"  ){
						sideAmount = calcSideAmount(prop);
						//sideStepLength_ = Math.round((mWidth / (sideAmount - 1)) * 1000) / 1000;
						sideStepLength_ = calcSideStepLength(prop, sideAmount);

						pos = {
							"x": margin,
							"y": margin
						};

						for(c=0; c<sideAmount; c++){

							if (  c== 0  ) {

							} else if (  c == sideAmount - 1  ) {
								pos.x += sideStepLength_;

							} else {
								pos.x += sideStepLength_;

							}

							item = {"x": pos.x, "y": pos.y, "stepLength": sideStepLength_};

							side.push(item);

						}

					} else if (  prop == "left"  ) {
						sideAmount = calcSideAmount(prop);
						//sideStepLength_ = Math.round((mHeight / (sideAmount)) * 1000) / 1000;
						sideStepLength_ = calcSideStepLength(prop, sideAmount);

						pos = {
							"x": margin,
							"y": margin
						};

						top = pos.y;
						bottom = pos.y;

						for(c=0; c<sideAmount; c++){

							if (c == 0){

							} else if (c == sideAmount - 1){
								pos.y += sideStepLength_;
								bottom = pos.y + diam;

							} else {
								pos.y += sideStepLength_;

							}

							item = {"x": pos.x, "y": pos.y, "stepLength": sideStepLength_};

							side.push(item);

						}

						vPad = (top + mHeight - bottom) / 2;

						for(c=0; c<side.length; c++){
							side[c].y += vPad;
						}

					} else if (  prop == "bottom"  ) {
						sideAmount = calcSideAmount(prop);
						//sideStepLength_ = Math.round((mWidth / (sideAmount - 1)) * 1000) / 1000;
						sideStepLength_ = calcSideStepLength(prop, sideAmount);

						pos = {
							"x": margin,
							"y": mHeight + margin - diam
						};

						for(c=0; c<sideAmount; c++){

							if (  c== 0  ) {

							} else if (  c == sideAmount - 1  ) {
								pos.x += sideStepLength_;

							} else {
								pos.x += sideStepLength_;

							}

							item = {"x": pos.x, "y": pos.y, "stepLength": sideStepLength_};

							side.push(item);

						}

					} else if (  prop == "right"  ) {
						sideAmount = calcSideAmount(prop);
						//sideStepLength_ = Math.round((mHeight / (sideAmount)) * 1000) / 1000;
						sideStepLength_ = calcSideStepLength(prop, sideAmount);

						pos = {
							"x": mWidth + margin - diam,
							"y": margin
						};

						top = pos.y;
						bottom = pos.y;

						for(c=0; c<sideAmount; c++){
							if (c == 0){

							} else if (c == sideAmount - 1){
								pos.y += sideStepLength_;
								bottom = pos.y + diam;

							} else {
								pos.y += sideStepLength_;

							}

							item = {"x": pos.x, "y": pos.y, "stepLength": sideStepLength_};
							side.push(item);

						}

						vPad = (top + mHeight - bottom) / 2;

						for(c=0; c<side.length; c++){
							side[c].y += vPad;
						}

					}

				}

				return sides;
			},


			"applyFilter": function(){

				var ctx					= this.get("ctx");
				var container			= this.get("container");
				var imageInstance	= container.image;

				// --------------------------------------------------------------------------------

				var sides = this.getEyelets();

				// --------------------------------------------------------------------------------

				var diam = this.get("diameter");

				var c, prop, side;

				// --------------------------------------------------------------------------------

				var drawFx = function(item){
					var DPI = imageInstance.get("DPI");
					var DPcm = DPI / 2.54;

					item.x = (item.x + (diam / 2)) * DPcm;
					item.y = (item.y + (diam / 2)) * DPcm;

					ctx.beginPath();
					ctx.arc(item.x, item.y, (diam * DPcm) / 2, 0, 2*Math.PI, false);
					ctx.strokeStyle="red";
					ctx.lineWidth=4;
					ctx.stroke();
					ctx.fillStyle="white";
					ctx.fill();
				};

				// --------------------------------------------------------------------------------

				for(prop in sides){
					if (  !sides.hasOwnProperty(prop)  ) continue;

					side = sides[prop];

					if (!side.length) continue;

					for(c=0; c<side.length; c++){

						drawFx(side[c]);

					}

				}

			},


			"getIMagickScript": function(arg){
				if (  typeof arg  != "object"  ) return null;

				var dest = typeof arg.dest == "string" ? arg.dest : null;

				var isScript = typeof arg.script == "undefined" ? false : Boolean(arg.script);

				if (!dest){
					throw new Error("Destination filepath is not assigned");
				}

				// --------------------------------------------------------------------------------

				var ctx					= this.get("ctx");
				var container			= this.get("container");
				var imageInstance	= container.image;
				var rect					= imageInstance.getRect({"units": "cm", "round": 4});

				// --------------------------------------------------------------------------------

				var eyeletsData = this.getEyelets();

				eyeletsData = eyeletsData.top.concat(eyeletsData.bottom, eyeletsData.left, eyeletsData.right);

				// --------------------------------------------------------------------------------

				var diam = this.get("diameter");

				var c, point, draws = [];

				var DPI = imageInstance.get("DPI");
				var DPcm = DPI / 2.54;

				var imPointFn = function(x,y){
					var radius = diam / 2;
					var tmp = {
						"x0": (x + radius) * DPcm,
						"y0": (y + radius) * DPcm,
						"xr": (x + radius) * DPcm,
						"yr": (y + diam) * DPcm
					};
					for(var prop in tmp){
						if (!tmp.hasOwnProperty(prop)) continue;
						tmp[prop] = Math.round(tmp[prop] * 1000) / 1000
					}
					return tmp;
				};

				for(c=0; c<eyeletsData.length; c++){
					point = imPointFn(eyeletsData[c].x, eyeletsData[c].y);
					draws.push('-draw "circle '+point.x0+','+point.y0+' '+point.xr+','+point.yr+'"');
				}

				return (!isScript ? config.im_magick.replace(/[\\]/g,"/") : "") + ' -verbose "'+imageInstance.get("path").replace(/[\\]/g,"/")+'" -fill "white" -stroke "red" '+draws.join(" ")+' -write "'+dest.replace(/[\\]/g,"/")+'" ';
			},


			"applyFilterIMagick": function(arg){

			}

		});
	}
);