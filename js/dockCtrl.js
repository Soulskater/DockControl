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
            linq($scope.panels).forEach(function (item) {
                _setSize(item);
            });
        };
        function _setSize(refPanel) {
            linq($scope.panels).forEach(function (panel) {
                if ((!panel.docked || (panel.docked && panel.index < refPanel.index)) && panel.align !== refPanel.align) {
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