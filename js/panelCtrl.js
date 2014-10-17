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
        $scope.toggleCollapse= function () {
            //$scope.docked = false;
            $scope.collapsed = !$scope.collapsed;
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