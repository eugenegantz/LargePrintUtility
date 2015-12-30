/**
 * Created by User on 30.12.15.
 */
define(
	[],
	function(){
		// LoadingScreen
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

		return LoadingScreen;
	}
);