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
                orientation: '@'
            },
            templateUrl: 'templates/panel.tmpl.html',
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
                $scope.toggleDock = function () {
                    panelCtrl.toggleDock();
                };
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