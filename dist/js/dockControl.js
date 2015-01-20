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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRvY2tEaXJlY3RpdmUuanMiLCJhdHRyaWJ1dGVEaXJlY3RpdmVzLmpzIiwiZG9ja0N0cmwuanMiLCJwYW5lbEN0cmwuanMiLCJwYW5lbERpcmVjdGl2ZS5qcyIsInJlc291cmNlUGF0aFNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRvY2tDb250cm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJywgWydBdHRyaWJ1dGUuRGlyZWN0aXZlcyddKVxyXG4gICAgLmNvbnN0YW50KCckYWxpZ25tZW50Jywge1xyXG4gICAgICAgIGhvcml6b250YWw6IFwiaG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIHZlcnRpY2FsOiBcInZlcnRpY2FsXCIsXHJcbiAgICAgICAgbWlkZGxlOiBcIm1pZGRsZVwiXHJcbiAgICB9KVxyXG4gICAgLmNvbnN0YW50KCckb3JpZW50YXRpb24nLCB7XHJcbiAgICAgICAgbGVmdDogXCJsZWZ0XCIsXHJcbiAgICAgICAgcmlnaHQ6IFwicmlnaHRcIixcclxuICAgICAgICB0b3A6IFwidG9wXCIsXHJcbiAgICAgICAgYm90dG9tOiBcImJvdHRvbVwiLFxyXG4gICAgICAgIGNlbnRlcjogXCJjZW50ZXJcIlxyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ2RvY2snLCBbXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBmdW5jdGlvbiAoJHBhdGgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICRwYXRoLnRlbXBsYXRlc0Jhc2VVcmwgKyAnZG9jay50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRG9ja0N0cmwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm9mZnNldCA9IF9hYnNvbHV0ZU9mZnNldCgkKCcucGFuZWwtY29udGFpbmVyJykpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9hYnNvbHV0ZU9mZnNldChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9IDAsIGxlZnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQub2Zmc2V0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCArPSBlbGVtZW50Lm9mZnNldCgpLnRvcCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCArPSBlbGVtZW50Lm9mZnNldCgpLmxlZnQgfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChlbGVtZW50Lmxlbmd0aCA+IDApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA5LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdBdHRyaWJ1dGUuRGlyZWN0aXZlcycsIFtdKVxyXG4gICAgLmRpcmVjdGl2ZSgnd2lkdGgnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHt3aWR0aDogYXR0cnMud2lkdGh9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2hlaWdodCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe2hlaWdodDogYXR0cnMuaGVpZ2h0fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdtaW5XaWR0aCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe21pbldpZHRoOiBhdHRycy5taW5XaWR0aH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnbWluSGVpZ2h0JywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7bWluSGVpZ2h0OiBhdHRycy5taW5IZWlnaHR9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2VsZW1lbnRMZWF2ZScsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHZhciBkb21DbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IGVsZW1lbnRbMF0gfHwgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoZWxlbWVudCkubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGV2YWwoYXR0cnMuZWxlbWVudExlYXZlLCB7ICRldmVudDogZXZlbnQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKCdjbGljaycsIGRvbUNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5jbGljayhkb21DbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xpY2soZWxlbWVudENsaWNrSGFuZGxlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgICAgIC8vRGlzcG9zaW5nXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2NsaWNrJywgZG9tQ2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnVuYmluZCgnY2xpY2snLCBlbGVtZW50Q2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0RvY2tDdHJsJywgWyckc2NvcGUnLCAnJG9yaWVudGF0aW9uJywgJyRhbGlnbm1lbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkb3JpZW50YXRpb24sICRhbGlnbikge1xyXG4gICAgICAgIHRoaXMuYWRkUGFuZWwgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnBhbmVscy5wdXNoKHBhbmVsKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucGFuZWxEb2NrZWRDaGFuZ2VkID0gZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgIGlmIChwYW5lbC5kb2NrZWQpIHtcclxuICAgICAgICAgICAgICAgIHBhbmVsLnNldFRvRGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF9zZXRTaXplKHBhbmVsKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucGFuZWxDb2xsYXBzZUNoYW5nZWQgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgLypsaW5xKCRzY29wZS5wYW5lbHMpLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtICE9PSBwYW5lbCAmJiBpdGVtLm9yaWVudGF0aW9uID09PSBwYW5lbC5vcmllbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY29sbGFwc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7Ki9cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBfc2V0U2l6ZShyZWZQYW5lbCkge1xyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpLndoZXJlKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5hbGlnbiAhPT0gcmVmUGFuZWwuYWxpZ247XHJcbiAgICAgICAgICAgIH0pLmZvckVhY2goZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhbmVsLmRvY2tlZCB8fCAocGFuZWwuZG9ja2VkICYmIHBhbmVsLmluZGV4IDwgcmVmUGFuZWwuaW5kZXgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxbcmVmUGFuZWwub3JpZW50YXRpb25dID0gcmVmUGFuZWwuZG9ja2VkID8gcmVmUGFuZWwuc2l6ZSA6IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHNjb3BlLiRvcmllbnRhdGlvbiA9ICRvcmllbnRhdGlvbjtcclxuICAgICAgICAkc2NvcGUucGFuZWxzID0gW107XHJcbiAgICAgICAgJHNjb3BlLmRyYWcgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHBhbmVsID0gbGlucSgkc2NvcGUucGFuZWxzKS5maXJzdE9yRGVmYXVsdChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uZHJhZ2dpbmc7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoIXBhbmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3dpdGNoIChwYW5lbC5hbGlnbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAkYWxpZ24uaG9yaXpvbnRhbDpcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zaXplID0gcGFuZWwub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5sZWZ0ID8gZXZlbnQuY2xpZW50WCAtICRzY29wZS5vZmZzZXQubGVmdCArIDUgOiAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLndpZHRoKCkgLSBldmVudC5jbGllbnRYIC0gJHNjb3BlLm9mZnNldC5sZWZ0ICsgNTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJGFsaWduLnZlcnRpY2FsOlxyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLnNpemUgPSBwYW5lbC5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLnRvcCA/IGV2ZW50LmNsaWVudFkgLSAkc2NvcGUub2Zmc2V0LmxlZnQgOiAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmhlaWdodCgpIC0gZXZlbnQuY2xpZW50WSAtICRzY29wZS5vZmZzZXQubGVmdDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpXHJcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRTaXplKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmVuZERyYWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGxpbnEoJHNjb3BlLnBhbmVscykuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA4LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdEb2NrQ29udHJvbCcpXHJcbiAgICAuY29udHJvbGxlcignUGFuZWxDdHJsJywgWyckc2NvcGUnLCAnJGFsaWdubWVudCcsICckb3JpZW50YXRpb24nLCBmdW5jdGlvbiAoJHNjb3BlLCAkYWxpZ24sICRvcmllbnRhdGlvbikge1xyXG5cclxuICAgICAgICB0aGlzLnRvZ2dsZURvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVEb2NrKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZUNvbGxhcHNlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRIZWFkZXIgPSBmdW5jdGlvbiAoaGVhZGVyKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5oZWFkZXIgPSBoZWFkZXI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5oYXNIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuaGVhZGVyICE9PSBcIlwiO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEFsaWduKG9yaWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICgkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5sZWZ0IHx8ICRzY29wZS5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLnJpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJGFsaWduLmhvcml6b250YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCRzY29wZS5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLnRvcCB8fCAkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5ib3R0b20pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkYWxpZ24udmVydGljYWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICRhbGlnbi5taWRkbGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUudG9nZ2xlRG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmRvY2tlZCA9ICEkc2NvcGUuZG9ja2VkO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS4kYWxpZ24gPSAkYWxpZ247XHJcbiAgICAgICAgJHNjb3BlLiRvcmllbnRhdGlvbiA9ICRvcmllbnRhdGlvbjtcclxuICAgICAgICAkc2NvcGUuZG9ja2VkID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9IGZhbHNlO1xyXG4gICAgICAgICRzY29wZS5kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgICRzY29wZS5oZWFkZXIgPSBcIlwiO1xyXG4gICAgICAgICRzY29wZS5hbGlnbiA9IGdldEFsaWduKCRzY29wZS5vcmllbnRhdGlvbik7XHJcbiAgICAgICAgaWYgKCRzY29wZS5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLmNlbnRlcikge1xyXG4gICAgICAgICAgICAkc2NvcGUuYWxpZ24gPSAkYWxpZ24ubWlkZGxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHNjb3BlLnN0YXJ0RHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmRyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUucGFuZWxFeHBhbmQgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgICRzY29wZS5jb2xsYXBzZWQgPSBmYWxzZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUucGFuZWxMZWF2ZSA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKCEkc2NvcGUuZG9ja2VkKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5zZXRUb0RlZmF1bHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5sZWZ0ID0gJyc7XHJcbiAgICAgICAgICAgICRzY29wZS5yaWdodCA9ICcnO1xyXG4gICAgICAgICAgICAkc2NvcGUudG9wID0gJyc7XHJcbiAgICAgICAgICAgICRzY29wZS5ib3R0b20gPSAnJztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuc2V0U3R5bGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJHNjb3BlLmFsaWduID09PSAkYWxpZ24uaG9yaXpvbnRhbCA/ICRzY29wZS5zaXplIDogJycsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRzY29wZS5hbGlnbiA9PT0gJGFsaWduLnZlcnRpY2FsID8gJHNjb3BlLnNpemUgOiAnJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6ICRzY29wZS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6ICRzY29wZS5yaWdodCxcclxuICAgICAgICAgICAgICAgIHRvcDogJHNjb3BlLnRvcCxcclxuICAgICAgICAgICAgICAgIGJvdHRvbTogJHNjb3BlLmJvdHRvbVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJylcclxuICAgIC5kaXJlY3RpdmUoJ3BhbmVsJywgW1wiRG9ja0NvbnRyb2wuUGF0aFNlcnZpY2VcIiwgZnVuY3Rpb24gKCRwYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXHJcbiAgICAgICAgICAgIHJlcXVpcmU6ICdeZG9jaycsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBzaXplOiAnPScsXHJcbiAgICAgICAgICAgICAgICBtaW5TaXplOiAnPScsXHJcbiAgICAgICAgICAgICAgICBpbmRleDogJ0AnLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb246ICdAJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdwYW5lbC50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnUGFuZWxDdHJsJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMsIGRvY2tDdHJsKSB7XHJcbiAgICAgICAgICAgICAgICAvLyRzY29wZS5zaXplID0gcGFyc2VGbG9hdCgkc2NvcGUuc2l6ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgICAgIC8vQWRkIHBhbmVsIHRvIHRoZSBkb2NrXHJcbiAgICAgICAgICAgICAgICBkb2NrQ3RybC5hZGRQYW5lbCgkc2NvcGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2RvY2tlZCcsIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2NrQ3RybC5wYW5lbERvY2tlZENoYW5nZWQoJHNjb3BlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gYXR0cnMuZG9ja2VkID09PSBcInRydWVcIiA/IHRydWUgOiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9ICEkc2NvcGUuY29sbGFwc2VkO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY2tDdHJsLnBhbmVsQ29sbGFwc2VDaGFuZ2VkKCRzY29wZSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnaGVhZGVyJywgW1wiRG9ja0NvbnRyb2wuUGF0aFNlcnZpY2VcIiwgZnVuY3Rpb24gKCRwYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHJlcXVpcmU6ICdecGFuZWwnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJHBhdGgudGVtcGxhdGVzQmFzZVVybCArICdoZWFkZXIudG1wbC5odG1sJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMsIHBhbmVsQ3RybCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmRvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZURvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxDdHJsLnRvZ2dsZURvY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gISRzY29wZS5kb2NrZWQ7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZUNvbGxhcHNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsQ3RybC50b2dnbGVDb2xsYXBzZSgpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHBhbmVsQ3RybC5zZXRIZWFkZXIoZWxlbWVudC50ZXh0KCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnY29udGVudCcsIFtcIkRvY2tDb250cm9sLlBhdGhTZXJ2aWNlXCIsIGZ1bmN0aW9uICgkcGF0aCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICByZXF1aXJlOiAnXnBhbmVsJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICRwYXRoLnRlbXBsYXRlc0Jhc2VVcmwgKyAnY29udGVudC50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBwYW5lbEN0cmwpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLmhhc0hlYWRlciA9IHBhbmVsQ3RybC5oYXNIZWFkZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDEwLzYvMjAxNC5cclxuICovXHJcbnZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XHJcbnZhciBjdXJyZW50U2NyaXB0UGF0aCA9IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmM7XHJcbnZhciBkb2NrQ29udHJvbFJvb3RQYXRoID0gY3VycmVudFNjcmlwdFBhdGguc3BsaXQoXCJqcy9cIilbMF07XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLnNlcnZpY2UoXCJEb2NrQ29udHJvbC5QYXRoU2VydmljZVwiLCBbIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm57XHJcbiAgICAgICAgICAgIHRlbXBsYXRlc0Jhc2VVcmw6IGRvY2tDb250cm9sUm9vdFBhdGggKyBcInRlbXBsYXRlcy9cIlxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9