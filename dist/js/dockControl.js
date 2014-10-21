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
                panel.start = 0;
                panel.end = 0;
            }
            _setSize(panel);
        };
        this.panelCollapseChanged = function (panel) {
            linq($scope.panels).forEach(function (item) {
                if (item !== panel && item.orientation === panel.orientation) {
                    item.collapsed = true;
                }
            });
        };
        function _setSize(refPanel) {
            linq($scope.panels).where(function (item) {
                return item.align !== refPanel.align;
            }).forEach(function (panel) {
                if (!panel.docked || (panel.docked && panel.index < refPanel.index)) {
                    if (refPanel.orientation === $orientation.left || refPanel.orientation === $orientation.top) {
                        panel.start = refPanel.docked ? refPanel.size : 0;
                    }
                    else {
                        panel.end = refPanel.docked ? refPanel.size : 0;
                    }
                }
            });
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

        this.setHeader= function (header) {
            $scope.header = header;
        };
        $scope.toggleDock= function () {
            $scope.docked = !$scope.docked;
        };

        $scope.$align = $align;
        $scope.$orientation = $orientation;
        $scope.docked = false;
        $scope.collapsed = false;
        $scope.dragging = false;
        $scope.header = "";
        $scope.align = $scope.orientation === $orientation.left || $scope.orientation === $orientation.right ? $align.horizontal : $align.vertical;
        $scope.start = 0;
        $scope.end = 0;

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

        $scope.setStyle = function () {
            return{
                width: $scope.align === $align.horizontal ? $scope.size : '',
                height: $scope.align === $align.vertical ? $scope.size : '',
                left: $scope.align === $align.vertical ? $scope.start : '',
                right: $scope.align === $align.vertical ? $scope.end : '',
                top: $scope.align === $align.horizontal ? $scope.start : '',
                bottom: $scope.align === $align.horizontal ? $scope.end : ''
            };
        };
    }]);
