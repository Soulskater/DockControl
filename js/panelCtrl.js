/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .controller('PanelCtrl', ['$scope', '$alignment', '$orientation', function ($scope, $align, $orientation) {

        this.toggleDock = function () {
            $scope.docked = !$scope.docked;
        };

        $scope.$align = $align;
        $scope.$orientation = $orientation;
        $scope.docked = false;
        $scope.dragging = false;
        $scope.align = $scope.orientation === $orientation.left || $scope.orientation === $orientation.right ? $align.horizontal : $align.vertical;
        $scope.start = 0;
        $scope.end = 0;

        $scope.startDrag = function () {
            $scope.dragging = true;
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