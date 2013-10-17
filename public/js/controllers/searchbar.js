/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Searchbarcontroller handels the searches */

function SearchBarCtrl($scope, $rootScope, socket, $http){
    $scope.history = [];
    $scope.packetCount = 0;


    $http({method: 'GET', url: '/api/packet/'}).success(function (data, status, headers, config){
        $scope.packetCount = data.number;
    });

    $scope.setSearch = function (){
        if ($scope.history.indexOf($scope.searchString.toLowerCase()) != -1){
            $scope.history.splice($scope.history.indexOf($scope.searchString.toLowerCase()), 1);
        }

        $scope.history.push($scope.searchString.toLowerCase());
        $rootScope.searchString = $scope.searchString;
        $scope.$emit("setSearch");
    }

    $scope.selectHistory = function (item){
        $scope.searchString = item
        $rootScope.searchString = $scope.searchString;
        $rootScope.$emit("setSearch");
    }

    socket.on('send:packetCount', function(data){
        $scope.packetCount = data.count;
    });




}

SearchBarCtrl.$inject = ['$scope', '$rootScope', 'socket', '$http'];