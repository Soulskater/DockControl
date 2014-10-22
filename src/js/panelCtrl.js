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