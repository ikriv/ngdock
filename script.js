var dockapp = angular.module('testdock',['ngDock']);
dockapp.controller('sampleController', function ($scope) {
    $scope.isBarVisible = [ false, true, true, false, true, true, false ];
});