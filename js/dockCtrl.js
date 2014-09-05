/**
 * Created by gmeszaros on 8/5/2014.
 */
angular.module('DockControl')
    .controller('DockCtrl', ['$scope', '$orientation', '$alignment', function ($scope, $orientation, $align) {
        this.addPanel = function (panel) {
            $scope.panels.push(panel);
        };
        this.panelDockedChanged = function (panel) {
            switch (panel.align) {
                case $align.horizontal:
                    for (var i = 0; i < $scope.panels.length; i++) {
                        var nearPanel = $scope.panels[i];
                        if (!nearPanel.docked && nearPanel.align === $align.vertical) {
                            if (panel.orientation === $orientation.left) {
                                nearPanel.start = panel.docked ? panel.size : 0;
                            }
                            else{
                                nearPanel.end = panel.docked ? panel.size : 0;
                            }
                        }
                    }
                    break;
                case $align.vertical:
                    for (var j = 0; j < $scope.panels.length; j++) {
                        var nearPanel1 = $scope.panels[j];
                        if (!nearPanel1.docked && nearPanel1.align === $align.vertical) {
                            if (panel.orientation === $orientation.top) {
                                nearPanel1.start = panel.docked ? panel.size : 0;
                            }
                            else{
                                nearPanel1.end = panel.docked ? panel.size : 0;
                            }
                        }
                    }
                    break;
            }
        };

        $scope.panels = [];
    }]);