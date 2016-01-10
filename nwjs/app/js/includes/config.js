/**
 * Created by User on 30.12.15.
 */
define(
	[],
	function(){
		var modPath = require("path");

		var modFs = require("fs");

		var config = {
			"image_magick_dir": modPath.join(global.__dirname, "/../im"),
			"im_convert": null,
			"im_identify": null,
			"im_magick": null
		};

		config.tmp_dir = modPath.join(global.__dirname, "/app/tmp");

		if (  modFs.existsSync(config.image_magick_dir + "/convert.exe")  ){
			config.im_convert = modPath.join(config.image_magick_dir + "/convert.exe");
		}

		if (  modFs.existsSync(config.image_magick_dir + "/identify.exe")  ){
			config.im_identify = modPath.join(config.image_magick_dir + "/identify.exe");
		}

		if (  modFs.existsSync(config.image_magick_dir + "/magick.exe")  ){
			config.im_magick = modPath.join(config.image_magick_dir + "/magick.exe");
		}

		return config;
	}
);