/**
 * Created by User on 30.12.15.
 */
define(
	[],
	function(){
		var ViewportPanelViewModel = Backbone.View.extend({

			"instances": [],


			"getInstance": function(A){
				return this.instances.length ? this.instances[0] : new ViewportPanelViewModel(A);
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

		return ViewportPanelViewModel;
	}
);