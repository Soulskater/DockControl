/**
 * Created by gmeszaros on 10/6/2014.
 */
var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length - 1].src;
var dockControlRootPath = currentScriptPath.split("js/")[0];

angular.module('DockControl')
    .service("pathService", [ function () {
        return{
            templatesBaseUrl: dockControlRootPath + "templates/"
        };
    }]);