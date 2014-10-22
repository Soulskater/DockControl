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
                panel.setToDefault();
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
                    panel[refPanel.orientation] = refPanel.docked ? refPanel.size : 0;
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

        this.setHeader = function (header) {
            $scope.header = header;
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
            return{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRvY2tEaXJlY3RpdmUuanMiLCJhdHRyaWJ1dGVEaXJlY3RpdmVzLmpzIiwiZG9ja0N0cmwuanMiLCJwYW5lbEN0cmwuanMiLCJwYW5lbERpcmVjdGl2ZS5qcyIsInJlc291cmNlUGF0aFNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRvY2tDb250cm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJywgWydBdHRyaWJ1dGUuRGlyZWN0aXZlcyddKVxyXG4gICAgLmNvbnN0YW50KCckYWxpZ25tZW50Jywge1xyXG4gICAgICAgIGhvcml6b250YWw6IFwiaG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIHZlcnRpY2FsOiBcInZlcnRpY2FsXCIsXHJcbiAgICAgICAgbWlkZGxlOiBcIm1pZGRsZVwiXHJcbiAgICB9KVxyXG4gICAgLmNvbnN0YW50KCckb3JpZW50YXRpb24nLCB7XHJcbiAgICAgICAgbGVmdDogXCJsZWZ0XCIsXHJcbiAgICAgICAgcmlnaHQ6IFwicmlnaHRcIixcclxuICAgICAgICB0b3A6IFwidG9wXCIsXHJcbiAgICAgICAgYm90dG9tOiBcImJvdHRvbVwiLFxyXG4gICAgICAgIGNlbnRlcjogXCJjZW50ZXJcIlxyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ2RvY2snLCBbXCJwYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICRwYXRoLnRlbXBsYXRlc0Jhc2VVcmwgKyAnZG9jay50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRG9ja0N0cmwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm9mZnNldCA9IF9hYnNvbHV0ZU9mZnNldCgkKCcucGFuZWwtY29udGFpbmVyJykpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9hYnNvbHV0ZU9mZnNldChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9IDAsIGxlZnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQub2Zmc2V0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCArPSBlbGVtZW50Lm9mZnNldCgpLnRvcCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCArPSBlbGVtZW50Lm9mZnNldCgpLmxlZnQgfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChlbGVtZW50Lmxlbmd0aCA+IDApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA5LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdBdHRyaWJ1dGUuRGlyZWN0aXZlcycsIFtdKVxyXG4gICAgLmRpcmVjdGl2ZSgnd2lkdGgnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHt3aWR0aDogYXR0cnMud2lkdGh9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2hlaWdodCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe2hlaWdodDogYXR0cnMuaGVpZ2h0fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdtaW5XaWR0aCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe21pbldpZHRoOiBhdHRycy5taW5XaWR0aH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnbWluSGVpZ2h0JywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7bWluSGVpZ2h0OiBhdHRycy5taW5IZWlnaHR9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2VsZW1lbnRMZWF2ZScsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHZhciBkb21DbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IGVsZW1lbnRbMF0gfHwgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoZWxlbWVudCkubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGV2YWwoYXR0cnMuZWxlbWVudExlYXZlLCB7ICRldmVudDogZXZlbnQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKCdjbGljaycsIGRvbUNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5jbGljayhkb21DbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xpY2soZWxlbWVudENsaWNrSGFuZGxlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgICAgIC8vRGlzcG9zaW5nXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2NsaWNrJywgZG9tQ2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnVuYmluZCgnY2xpY2snLCBlbGVtZW50Q2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0RvY2tDdHJsJywgWyckc2NvcGUnLCAnJG9yaWVudGF0aW9uJywgJyRhbGlnbm1lbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkb3JpZW50YXRpb24sICRhbGlnbikge1xyXG4gICAgICAgIHRoaXMuYWRkUGFuZWwgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnBhbmVscy5wdXNoKHBhbmVsKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucGFuZWxEb2NrZWRDaGFuZ2VkID0gZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgIGlmIChwYW5lbC5kb2NrZWQpIHtcclxuICAgICAgICAgICAgICAgIHBhbmVsLnNldFRvRGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF9zZXRTaXplKHBhbmVsKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucGFuZWxDb2xsYXBzZUNoYW5nZWQgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgbGlucSgkc2NvcGUucGFuZWxzKS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAhPT0gcGFuZWwgJiYgaXRlbS5vcmllbnRhdGlvbiA9PT0gcGFuZWwub3JpZW50YXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbGxhcHNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9zZXRTaXplKHJlZlBhbmVsKSB7XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykud2hlcmUoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmFsaWduICE9PSByZWZQYW5lbC5hbGlnbjtcclxuICAgICAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghcGFuZWwuZG9ja2VkIHx8IChwYW5lbC5kb2NrZWQgJiYgcGFuZWwuaW5kZXggPCByZWZQYW5lbC5pbmRleCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbFtyZWZQYW5lbC5vcmllbnRhdGlvbl0gPSByZWZQYW5lbC5kb2NrZWQgPyByZWZQYW5lbC5zaXplIDogMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUuJG9yaWVudGF0aW9uID0gJG9yaWVudGF0aW9uO1xyXG4gICAgICAgICRzY29wZS5wYW5lbHMgPSBbXTtcclxuICAgICAgICAkc2NvcGUuZHJhZyA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICB2YXIgcGFuZWwgPSBsaW5xKCRzY29wZS5wYW5lbHMpLmZpcnN0T3JEZWZhdWx0KGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5kcmFnZ2luZztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmICghcGFuZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzd2l0Y2ggKHBhbmVsLmFsaWduKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICRhbGlnbi5ob3Jpem9udGFsOlxyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLnNpemUgPSBwYW5lbC5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLmxlZnQgPyBldmVudC5jbGllbnRYIC0gJHNjb3BlLm9mZnNldC5sZWZ0ICsgNSA6ICQoZXZlbnQuY3VycmVudFRhcmdldCkud2lkdGgoKSAtIGV2ZW50LmNsaWVudFggLSAkc2NvcGUub2Zmc2V0LmxlZnQgKyA1O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAkYWxpZ24udmVydGljYWw6XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwuc2l6ZSA9IHBhbmVsLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24udG9wID8gZXZlbnQuY2xpZW50WSAtICRzY29wZS5vZmZzZXQubGVmdCA6ICQoZXZlbnQuY3VycmVudFRhcmdldCkuaGVpZ2h0KCkgLSBldmVudC5jbGllbnRZIC0gJHNjb3BlLm9mZnNldC5sZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscylcclxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3NldFNpemUoaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuZW5kRHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgbGlucSgkc2NvcGUucGFuZWxzKS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJylcclxuICAgIC5jb250cm9sbGVyKCdQYW5lbEN0cmwnLCBbJyRzY29wZScsICckYWxpZ25tZW50JywgJyRvcmllbnRhdGlvbicsIGZ1bmN0aW9uICgkc2NvcGUsICRhbGlnbiwgJG9yaWVudGF0aW9uKSB7XHJcblxyXG4gICAgICAgIHRoaXMudG9nZ2xlRG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZURvY2soKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnRvZ2dsZUNvbGxhcHNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2UoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNldEhlYWRlciA9IGZ1bmN0aW9uIChoZWFkZXIpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmhlYWRlciA9IGhlYWRlcjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRBbGlnbihvcmllbnRhdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24ubGVmdCB8fCAkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5yaWdodCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRhbGlnbi5ob3Jpem9udGFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi50b3AgfHwgJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24uYm90dG9tKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJGFsaWduLnZlcnRpY2FsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAkYWxpZ24ubWlkZGxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHNjb3BlLnRvZ2dsZURvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5kb2NrZWQgPSAhJHNjb3BlLmRvY2tlZDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuJGFsaWduID0gJGFsaWduO1xyXG4gICAgICAgICRzY29wZS4kb3JpZW50YXRpb24gPSAkb3JpZW50YXRpb247XHJcbiAgICAgICAgJHNjb3BlLmRvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICRzY29wZS5jb2xsYXBzZWQgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUuZHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUuaGVhZGVyID0gXCJcIjtcclxuICAgICAgICAkc2NvcGUuYWxpZ24gPSBnZXRBbGlnbigkc2NvcGUub3JpZW50YXRpb24pO1xyXG4gICAgICAgIGlmICgkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5jZW50ZXIpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmFsaWduID0gJGFsaWduLm1pZGRsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRzY29wZS5zdGFydERyYWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5kcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnBhbmVsRXhwYW5kID0gZnVuY3Rpb24gKCRldmVudCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnBhbmVsTGVhdmUgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICghJHNjb3BlLmRvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuc2V0VG9EZWZhdWx0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUubGVmdCA9ICcnO1xyXG4gICAgICAgICAgICAkc2NvcGUucmlnaHQgPSAnJztcclxuICAgICAgICAgICAgJHNjb3BlLnRvcCA9ICcnO1xyXG4gICAgICAgICAgICAkc2NvcGUuYm90dG9tID0gJyc7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnNldFN0eWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm57XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJHNjb3BlLmFsaWduID09PSAkYWxpZ24uaG9yaXpvbnRhbCA/ICRzY29wZS5zaXplIDogJycsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRzY29wZS5hbGlnbiA9PT0gJGFsaWduLnZlcnRpY2FsID8gJHNjb3BlLnNpemUgOiAnJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6ICRzY29wZS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6ICRzY29wZS5yaWdodCxcclxuICAgICAgICAgICAgICAgIHRvcDogJHNjb3BlLnRvcCxcclxuICAgICAgICAgICAgICAgIGJvdHRvbTogJHNjb3BlLmJvdHRvbVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJylcclxuICAgIC5kaXJlY3RpdmUoJ3BhbmVsJywgW1wicGF0aFNlcnZpY2VcIiwgZnVuY3Rpb24gKCRwYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXHJcbiAgICAgICAgICAgIHJlcXVpcmU6ICdeZG9jaycsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBzaXplOiAnPScsXHJcbiAgICAgICAgICAgICAgICBtaW5TaXplOiAnPScsXHJcbiAgICAgICAgICAgICAgICBpbmRleDogJ0AnLFxyXG4gICAgICAgICAgICAgICAgZG9ja2VkOiAnPScsXHJcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbjogJ0AnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAkcGF0aC50ZW1wbGF0ZXNCYXNlVXJsICsgJ3BhbmVsLnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQYW5lbEN0cmwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycywgZG9ja0N0cmwpIHtcclxuICAgICAgICAgICAgICAgIC8vJHNjb3BlLnNpemUgPSBwYXJzZUZsb2F0KCRzY29wZS5zaXplKTtcclxuICAgICAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgICAgICAvL0FkZCBwYW5lbCB0byB0aGUgZG9ja1xyXG4gICAgICAgICAgICAgICAgZG9ja0N0cmwuYWRkUGFuZWwoJHNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdkb2NrZWQnLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2NrQ3RybC5wYW5lbERvY2tlZENoYW5nZWQoJHNjb3BlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVDb2xsYXBzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gISRzY29wZS5jb2xsYXBzZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9ja0N0cmwucGFuZWxDb2xsYXBzZUNoYW5nZWQoJHNjb3BlKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdoZWFkZXInLCBbXCJwYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgcmVxdWlyZTogJ15wYW5lbCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAkcGF0aC50ZW1wbGF0ZXNCYXNlVXJsICsgJ2hlYWRlci50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycywgcGFuZWxDdHJsKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlRG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbEN0cmwudG9nZ2xlRG9jaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kb2NrZWQgPSAhJHNjb3BlLmRvY2tlZDtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxDdHJsLnRvZ2dsZUNvbGxhcHNlKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcGFuZWxDdHJsLnNldEhlYWRlcihlbGVtZW50LnRleHQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdjb250ZW50JywgW1wicGF0aFNlcnZpY2VcIiwgZnVuY3Rpb24gKCRwYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHJlcXVpcmU6ICdecGFuZWwnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdjb250ZW50LnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDEwLzYvMjAxNC5cclxuICovXHJcbnZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XHJcbnZhciBjdXJyZW50U2NyaXB0UGF0aCA9IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmM7XHJcbnZhciByb290UGF0aCA9IGN1cnJlbnRTY3JpcHRQYXRoLnNwbGl0KFwianMvXCIpWzBdO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJylcclxuICAgIC5zZXJ2aWNlKFwicGF0aFNlcnZpY2VcIiwgWyBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJue1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZXNCYXNlVXJsOiByb290UGF0aCArIFwidGVtcGxhdGVzL1wiXHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=