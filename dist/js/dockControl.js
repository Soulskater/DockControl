/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl', ['Attribute.Directives'])
    .constant('$alignment', {
        horizontal: "horizontal",
        vertical: "vertical",
        middle: "middle"
    })
    .constant('$orientation', {
        left: "left",
        right: "right",
        top: "top",
        bottom: "bottom",
        center: "center"
    })
    .directive('dock', ["DockControl.PathService", function ($path) {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: $path.templatesBaseUrl + 'dock.tmpl.html',
            scope: {
                sizeChanged: '='
            },
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
/**
 * Created by gmeszaros on 9/5/2014.
 */
angular.module('Attribute.Directives', [])
    .directive('width', [function () {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {
                element.css({width: attrs.width});
            }
        };
    }])
    .directive('height', [function () {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {
                element.css({height: attrs.height});
            }
        };
    }])
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
                    if(event.target === element[0] || $(event.target).closest(element).length > 0)
                        return;
                    $scope.$apply(function () {
                        $scope.$eval(attrs.elementLeave, { $event: event });
                    });
                    active = false;
                    $(document).unbind('click', domClickHandler);
                };
                var elementClickHandler = function ($event) {
                    active = true;
                    $(document).click(domClickHandler);
                    //$event.stopPropagation();
                };
                element.click(elementClickHandler);

                //
                //Disposing
                $scope.$on('$destroy', function () {
                    $(document).unbind('click', domClickHandler);
                    element.unbind('click', elementClickHandler);
                });
            }
        };
    }]);
/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .controller('DockCtrl', ['$scope', '$orientation', '$alignment', function ($scope, $orientation, $align) {
        this.addPanel = function (panel) {
            $scope.panels.push(panel);
        };
        this.panelDockedChanged = function (panel) {
            if (panel.docked) {
                panel.setToDefault();
            }
            _setSize(panel);
        };
        this.panelCollapseChanged = function (panel) {
            /*linq($scope.panels).forEach(function (item) {
                if (item !== panel && item.orientation === panel.orientation) {
                    item.collapsed = true;
                }
            });*/
        };

        function _setSize(refPanel) {
            linq($scope.panels).where(function (item) {
                return item.align !== refPanel.align;
            }).forEach(function (panel) {
                if (!panel.docked || (panel.docked && panel.index < refPanel.index)) {
                    panel[refPanel.orientation] = refPanel.docked ? refPanel.size : 0;
                }
            });
            $scope.sizeChanged = !$scope.sizeChanged;
        }

        $scope.$orientation = $orientation;
        $scope.panels = [];
        $scope.drag = function (event) {
            var panel = linq($scope.panels).firstOrDefault(function (item) {
                return item.dragging;
            });
            if (!panel) {
                return;
            }
            switch (panel.align) {
                case $align.horizontal:
                    panel.size = panel.orientation === $orientation.left ? event.clientX - $scope.offset.left + 5 : $(event.currentTarget).width() - event.clientX - $scope.offset.left + 5;
                    break;
                case $align.vertical:
                    panel.size = panel.orientation === $orientation.top ? event.clientY - $scope.offset.left : $(event.currentTarget).height() - event.clientY - $scope.offset.left;
                    break;
            }
            linq($scope.panels)
                .forEach(function (item) {
                    _setSize(item);
                });
        };

        $scope.endDrag = function () {
            linq($scope.panels).forEach(function (item) {
                item.dragging = false;
            });
        };
    }]);
