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
    }])
    .directive('elementLeave', [function () {
        return {
            restrict: 'A',
            replace: true,
            link: function ($scope, element, attrs) {
                var active = false;
                var domClickHandler = function (event) {
                    if(!active && $(event.target).parents(element).length >= 0)
                        return;
                    $scope.$apply(function () {
                        $scope.$eval(attrs.elementLeave, { $event: event });
                    });
                    active = false;
                };
                var elementClickHandler = function ($event) {
                    active = true;
                    $event.stopPropagation();
                };
                element.click(elementClickHandler);
                $(document).click(domClickHandler);

                //
                //Disposing
                $scope.$on('$destroy', function () {
                    $(document).unbind('click', domClickHandler);
                    element.unbind('click', elementClickHandler);
                });
            }
        };
    }]);