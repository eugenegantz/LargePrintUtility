/**
 * Created by User on 30.12.15.
 */
define(
	[],
	function(){
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
	}
);