/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .controller('PanelCtrl', ['$scope', '$alignment', '$orientation', function ($scope, $align, $orientation) {

        this.toggleDock = function () {
            $scope.toggleDock();
        };

        this.toggleCollapse = function () {
            $scope.toggleCollapse();
        };

        this.setHeader = function (header) {
            $scope.header = header;
        };

        this.hasHeader = function () {
            return $scope.header !== "";
        };

        function getAlign(orientation) {
            if ($scope.orientation === $orientation.left || $scope.orientation === $orientation.right) {
                return $align.horizontal;
            }
            if ($scope.orientation === $orientation.top || $scope.orientation === $orientation.bottom) {
                return $align.vertical;
            }
            return $align.middle;
        }

        $scope.toggleDock = function () {
            $scope.docked = !$scope.docked;
        };

        $scope.$align = $align;
        $scope.$orientation = $orientation;
        $scope.docked = false;
        $scope.collapsed = false;
        $scope.dragging = false;
        $scope.header = "";
        $scope.align = getAlign($scope.orientation);
        if ($scope.orientation === $orientation.center) {
            $scope.align = $align.middle;
        }

        $scope.startDrag = function () {
            $scope.dragging = true;
        };

        $scope.panelExpand = function ($event) {
            $scope.collapsed = false;
        };

        $scope.panelLeave = function ($event) {
            if (!$scope.docked) {
                $scope.collapsed = true;
            }
        };

        $scope.setToDefault = function () {
            $scope.left = '';
            $scope.right = '';
            $scope.top = '';
            $scope.bottom = '';
        };

        $scope.setStyle = function () {
            return {
                width: $scope.align === $align.horizontal ? $scope.size : '',
                height: $scope.align === $align.vertical ? $scope.size : '',
                left: $scope.left,
                right: $scope.right,
                top: $scope.top,
                bottom: $scope.bottom
            };
        };
    }]);
/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .directive('panel', ["DockControl.PathService", function ($path) {
        return {
            restrict: 'AE',
            require: '^dock',
            replace: true,
            transclude: true,
            scope: {
                size: '=',
                minSize: '=',
                index: '@',
                orientation: '@'
            },
            templateUrl: $path.templatesBaseUrl + 'panel.tmpl.html',
            controller: 'PanelCtrl',
            link: function ($scope, element, attrs, dockCtrl) {
                //$scope.size = parseFloat($scope.size);

                //
                //Add panel to the dock
                dockCtrl.addPanel($scope);

                $scope.$watch('docked', function (value) {

                    if (value !== undefined) {
                        dockCtrl.panelDockedChanged($scope);
                    }
                });

                $scope.docked = attrs.docked === "true" ? true : false;

                $scope.toggleCollapse = function () {
                    $scope.collapsed = !$scope.collapsed;
                    dockCtrl.panelCollapseChanged($scope);
                };
            }
        };
    }])
    .directive('header', ["DockControl.PathService", function ($path) {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            require: '^panel',
            templateUrl: $path.templatesBaseUrl + 'header.tmpl.html',
            link: function ($scope, element, attrs, panelCtrl) {
                $scope.docked = false;
                $scope.toggleDock = function () {
                    panelCtrl.toggleDock();
                    $scope.docked = !$scope.docked;
                };
                $scope.toggleCollapse = function () {
                    panelCtrl.toggleCollapse();
                };
                panelCtrl.setHeader(element.text());
            }
        };
    }])
    .directive('content', ["DockControl.PathService", function ($path) {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            require: '^panel',
            templateUrl: $path.templatesBaseUrl + 'content.tmpl.html',
            link: function (scope, element, attrs, panelCtrl) {
                scope.hasHeader = panelCtrl.hasHeader();
            }
        };
    }]);
/**
 * Created by gmeszaros on 10/6/2014.
 */
var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length - 1].src;
var dockControlRootPath = currentScriptPath.split("js/")[0];

