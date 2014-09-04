/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .directive('dockControl', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            scope: {

            },
            templateUrl: 'templates/dockControl.tmpl.html',
            controller: 'DockControlCtrl',
            link: function (scope, element, attrs) {

            }
        }
    }]);