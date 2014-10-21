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
    .directive('panel', [function () {
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
            templateUrl: 'templates/panel.tmpl.html',
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
                $scope.toggleCollapse= function () {
                    $scope.collapsed = !$scope.collapsed;
                    dockCtrl.panelCollapseChanged($scope);
                };
            }
        };
    }])
    .directive('header', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            require: '^panel',
            templateUrl: 'templates/header.tmpl.html',
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
    .directive('content', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            require: '^panel',
            templateUrl: 'templates/content.tmpl.html',
            link: function (scope, element, attrs) {
            }
        };
    }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRvY2tEaXJlY3RpdmUuanMiLCJhdHRyaWJ1dGVEaXJlY3RpdmVzLmpzIiwiZG9ja0N0cmwuanMiLCJwYW5lbEN0cmwuanMiLCJwYW5lbERpcmVjdGl2ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImRvY2tDb250cm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDgvNS8yMDE0LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ0RvY2tDb250cm9sJywgWydBdHRyaWJ1dGUuRGlyZWN0aXZlcyddKVxyXG4gICAgLmNvbnN0YW50KCckYWxpZ25tZW50Jywge1xyXG4gICAgICAgIGhvcml6b250YWw6IFwiaG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIHZlcnRpY2FsOiBcInZlcnRpY2FsXCJcclxuICAgIH0pXHJcbiAgICAuY29uc3RhbnQoJyRvcmllbnRhdGlvbicsIHtcclxuICAgICAgICBsZWZ0OiBcImxlZnRcIixcclxuICAgICAgICByaWdodDogXCJyaWdodFwiLFxyXG4gICAgICAgIHRvcDogXCJ0b3BcIixcclxuICAgICAgICBib3R0b206IFwiYm90dG9tXCJcclxuICAgIH0pXHJcbiAgICAuZGlyZWN0aXZlKCdkb2NrJywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZG9jay50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRG9ja0N0cmwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoJHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm9mZnNldCA9IF9hYnNvbHV0ZU9mZnNldCgkKCcucGFuZWwtY29udGFpbmVyJykpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9hYnNvbHV0ZU9mZnNldChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9IDAsIGxlZnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQub2Zmc2V0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCArPSBlbGVtZW50Lm9mZnNldCgpLnRvcCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCArPSBlbGVtZW50Lm9mZnNldCgpLmxlZnQgfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChlbGVtZW50Lmxlbmd0aCA+IDApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGdtZXN6YXJvcyBvbiA5LzUvMjAxNC5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdBdHRyaWJ1dGUuRGlyZWN0aXZlcycsIFtdKVxyXG4gICAgLmRpcmVjdGl2ZSgnd2lkdGgnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHt3aWR0aDogYXR0cnMud2lkdGh9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2hlaWdodCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe2hlaWdodDogYXR0cnMuaGVpZ2h0fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdtaW5XaWR0aCcsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe21pbldpZHRoOiBhdHRycy5taW5XaWR0aH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKVxyXG4gICAgLmRpcmVjdGl2ZSgnbWluSGVpZ2h0JywgW2Z1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7bWluSGVpZ2h0OiBhdHRycy5taW5IZWlnaHR9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2VsZW1lbnRMZWF2ZScsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHZhciBkb21DbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IGVsZW1lbnRbMF0gfHwgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoZWxlbWVudCkubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGV2YWwoYXR0cnMuZWxlbWVudExlYXZlLCB7ICRldmVudDogZXZlbnQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKCdjbGljaycsIGRvbUNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5jbGljayhkb21DbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xpY2soZWxlbWVudENsaWNrSGFuZGxlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgICAgIC8vRGlzcG9zaW5nXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2NsaWNrJywgZG9tQ2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnVuYmluZCgnY2xpY2snLCBlbGVtZW50Q2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0RvY2tDdHJsJywgWyckc2NvcGUnLCAnJG9yaWVudGF0aW9uJywgJyRhbGlnbm1lbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkb3JpZW50YXRpb24sICRhbGlnbikge1xyXG4gICAgICAgIHRoaXMuYWRkUGFuZWwgPSBmdW5jdGlvbiAocGFuZWwpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnBhbmVscy5wdXNoKHBhbmVsKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucGFuZWxEb2NrZWRDaGFuZ2VkID0gZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgIGlmIChwYW5lbC5kb2NrZWQpIHtcclxuICAgICAgICAgICAgICAgIHBhbmVsLnN0YXJ0ID0gMDtcclxuICAgICAgICAgICAgICAgIHBhbmVsLmVuZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3NldFNpemUocGFuZWwpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5wYW5lbENvbGxhcHNlQ2hhbmdlZCA9IGZ1bmN0aW9uIChwYW5lbCkge1xyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtICE9PSBwYW5lbCAmJiBpdGVtLm9yaWVudGF0aW9uID09PSBwYW5lbC5vcmllbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY29sbGFwc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBmdW5jdGlvbiBfc2V0U2l6ZShyZWZQYW5lbCkge1xyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpLndoZXJlKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5hbGlnbiAhPT0gcmVmUGFuZWwuYWxpZ247XHJcbiAgICAgICAgICAgIH0pLmZvckVhY2goZnVuY3Rpb24gKHBhbmVsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhbmVsLmRvY2tlZCB8fCAocGFuZWwuZG9ja2VkICYmIHBhbmVsLmluZGV4IDwgcmVmUGFuZWwuaW5kZXgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZlBhbmVsLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24ubGVmdCB8fCByZWZQYW5lbC5vcmllbnRhdGlvbiA9PT0gJG9yaWVudGF0aW9uLnRvcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYW5lbC5zdGFydCA9IHJlZlBhbmVsLmRvY2tlZCA/IHJlZlBhbmVsLnNpemUgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFuZWwuZW5kID0gcmVmUGFuZWwuZG9ja2VkID8gcmVmUGFuZWwuc2l6ZSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRzY29wZS4kb3JpZW50YXRpb24gPSAkb3JpZW50YXRpb247XHJcbiAgICAgICAgJHNjb3BlLnBhbmVscyA9IFtdO1xyXG4gICAgICAgICRzY29wZS5kcmFnID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBwYW5lbCA9IGxpbnEoJHNjb3BlLnBhbmVscykuZmlyc3RPckRlZmF1bHQoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmRyYWdnaW5nO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKCFwYW5lbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaCAocGFuZWwuYWxpZ24pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJGFsaWduLmhvcml6b250YWw6XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwuc2l6ZSA9IHBhbmVsLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24ubGVmdCA/IGV2ZW50LmNsaWVudFggLSAkc2NvcGUub2Zmc2V0LmxlZnQgKyA1IDogJChldmVudC5jdXJyZW50VGFyZ2V0KS53aWR0aCgpIC0gZXZlbnQuY2xpZW50WCAtICRzY29wZS5vZmZzZXQubGVmdCArIDU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICRhbGlnbi52ZXJ0aWNhbDpcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zaXplID0gcGFuZWwub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi50b3AgPyBldmVudC5jbGllbnRZIC0gJHNjb3BlLm9mZnNldC5sZWZ0IDogJChldmVudC5jdXJyZW50VGFyZ2V0KS5oZWlnaHQoKSAtIGV2ZW50LmNsaWVudFkgLSAkc2NvcGUub2Zmc2V0LmxlZnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGlucSgkc2NvcGUucGFuZWxzKVxyXG4gICAgICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBfc2V0U2l6ZShpdGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5lbmREcmFnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBsaW5xKCRzY29wZS5wYW5lbHMpLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uZHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ1BhbmVsQ3RybCcsIFsnJHNjb3BlJywgJyRhbGlnbm1lbnQnLCAnJG9yaWVudGF0aW9uJywgZnVuY3Rpb24gKCRzY29wZSwgJGFsaWduLCAkb3JpZW50YXRpb24pIHtcclxuXHJcbiAgICAgICAgdGhpcy50b2dnbGVEb2NrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUudG9nZ2xlRG9jaygpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudG9nZ2xlQ29sbGFwc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVDb2xsYXBzZSgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0SGVhZGVyPSBmdW5jdGlvbiAoaGVhZGVyKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5oZWFkZXIgPSBoZWFkZXI7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUudG9nZ2xlRG9jaz0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZG9ja2VkID0gISRzY29wZS5kb2NrZWQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLiRhbGlnbiA9ICRhbGlnbjtcclxuICAgICAgICAkc2NvcGUuJG9yaWVudGF0aW9uID0gJG9yaWVudGF0aW9uO1xyXG4gICAgICAgICRzY29wZS5kb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmhlYWRlciA9IFwiXCI7XHJcbiAgICAgICAgJHNjb3BlLmFsaWduID0gJHNjb3BlLm9yaWVudGF0aW9uID09PSAkb3JpZW50YXRpb24ubGVmdCB8fCAkc2NvcGUub3JpZW50YXRpb24gPT09ICRvcmllbnRhdGlvbi5yaWdodCA/ICRhbGlnbi5ob3Jpem9udGFsIDogJGFsaWduLnZlcnRpY2FsO1xyXG4gICAgICAgICRzY29wZS5zdGFydCA9IDA7XHJcbiAgICAgICAgJHNjb3BlLmVuZCA9IDA7XHJcblxyXG4gICAgICAgICRzY29wZS5zdGFydERyYWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5kcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnBhbmVsRXhwYW5kID0gZnVuY3Rpb24gKCRldmVudCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnBhbmVsTGVhdmUgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICghJHNjb3BlLmRvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxhcHNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuc2V0U3R5bGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybntcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi5ob3Jpem9udGFsID8gJHNjb3BlLnNpemUgOiAnJyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJHNjb3BlLmFsaWduID09PSAkYWxpZ24udmVydGljYWwgPyAkc2NvcGUuc2l6ZSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogJHNjb3BlLmFsaWduID09PSAkYWxpZ24udmVydGljYWwgPyAkc2NvcGUuc3RhcnQgOiAnJyxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi52ZXJ0aWNhbCA/ICRzY29wZS5lbmQgOiAnJyxcclxuICAgICAgICAgICAgICAgIHRvcDogJHNjb3BlLmFsaWduID09PSAkYWxpZ24uaG9yaXpvbnRhbCA/ICRzY29wZS5zdGFydCA6ICcnLFxyXG4gICAgICAgICAgICAgICAgYm90dG9tOiAkc2NvcGUuYWxpZ24gPT09ICRhbGlnbi5ob3Jpem9udGFsID8gJHNjb3BlLmVuZCA6ICcnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgIH1dKTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBnbWVzemFyb3Mgb24gOC81LzIwMTQuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnRG9ja0NvbnRyb2wnKVxyXG4gICAgLmRpcmVjdGl2ZSgncGFuZWwnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXF1aXJlOiAnXmRvY2snLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICAgICAgc2l6ZTogJz0nLFxyXG4gICAgICAgICAgICAgICAgbWluU2l6ZTogJz0nLFxyXG4gICAgICAgICAgICAgICAgaW5kZXg6ICdAJyxcclxuICAgICAgICAgICAgICAgIGRvY2tlZDogJz0nLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb246ICdAJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9wYW5lbC50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnUGFuZWxDdHJsJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCRzY29wZSwgZWxlbWVudCwgYXR0cnMsIGRvY2tDdHJsKSB7XHJcbiAgICAgICAgICAgICAgICAvLyRzY29wZS5zaXplID0gcGFyc2VGbG9hdCgkc2NvcGUuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAgICAgLy9BZGQgcGFuZWwgdG8gdGhlIGRvY2tcclxuICAgICAgICAgICAgICAgIGRvY2tDdHJsLmFkZFBhbmVsKCRzY29wZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnZG9ja2VkJywgZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9ja0N0cmwucGFuZWxEb2NrZWRDaGFuZ2VkKCRzY29wZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlQ29sbGFwc2U9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGFwc2VkID0gISRzY29wZS5jb2xsYXBzZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9ja0N0cmwucGFuZWxDb2xsYXBzZUNoYW5nZWQoJHNjb3BlKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pXHJcbiAgICAuZGlyZWN0aXZlKCdoZWFkZXInLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICByZXF1aXJlOiAnXnBhbmVsJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvaGVhZGVyLnRtcGwuaHRtbCcsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uICgkc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBwYW5lbEN0cmwpIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5kb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVEb2NrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsQ3RybC50b2dnbGVEb2NrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRvY2tlZCA9ICEkc2NvcGUuZG9ja2VkO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVDb2xsYXBzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbEN0cmwudG9nZ2xlQ29sbGFwc2UoKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBwYW5lbEN0cmwuc2V0SGVhZGVyKGVsZW1lbnQudGV4dCgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSlcclxuICAgIC5kaXJlY3RpdmUoJ2NvbnRlbnQnLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICByZXF1aXJlOiAnXnBhbmVsJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvY29udGVudC50bXBsLmh0bWwnLFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfV0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==