angular.module('DockControl')
    .service("DockControl.PathService", [ function () {
        return{
            templatesBaseUrl: dockControlRootPath + "templates/"
        };
    }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRvY2tEaXJlY3RpdmUuanMiLCJhdHRyaWJ1dGVEaXJlY3RpdmVzLmpzIiwiZG9ja0N0cmwuanMiLCJwYW5lbEN0cmwuanMiLCJwYW5lbERpcmVjdGl2ZS5qcyIsInJlc291cmNlUGF0aFNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZG9ja0NvbnRyb2wuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnLCBbJ0F0dHJpYnV0ZS5EaXJlY3RpdmVzJ10pXHJcbiAgICAuY29uc3RhbnQoJyRhbGlnbm1lbnQnLCB7XHJcbiAgICAgICAgaG9yaXpvbnRhbDogXCJob3Jpem9udGFsXCIsXHJcbiAgICAgICAgdmVydGljYWw6IFwidmVydGljYWxcIixcclxuICAgICAgICBtaWRkbGU6IFwibWlkZGxlXCJcclxuICAgIH0pXHJcbiAgICAuY29uc3RhbnQoJyRvcmllbnRhdGlvbicsIHtcclxuICAgICAgICBsZWZ0OiBcImxlZnRcIixcclxuICAgICAgICByaWdodDogXCJyaWdodFwiLFxyXG4gICAgICAgIHRvcDogXCJ0b3BcIixcclxuICAgICAgICBib3R0b206IFwiYm90dG9tXCIsXHJcbiAgICAgICAgY2VudGVyOiBcImNlbnRlclwiXHJcbiAgICB9KVxyXG4gICAgLmRpcmVjdGl2ZSgnZG9jaycsIFtcIkRvY2tDb250cm9sLlBhdGhTZXJ2aWNlXCIsIGZ1bmN0aW9uICgkcGF0aCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdkb2NrLnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBzaXplQ2hhbmdlZDogJz0nXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEb2NrQ3RybCcsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uICgkc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUub2Zmc2V0ID0gX2Fic29sdXRlT2Zmc2V0KCQoJy5wYW5lbC1jb250YWluZXInKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gX2Fic29sdXRlT2Zmc2V0KGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG9wID0gMCwgbGVmdCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5vZmZzZXQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wICs9IGVsZW1lbnQub2Zmc2V0KCkudG9wIHx8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ICs9IGVsZW1lbnQub2Zmc2V0KCkubGVmdCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGVsZW1lbnQubGVuZ3RoID4gMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDkvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0F0dHJpYnV0ZS5EaXJlY3RpdmVzJywgW10pXHJcbiAgICAuZGlyZWN0aXZlKCd3aWR0aCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe3dpZHRoOiBhdHRycy53aWR0aH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnaGVpZ2h0JywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7aGVpZ2h0OiBhdHRycy5oZWlnaHR9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ21pbldpZHRoJywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7bWluV2lkdGg6IGF0dHJzLm1pbldpZHRofSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdtaW5IZWlnaHQnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHttaW5IZWlnaHQ6IGF0dHJzLm1pbkhlaWdodH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnZWxlbWVudExlYXZlJywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvbUNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGV2ZW50LnRhcmdldCA9PT0gZWxlbWVudFswXSB8fCAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChlbGVtZW50KS5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZXZhbChhdHRycy5lbGVtZW50TGVhdmUsIHsgJGV2ZW50OiBldmVudCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2NsaWNrJywgZG9tQ2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudENsaWNrSGFuZGxlciA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLmNsaWNrKGRvbUNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8kZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jbGljayhlbGVtZW50Q2xpY2tIYW5kbGVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAgICAgLy9EaXNwb3NpbmdcclxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnVuYmluZCgnY2xpY2snLCBkb21DbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudW5iaW5kKCdjbGljaycsIGVsZW1lbnRDbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA4LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuY29udHJvbGxlcignRG9ja0N0cmwnLCBbJyRzY29wZScsICckb3JpZW50YXRpb24nLCAnJGFsaWdubWVudCcsIGZ1bmN0aW9uICgkc2NvcGUsICRvcmllbnRhdGlvbiwgJGFsaWduKSB7XHJcbiAgICAgICAgdGhpcy5hZGRQYW5lbCA9IGZ1bmN0aW9uIChwYW5lbCkge1xyXG4gICAgICAgICAgICAkc2NvcGUucGFuZWxzLnB1c2gocGFuZWwpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5wYW5lbERvY2tlZENoYW5nZWQgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgaWYgKHBhbmVsLmRvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgcGFuZWwuc2V0VG9EZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3NldFNpemUocGFuZWwpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5wYW5lbENvbGxhcHNlQ2hhbmdlZCA9IGZ1bmN0aW9uIChwYW5lbCkge1xyXG4gICAgICAgICAgICAvKmxpbnEoJHNjb3BlLnBhbmVscykuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gIT09IHBhbmVsICYmIGl0ZW0ub3JpZW50YXRpb24gPT09IHBhbmVsLm9yaWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jb2xsYXBzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTsqL1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9zZXRTaXplKHJlZlBhbmVsKSB7XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykud2hlcmUoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmFsaWduICE9PSByZWZQYW5lbC5hbGlnbjtcclxuICAgICAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghcGFuZWwuZG9ja2VkIHx8IChwYW5lbC5kb2NrZWQgJiYgcGFuZWwuaW5kZXggPCByZWZQYW5lbC5pbmRleCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbFtyZWZQYW5lbC5vcmllbnRhdGlvbl0gPSByZWZQYW5lbC5kb2NrZWQgPyByZWZQYW5lbC5zaXplIDogMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICRzY29wZS5zaXplQ2hhbmdlZCA9ICEkc2NvcGUuc2l6ZUNoYW5nZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUuJG9yaWVudGF0aW9uID0gJG9yaWVudGF0aW9uO1xyXG4gICAgICAgICRzY29wZS5wYW5lbHMgPSBbXTtcclxuICAgICAgICAkc2NvcGUuZHJhZyA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICB2YXIgcGFuZWwgPSBsaW5xKCRzY29wZS5wYW5lbHMpLmZpcnN0T3JEZWZhdWx0KGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5kcmFnZ2luZztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmICghcGFuZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzd2l0Y2ggKHBhbmVsLmFsaWduKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICRhbGlnbi5ob3Jpem9udGFsOlxyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLnNpemUgPSBwYW5lbC5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLmxlZnQgPyBldmVudC5jbGllbnRYIC0gJHNjb3BlLm9mZnNldC5sZWZ0ICsgNSA6ICQoZXZlbnQuY3VycmVudFRhcmdldCkud2lkdGgoKSAtIGV2ZW50LmNsaWVudFggLSAkc2NvcGUub2Zmc2V0LmxlZnQgKyA1O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAkYWxpZ24udmVydGljYWw6XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwuc2l6ZSA9IHBhbmVsLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24udG9wID8gZXZlbnQuY2xpZW50WSAtICRzY29wZS5vZmZzZXQubGVmdCA6ICQoZXZlbnQuY3VycmVudFRhcmdldCkuaGVpZ2h0KCkgLSBldmVudC5jbGllbnRZIC0gJHNjb3BlLm9mZnNldC5sZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscylcclxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3NldFNpemUoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuZW5kRHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgbGlucSgkc2NvcGUucGFuZWxzKS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJylcclxuICAgIC5jb250cm9sbGVyKCdQYW5lbEN0cmwnLCBbJyRzY29wZScsICckYWxpZ25tZW50JywgJyRvcmllbnRhdGlvbicsIGZ1bmN0aW9uICgkc2NvcGUsICRhbGlnbiwgJG9yaWVudGF0aW9uKSB7XHJcblxyXG4gICAgICAgIHRoaXMudG9nZ2xlRG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZURvY2soKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnRvZ2dsZUNvbGxhcHNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2UoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNldEhlYWRlciA9IGZ1bmN0aW9uIChoZWFkZXIpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmhlYWRlciA9IGhlYWRlcjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmhhc0hlYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5oZWFkZXIgIT09IFwiXCI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0QWxpZ24ob3JpZW50YXRpb24pIHtcclxuICAgICAgICAgICAgaWYgKCRzY29wZS5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLmxlZnQgfHwgJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24ucmlnaHQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkYWxpZ24uaG9yaXpvbnRhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24udG9wIHx8ICRzY29wZS5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLmJvdHRvbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRhbGlnbi52ZXJ0aWNhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gJGFsaWduLm1pZGRsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRzY29wZS50b2dnbGVEb2NrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gISRzY29wZS5kb2NrZWQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLiRhbGlnbiA9ICRhbGlnbjtcclxuICAgICAgICAkc2NvcGUuJG9yaWVudGF0aW9uID0gJG9yaWVudGF0aW9uO1xyXG4gICAgICAgICRzY29wZS5kb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmhlYWRlciA9IFwiXCI7XHJcbiAgICAgICAgJHNjb3BlLmFsaWduID0gZ2V0QWxpZ24oJHNjb3BlLm9yaWVudGF0aW9uKTtcclxuICAgICAgICBpZiAoJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24uY2VudGVyKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5hbGlnbiA9ICRhbGlnbi5taWRkbGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUuc3RhcnREcmFnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZHJhZ2dpbmcgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5wYW5lbEV4cGFuZCA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5wYW5lbExlYXZlID0gZnVuY3Rpb24gKCRldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoISRzY29wZS5kb2NrZWQpIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5jb2xsYXBzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnNldFRvRGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmxlZnQgPSAnJztcclxuICAgICAgICAgICAgJHNjb3BlLnJpZ2h0ID0gJyc7XHJcbiAgICAgICAgICAgICRzY29wZS50b3AgPSAnJztcclxuICAgICAgICAgICAgJHNjb3BlLmJvdHRvbSA9ICcnO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5zZXRTdHlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi5ob3Jpem9udGFsID8gJHNjb3BlLnNpemUgOiAnJyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJHNjb3BlLmFsaWduID09PSAkYWxpZ24udmVydGljYWwgPyAkc2NvcGUuc2l6ZSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogJHNjb3BlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICByaWdodDogJHNjb3BlLnJpZ2h0LFxyXG4gICAgICAgICAgICAgICAgdG9wOiAkc2NvcGUudG9wLFxyXG4gICAgICAgICAgICAgICAgYm90dG9tOiAkc2NvcGUuYm90dG9tXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmRpcmVjdGl2ZSgncGFuZWwnLCBbXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVxdWlyZTogJ15kb2NrJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIHNpemU6ICc9JyxcclxuICAgICAgICAgICAgICAgIG1pblNpemU6ICc9JyxcclxuICAgICAgICAgICAgICAgIGluZGV4OiAnQCcsXHJcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbjogJ0AnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAkcGF0aC50ZW1wbGF0ZXNCYXNlVXJsICsgJ3BhbmVsLnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQYW5lbEN0cmwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycywgZG9ja0N0cmwpIHtcclxuICAgICAgICAgICAgICAgIC8vJHNjb3BlLnNpemUgPSBwYXJzZUZsb2F0KCRzY29wZS5zaXplKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAgICAgLy9BZGQgcGFuZWwgdG8gdGhlIGRvY2tcclxuICAgICAgICAgICAgICAgIGRvY2tDdHJsLmFkZFBhbmVsKCRzY29wZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnZG9ja2VkJywgZnVuY3Rpb24gKHZhbHVlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY2tDdHJsLnBhbmVsRG9ja2VkQ2hhbmdlZCgkc2NvcGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICRzY29wZS5kb2NrZWQgPSBhdHRycy5kb2NrZWQgPT09IFwidHJ1ZVwiID8gdHJ1ZSA6IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVDb2xsYXBzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gISRzY29wZS5jb2xsYXBzZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9ja0N0cmwucGFuZWxDb2xsYXBzZUNoYW5nZWQoJHNjb3BlKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdoZWFkZXInLCBbXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgcmVxdWlyZTogJ15wYW5lbCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAkcGF0aC50ZW1wbGF0ZXNCYXNlVXJsICsgJ2hlYWRlci50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycywgcGFuZWxDdHJsKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlRG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbEN0cmwudG9nZ2xlRG9jaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kb2NrZWQgPSAhJHNjb3BlLmRvY2tlZDtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxDdHJsLnRvZ2dsZUNvbGxhcHNlKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcGFuZWxDdHJsLnNldEhlYWRlcihlbGVtZW50LnRleHQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdjb250ZW50JywgW1wiRG9ja0NvbnRyb2wuUGF0aFNlcnZpY2VcIiwgZnVuY3Rpb24gKCRwYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHJlcXVpcmU6ICdecGFuZWwnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdjb250ZW50LnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBhbmVsQ3RybCkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuaGFzSGVhZGVyID0gcGFuZWxDdHJsLmhhc0hlYWRlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gMTAvNi8yMDE0LlxyXG4gKi9cclxudmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcclxudmFyIGN1cnJlbnRTY3JpcHRQYXRoID0gc2NyaXB0c1tzY3JpcHRzLmxlbmd0aCAtIDFdLnNyYztcclxudmFyIGRvY2tDb250cm9sUm9vdFBhdGggPSBjdXJyZW50U2NyaXB0UGF0aC5zcGxpdChcImpzL1wiKVswXTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuc2VydmljZShcIkRvY2tDb250cm9sLlBhdGhTZXJ2aWNlXCIsIFsgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybntcclxuICAgICAgICAgICAgdGVtcGxhdGVzQmFzZVVybDogZG9ja0NvbnRyb2xSb290UGF0aCArIFwidGVtcGxhdGVzL1wiXHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=