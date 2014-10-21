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