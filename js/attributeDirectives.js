/**
 * Created by gmeszaros on 9/5/2014.
 */
angular.module('Attribute.Directives', [])
    .directive('minWidth', [function () {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {
                element.css({minWidth: attrs.minWidth});
            }
        };
    }])
    .directive('minHeight', [function () {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {
                element.css({minHeight: attrs.minHeight});
            }
        };
    }]);