/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .directive('panel', ["pathService", function ($path) {
        return {
            restrict: 'AE',
            require: '^dock',
            replace: true,
            transclude: true,
            scope: {
                size: '=',
                minSize: '=',
                index: '@',
                docked: '=',
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
                $scope.toggleCollapse = function () {
                    $scope.collapsed = !$scope.collapsed;
                    dockCtrl.panelCollapseChanged($scope);
                };
            }
        };
    }])
    .directive('header', ["pathService", function ($path) {
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
    .directive('content', ["pathService", function ($path) {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            require: '^panel',
            templateUrl: $path.templatesBaseUrl + 'content.tmpl.html',
            link: function (scope, element, attrs) {
            }
        };
    }]);
/**
 * Created by gmeszaros on 10/6/2014.
 */
var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length - 1].src;
var rootPath = currentScriptPath.split("js/")[0];

angular.module('DockControl')
    .service("pathService", [ function () {
        return{
            templatesBaseUrl: rootPath + "templates/"
        };
    }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRvY2tEaXJlY3RpdmUuanMiLCJhdHRyaWJ1dGVEaXJlY3RpdmVzLmpzIiwiZG9ja0N0cmwuanMiLCJwYW5lbEN0cmwuanMiLCJwYW5lbERpcmVjdGl2ZS5qcyIsInJlc291cmNlUGF0aFNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJkb2NrQ29udHJvbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA4LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcsIFsnQXR0cmlidXRlLkRpcmVjdGl2ZXMnXSlcclxuICAgIC5jb25zdGFudCgnJGFsaWdubWVudCcsIHtcclxuICAgICAgICBob3Jpem9udGFsOiBcImhvcml6b250YWxcIixcclxuICAgICAgICB2ZXJ0aWNhbDogXCJ2ZXJ0aWNhbFwiXHJcbiAgICB9KVxyXG4gICAgLmNvbnN0YW50KCckb3JpZW50YXRpb24nLCB7XHJcbiAgICAgICAgbGVmdDogXCJsZWZ0XCIsXHJcbiAgICAgICAgcmlnaHQ6IFwicmlnaHRcIixcclxuICAgICAgICB0b3A6IFwidG9wXCIsXHJcbiAgICAgICAgYm90dG9tOiBcImJvdHRvbVwiXHJcbiAgICB9KVxyXG4gICAgLmRpcmVjdGl2ZSgnZG9jaycsIFtcInBhdGhTZXJ2aWNlXCIsIGZ1bmN0aW9uICgkcGF0aCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdkb2NrLnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEb2NrQ3RybCcsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uICgkc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUub2Zmc2V0ID0gX2Fic29sdXRlT2Zmc2V0KCQoJy5wYW5lbC1jb250YWluZXInKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gX2Fic29sdXRlT2Zmc2V0KGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG9wID0gMCwgbGVmdCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5vZmZzZXQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wICs9IGVsZW1lbnQub2Zmc2V0KCkudG9wIHx8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ICs9IGVsZW1lbnQub2Zmc2V0KCkubGVmdCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGVsZW1lbnQubGVuZ3RoID4gMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDkvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0F0dHJpYnV0ZS5EaXJlY3RpdmVzJywgW10pXHJcbiAgICAuZGlyZWN0aXZlKCd3aWR0aCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe3dpZHRoOiBhdHRycy53aWR0aH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnaGVpZ2h0JywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7aGVpZ2h0OiBhdHRycy5oZWlnaHR9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ21pbldpZHRoJywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7bWluV2lkdGg6IGF0dHJzLm1pbldpZHRofSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdtaW5IZWlnaHQnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHttaW5IZWlnaHQ6IGF0dHJzLm1pbkhlaWdodH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnZWxlbWVudExlYXZlJywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvbUNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGV2ZW50LnRhcmdldCA9PT0gZWxlbWVudFswXSB8fCAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChlbGVtZW50KS5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZXZhbChhdHRycy5lbGVtZW50TGVhdmUsIHsgJGV2ZW50OiBldmVudCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2NsaWNrJywgZG9tQ2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudENsaWNrSGFuZGxlciA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLmNsaWNrKGRvbUNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8kZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jbGljayhlbGVtZW50Q2xpY2tIYW5kbGVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAgICAgLy9EaXNwb3NpbmdcclxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnVuYmluZCgnY2xpY2snLCBkb21DbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudW5iaW5kKCdjbGljaycsIGVsZW1lbnRDbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA4LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuY29udHJvbGxlcignRG9ja0N0cmwnLCBbJyRzY29wZScsICckb3JpZW50YXRpb24nLCAnJGFsaWdubWVudCcsIGZ1bmN0aW9uICgkc2NvcGUsICRvcmllbnRhdGlvbiwgJGFsaWduKSB7XHJcbiAgICAgICAgdGhpcy5hZGRQYW5lbCA9IGZ1bmN0aW9uIChwYW5lbCkge1xyXG4gICAgICAgICAgICAkc2NvcGUucGFuZWxzLnB1c2gocGFuZWwpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5wYW5lbERvY2tlZENoYW5nZWQgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgaWYgKHBhbmVsLmRvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgcGFuZWwuc3RhcnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgcGFuZWwuZW5kID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBfc2V0U2l6ZShwYW5lbCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnBhbmVsQ29sbGFwc2VDaGFuZ2VkID0gZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gIT09IHBhbmVsICYmIGl0ZW0ub3JpZW50YXRpb24gPT09IHBhbmVsLm9yaWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jb2xsYXBzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGZ1bmN0aW9uIF9zZXRTaXplKHJlZlBhbmVsKSB7XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykud2hlcmUoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmFsaWduICE9PSByZWZQYW5lbC5hbGlnbjtcclxuICAgICAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghcGFuZWwuZG9ja2VkIHx8IChwYW5lbC5kb2NrZWQgJiYgcGFuZWwuaW5kZXggPCByZWZQYW5lbC5pbmRleCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVmUGFuZWwub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5sZWZ0IHx8IHJlZlBhbmVsLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24udG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsLnN0YXJ0ID0gcmVmUGFuZWwuZG9ja2VkID8gcmVmUGFuZWwuc2l6ZSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYW5lbC5lbmQgPSByZWZQYW5lbC5kb2NrZWQgPyByZWZQYW5lbC5zaXplIDogMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHNjb3BlLiRvcmllbnRhdGlvbiA9ICRvcmllbnRhdGlvbjtcclxuICAgICAgICAkc2NvcGUucGFuZWxzID0gW107XHJcbiAgICAgICAgJHNjb3BlLmRyYWcgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHBhbmVsID0gbGlucSgkc2NvcGUucGFuZWxzKS5maXJzdE9yRGVmYXVsdChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uZHJhZ2dpbmc7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoIXBhbmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3dpdGNoIChwYW5lbC5hbGlnbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAkYWxpZ24uaG9yaXpvbnRhbDpcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zaXplID0gcGFuZWwub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5sZWZ0ID8gZXZlbnQuY2xpZW50WCAtICRzY29wZS5vZmZzZXQubGVmdCArIDUgOiAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLndpZHRoKCkgLSBldmVudC5jbGllbnRYIC0gJHNjb3BlLm9mZnNldC5sZWZ0ICsgNTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJGFsaWduLnZlcnRpY2FsOlxyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLnNpemUgPSBwYW5lbC5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLnRvcCA/IGV2ZW50LmNsaWVudFkgLSAkc2NvcGUub2Zmc2V0LmxlZnQgOiAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmhlaWdodCgpIC0gZXZlbnQuY2xpZW50WSAtICRzY29wZS5vZmZzZXQubGVmdDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpXHJcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRTaXplKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmVuZERyYWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA4LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuY29udHJvbGxlcignUGFuZWxDdHJsJywgWyckc2NvcGUnLCAnJGFsaWdubWVudCcsICckb3JpZW50YXRpb24nLCBmdW5jdGlvbiAoJHNjb3BlLCAkYWxpZ24sICRvcmllbnRhdGlvbikge1xyXG5cclxuICAgICAgICB0aGlzLnRvZ2dsZURvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVEb2NrKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZUNvbGxhcHNlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRIZWFkZXI9IGZ1bmN0aW9uIChoZWFkZXIpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmhlYWRlciA9IGhlYWRlcjtcclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS50b2dnbGVEb2NrPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5kb2NrZWQgPSAhJHNjb3BlLmRvY2tlZDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuJGFsaWduID0gJGFsaWduO1xyXG4gICAgICAgICRzY29wZS4kb3JpZW50YXRpb24gPSAkb3JpZW50YXRpb247XHJcbiAgICAgICAgJHNjb3BlLmRvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICRzY29wZS5jb2xsYXBzZWQgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUuZHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUuaGVhZGVyID0gXCJcIjtcclxuICAgICAgICAkc2NvcGUuYWxpZ24gPSAkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5sZWZ0IHx8ICRzY29wZS5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLnJpZ2h0ID8gJGFsaWduLmhvcml6b250YWwgOiAkYWxpZ24udmVydGljYWw7XHJcbiAgICAgICAgJHNjb3BlLnN0YXJ0ID0gMDtcclxuICAgICAgICAkc2NvcGUuZW5kID0gMDtcclxuXHJcbiAgICAgICAgJHNjb3BlLnN0YXJ0RHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmRyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUucGFuZWxFeHBhbmQgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgICRzY29wZS5jb2xsYXBzZWQgPSBmYWxzZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUucGFuZWxMZWF2ZSA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKCEkc2NvcGUuZG9ja2VkKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5zZXRTdHlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJue1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6ICRzY29wZS5hbGlnbiA9PT0gJGFsaWduLmhvcml6b250YWwgPyAkc2NvcGUuc2l6ZSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi52ZXJ0aWNhbCA/ICRzY29wZS5zaXplIDogJycsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi52ZXJ0aWNhbCA/ICRzY29wZS5zdGFydCA6ICcnLFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6ICRzY29wZS5hbGlnbiA9PT0gJGFsaWduLnZlcnRpY2FsID8gJHNjb3BlLmVuZCA6ICcnLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi5ob3Jpem9udGFsID8gJHNjb3BlLnN0YXJ0IDogJycsXHJcbiAgICAgICAgICAgICAgICBib3R0b206ICRzY29wZS5hbGlnbiA9PT0gJGFsaWduLmhvcml6b250YWwgPyAkc2NvcGUuZW5kIDogJydcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA4LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuZGlyZWN0aXZlKCdwYW5lbCcsIFtcInBhdGhTZXJ2aWNlXCIsIGZ1bmN0aW9uICgkcGF0aCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXF1aXJlOiAnXmRvY2snLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICAgICAgc2l6ZTogJz0nLFxyXG4gICAgICAgICAgICAgICAgbWluU2l6ZTogJz0nLFxyXG4gICAgICAgICAgICAgICAgaW5kZXg6ICdAJyxcclxuICAgICAgICAgICAgICAgIGRvY2tlZDogJz0nLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb246ICdAJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdwYW5lbC50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnUGFuZWxDdHJsJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMsIGRvY2tDdHJsKSB7XHJcbiAgICAgICAgICAgICAgICAvLyRzY29wZS5zaXplID0gcGFyc2VGbG9hdCgkc2NvcGUuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAgICAgLy9BZGQgcGFuZWwgdG8gdGhlIGRvY2tcclxuICAgICAgICAgICAgICAgIGRvY2tDdHJsLmFkZFBhbmVsKCRzY29wZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnZG9ja2VkJywgZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9ja0N0cmwucGFuZWxEb2NrZWRDaGFuZ2VkKCRzY29wZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9ICEkc2NvcGUuY29sbGFwc2VkO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY2tDdHJsLnBhbmVsQ29sbGFwc2VDaGFuZ2VkKCRzY29wZSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnaGVhZGVyJywgW1wicGF0aFNlcnZpY2VcIiwgZnVuY3Rpb24gKCRwYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHJlcXVpcmU6ICdecGFuZWwnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdoZWFkZXIudG1wbC5odG1sJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBhbmVsQ3RybCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmRvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZURvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxDdHJsLnRvZ2dsZURvY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gISRzY29wZS5kb2NrZWQ7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZUNvbGxhcHNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsQ3RybC50b2dnbGVDb2xsYXBzZSgpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHBhbmVsQ3RybC5zZXRIZWFkZXIoZWxlbWVudC50ZXh0KCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnY29udGVudCcsIFtcInBhdGhTZXJ2aWNlXCIsIGZ1bmN0aW9uICgkcGF0aCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICByZXF1aXJlOiAnXnBhbmVsJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICRwYXRoLnRlbXBsYXRlc0Jhc2VVcmwgKyAnY29udGVudC50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiAxMC82LzIwMTQuXHJcbiAqL1xyXG52YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xyXG52YXIgY3VycmVudFNjcmlwdFBhdGggPSBzY3JpcHRzW3NjcmlwdHMubGVuZ3RoIC0gMV0uc3JjO1xyXG52YXIgcm9vdFBhdGggPSBjdXJyZW50U2NyaXB0UGF0aC5zcGxpdChcImpzL1wiKVswXTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuc2VydmljZShcInBhdGhTZXJ2aWNlXCIsIFsgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybntcclxuICAgICAgICAgICAgdGVtcGxhdGVzQmFzZVVybDogcm9vdFBhdGggKyBcInRlbXBsYXRlcy9cIlxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9