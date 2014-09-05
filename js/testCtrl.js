/**
 * Created by gmeszaros on 9/5/2014.
 */
angular.module('TestModule', ['DockControl'])
    .controller('TestCtrl', ['$scope', function ($scope) {
        $scope.greeting = function () {
            console.log('Hello!');
        };
    }]);