/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .directive('dockPanel', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            scope: {

            },
            templateUrl: 'templates/dockPanel.tmpl.html',
            controller: 'DockPanelCtrl',
            link: function (scope, element, attrs) {

            }
        }
    }]);