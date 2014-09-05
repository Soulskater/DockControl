/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl', ['Attribute.Directives'])
    .constant('$alignment', {
        horizontal: "horizontal",
        vertical: "vertical"
    })
    .constant('$orientation', {
        left: "left",
        right: "right",
        top: "top",
        bottom: "bottom"
    })
    .directive('dock', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: 'templates/dock.tmpl.html',
            controller: 'DockCtrl',
            link: function ($scope, element, attrs) {

            }
        };
    }]);