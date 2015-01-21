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
                linq($scope.panels).where(function (item) {
                    return item !== panel && item.orientation === panel.orientation;
                }).forEach(function (p) {
                    p.docked = false;
                    p.collapsed = true;
                });
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

        function getAlign(orientation) {
            if ($scope.orientation === $orientation.left || $scope.orientation === $orientation.right) {
                return $align.horizontal;
            }
            if ($scope.orientation === $orientation.top || $scope.orientation === $orientation.bottom) {
                return $align.vertical;
            }
            return $align.middle;
        }

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
                    $scope.$parent.docked = !$scope.$parent.docked;
                };
                $scope.$parent.header = element.text();
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
            link: function ($scope, element, attrs, panelCtrl) {
                $scope.hasHeader = $scope.$parent.header !== "";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRvY2tEaXJlY3RpdmUuanMiLCJhdHRyaWJ1dGVEaXJlY3RpdmVzLmpzIiwiZG9ja0N0cmwuanMiLCJwYW5lbEN0cmwuanMiLCJwYW5lbERpcmVjdGl2ZS5qcyIsInJlc291cmNlUGF0aFNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRvY2tDb250cm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJywgWydBdHRyaWJ1dGUuRGlyZWN0aXZlcyddKVxyXG4gICAgLmNvbnN0YW50KCckYWxpZ25tZW50Jywge1xyXG4gICAgICAgIGhvcml6b250YWw6IFwiaG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIHZlcnRpY2FsOiBcInZlcnRpY2FsXCIsXHJcbiAgICAgICAgbWlkZGxlOiBcIm1pZGRsZVwiXHJcbiAgICB9KVxyXG4gICAgLmNvbnN0YW50KCckb3JpZW50YXRpb24nLCB7XHJcbiAgICAgICAgbGVmdDogXCJsZWZ0XCIsXHJcbiAgICAgICAgcmlnaHQ6IFwicmlnaHRcIixcclxuICAgICAgICB0b3A6IFwidG9wXCIsXHJcbiAgICAgICAgYm90dG9tOiBcImJvdHRvbVwiLFxyXG4gICAgICAgIGNlbnRlcjogXCJjZW50ZXJcIlxyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ2RvY2snLCBbXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICRwYXRoLnRlbXBsYXRlc0Jhc2VVcmwgKyAnZG9jay50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRG9ja0N0cmwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm9mZnNldCA9IF9hYnNvbHV0ZU9mZnNldCgkKCcucGFuZWwtY29udGFpbmVyJykpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9hYnNvbHV0ZU9mZnNldChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9IDAsIGxlZnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQub2Zmc2V0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCArPSBlbGVtZW50Lm9mZnNldCgpLnRvcCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCArPSBlbGVtZW50Lm9mZnNldCgpLmxlZnQgfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChlbGVtZW50Lmxlbmd0aCA+IDApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA5LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdBdHRyaWJ1dGUuRGlyZWN0aXZlcycsIFtdKVxyXG4gICAgLmRpcmVjdGl2ZSgnd2lkdGgnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHt3aWR0aDogYXR0cnMud2lkdGh9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2hlaWdodCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe2hlaWdodDogYXR0cnMuaGVpZ2h0fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdtaW5XaWR0aCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe21pbldpZHRoOiBhdHRycy5taW5XaWR0aH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnbWluSGVpZ2h0JywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7bWluSGVpZ2h0OiBhdHRycy5taW5IZWlnaHR9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2VsZW1lbnRMZWF2ZScsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHZhciBkb21DbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IGVsZW1lbnRbMF0gfHwgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoZWxlbWVudCkubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGV2YWwoYXR0cnMuZWxlbWVudExlYXZlLCB7ICRldmVudDogZXZlbnQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKCdjbGljaycsIGRvbUNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5jbGljayhkb21DbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xpY2soZWxlbWVudENsaWNrSGFuZGxlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgICAgIC8vRGlzcG9zaW5nXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2NsaWNrJywgZG9tQ2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnVuYmluZCgnY2xpY2snLCBlbGVtZW50Q2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0RvY2tDdHJsJywgWyckc2NvcGUnLCAnJG9yaWVudGF0aW9uJywgJyRhbGlnbm1lbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkb3JpZW50YXRpb24sICRhbGlnbikge1xyXG4gICAgICAgIHRoaXMuYWRkUGFuZWwgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnBhbmVscy5wdXNoKHBhbmVsKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucGFuZWxEb2NrZWRDaGFuZ2VkID0gZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgIGlmIChwYW5lbC5kb2NrZWQpIHtcclxuICAgICAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykud2hlcmUoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbSAhPT0gcGFuZWwgJiYgaXRlbS5vcmllbnRhdGlvbiA9PT0gcGFuZWwub3JpZW50YXRpb247XHJcbiAgICAgICAgICAgICAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcC5kb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBwLmNvbGxhcHNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHBhbmVsLnNldFRvRGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF9zZXRTaXplKHBhbmVsKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucGFuZWxDb2xsYXBzZUNoYW5nZWQgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgLypsaW5xKCRzY29wZS5wYW5lbHMpLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgIGlmIChpdGVtICE9PSBwYW5lbCAmJiBpdGVtLm9yaWVudGF0aW9uID09PSBwYW5lbC5vcmllbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgaXRlbS5jb2xsYXBzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgfSk7Ki9cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBfc2V0U2l6ZShyZWZQYW5lbCkge1xyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpLndoZXJlKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5hbGlnbiAhPT0gcmVmUGFuZWwuYWxpZ247XHJcbiAgICAgICAgICAgIH0pLmZvckVhY2goZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhbmVsLmRvY2tlZCB8fCAocGFuZWwuZG9ja2VkICYmIHBhbmVsLmluZGV4IDwgcmVmUGFuZWwuaW5kZXgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxbcmVmUGFuZWwub3JpZW50YXRpb25dID0gcmVmUGFuZWwuZG9ja2VkID8gcmVmUGFuZWwuc2l6ZSA6IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAkc2NvcGUuc2l6ZUNoYW5nZWQgPSAhJHNjb3BlLnNpemVDaGFuZ2VkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHNjb3BlLiRvcmllbnRhdGlvbiA9ICRvcmllbnRhdGlvbjtcclxuICAgICAgICAkc2NvcGUucGFuZWxzID0gW107XHJcbiAgICAgICAgJHNjb3BlLmRyYWcgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHBhbmVsID0gbGlucSgkc2NvcGUucGFuZWxzKS5maXJzdE9yRGVmYXVsdChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uZHJhZ2dpbmc7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoIXBhbmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3dpdGNoIChwYW5lbC5hbGlnbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAkYWxpZ24uaG9yaXpvbnRhbDpcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zaXplID0gcGFuZWwub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5sZWZ0ID8gZXZlbnQuY2xpZW50WCAtICRzY29wZS5vZmZzZXQubGVmdCArIDUgOiAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLndpZHRoKCkgLSBldmVudC5jbGllbnRYIC0gJHNjb3BlLm9mZnNldC5sZWZ0ICsgNTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJGFsaWduLnZlcnRpY2FsOlxyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLnNpemUgPSBwYW5lbC5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLnRvcCA/IGV2ZW50LmNsaWVudFkgLSAkc2NvcGUub2Zmc2V0LmxlZnQgOiAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmhlaWdodCgpIC0gZXZlbnQuY2xpZW50WSAtICRzY29wZS5vZmZzZXQubGVmdDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpXHJcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRTaXplKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmVuZERyYWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA4LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuY29udHJvbGxlcignUGFuZWxDdHJsJywgWyckc2NvcGUnLCAnJGFsaWdubWVudCcsICckb3JpZW50YXRpb24nLCBmdW5jdGlvbiAoJHNjb3BlLCAkYWxpZ24sICRvcmllbnRhdGlvbikge1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRBbGlnbihvcmllbnRhdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24ubGVmdCB8fCAkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5yaWdodCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRhbGlnbi5ob3Jpem9udGFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi50b3AgfHwgJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24uYm90dG9tKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJGFsaWduLnZlcnRpY2FsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAkYWxpZ24ubWlkZGxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHNjb3BlLiRhbGlnbiA9ICRhbGlnbjtcclxuICAgICAgICAkc2NvcGUuJG9yaWVudGF0aW9uID0gJG9yaWVudGF0aW9uO1xyXG4gICAgICAgICRzY29wZS5kb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmhlYWRlciA9IFwiXCI7XHJcbiAgICAgICAgJHNjb3BlLmFsaWduID0gZ2V0QWxpZ24oJHNjb3BlLm9yaWVudGF0aW9uKTtcclxuICAgICAgICBpZiAoJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24uY2VudGVyKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5hbGlnbiA9ICRhbGlnbi5taWRkbGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUuc3RhcnREcmFnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZHJhZ2dpbmcgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5wYW5lbEV4cGFuZCA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5wYW5lbExlYXZlID0gZnVuY3Rpb24gKCRldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoISRzY29wZS5kb2NrZWQpIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5jb2xsYXBzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnNldFRvRGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmxlZnQgPSAnJztcclxuICAgICAgICAgICAgJHNjb3BlLnJpZ2h0ID0gJyc7XHJcbiAgICAgICAgICAgICRzY29wZS50b3AgPSAnJztcclxuICAgICAgICAgICAgJHNjb3BlLmJvdHRvbSA9ICcnO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5zZXRTdHlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi5ob3Jpem9udGFsID8gJHNjb3BlLnNpemUgOiAnJyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJHNjb3BlLmFsaWduID09PSAkYWxpZ24udmVydGljYWwgPyAkc2NvcGUuc2l6ZSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogJHNjb3BlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICByaWdodDogJHNjb3BlLnJpZ2h0LFxyXG4gICAgICAgICAgICAgICAgdG9wOiAkc2NvcGUudG9wLFxyXG4gICAgICAgICAgICAgICAgYm90dG9tOiAkc2NvcGUuYm90dG9tXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmRpcmVjdGl2ZSgncGFuZWwnLCBbXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVxdWlyZTogJ15kb2NrJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIHNpemU6ICc9JyxcclxuICAgICAgICAgICAgICAgIG1pblNpemU6ICc9JyxcclxuICAgICAgICAgICAgICAgIGluZGV4OiAnQCcsXHJcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbjogJ0AnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAkcGF0aC50ZW1wbGF0ZXNCYXNlVXJsICsgJ3BhbmVsLnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQYW5lbEN0cmwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycywgZG9ja0N0cmwpIHtcclxuICAgICAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgICAgICAvL0FkZCBwYW5lbCB0byB0aGUgZG9ja1xyXG4gICAgICAgICAgICAgICAgZG9ja0N0cmwuYWRkUGFuZWwoJHNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdkb2NrZWQnLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2NrQ3RybC5wYW5lbERvY2tlZENoYW5nZWQoJHNjb3BlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gYXR0cnMuZG9ja2VkID09PSBcInRydWVcIiA/IHRydWUgOiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9ICEkc2NvcGUuY29sbGFwc2VkO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY2tDdHJsLnBhbmVsQ29sbGFwc2VDaGFuZ2VkKCRzY29wZSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnaGVhZGVyJywgW1wiRG9ja0NvbnRyb2wuUGF0aFNlcnZpY2VcIiwgZnVuY3Rpb24gKCRwYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHJlcXVpcmU6ICdecGFuZWwnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdoZWFkZXIudG1wbC5odG1sJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBhbmVsQ3RybCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmRvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZURvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRwYXJlbnQuZG9ja2VkID0gISRzY29wZS4kcGFyZW50LmRvY2tlZDtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJHBhcmVudC5oZWFkZXIgPSBlbGVtZW50LnRleHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2NvbnRlbnQnLCBbXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgcmVxdWlyZTogJ15wYW5lbCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAkcGF0aC50ZW1wbGF0ZXNCYXNlVXJsICsgJ2NvbnRlbnQudG1wbC5odG1sJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBhbmVsQ3RybCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmhhc0hlYWRlciA9ICRzY29wZS4kcGFyZW50LmhlYWRlciAhPT0gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDEwLzYvMjAxNC5cclxuICovXHJcbnZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XHJcbnZhciBjdXJyZW50U2NyaXB0UGF0aCA9IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmM7XHJcbnZhciBkb2NrQ29udHJvbFJvb3RQYXRoID0gY3VycmVudFNjcmlwdFBhdGguc3BsaXQoXCJqcy9cIilbMF07XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLnNlcnZpY2UoXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBbIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm57XHJcbiAgICAgICAgICAgIHRlbXBsYXRlc0Jhc2VVcmw6IGRvY2tDb250cm9sUm9vdFBhdGggKyBcInRlbXBsYXRlcy9cIlxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9