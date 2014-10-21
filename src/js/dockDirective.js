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
    .directive('dock', ["pathService", function ($path) {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: $path.templatesBaseUrl + 'dock.tmpl.html',
            controller: 'DockCtrl',
            link: function ($scope, element, attrs) {
                $scope.offset = _absoluteOffset($('.panel-container'));

                function _absoluteOffset(element) {
                    var top = 0, left = 0;
                    do {
                        if (element.offset()) {
                            top += element.offset().top || 0;
                            left += element.offset().left || 0;
                        }
                        element = element.parent();
                    } while (element.length > 0);

                    return {
                        top: top,
                        left: left
                    };
                }
            }
        };
    }]);