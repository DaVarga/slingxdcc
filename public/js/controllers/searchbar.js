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

function SearchBarCtrl($scope, $rootScope, $http, $location, $timeout){
    $scope.history = [];
    $scope.packetCount = 0;
    var rescuedSearch = "";


    $http({method: 'GET', url: '/api/packet/'}).success(function (data, status, headers, config){
        $scope.packetCount = data;
    });

    $scope.setSearch = function (){
        if ($scope.history.indexOf($scope.searchString.toLowerCase()) != -1){
            $scope.history.splice($scope.history.indexOf($scope.searchString.toLowerCase()), 1);
        }

        $scope.history.push($scope.searchString.toLowerCase());
        $rootScope.searchString = angular.copy($scope.searchString);
        $scope.$emit("setSearch");
        $location.path("packets");
    };

    $scope.rescueSearch = function(){
        rescuedSearch = $scope.searchString;
        $scope.searchString = "";
    }

    $scope.restoreSearch = function(){
        $scope.searchString = rescuedSearch;
        $timeout(function(){
            $(".topsearch").select();
        },0);
    }

    $scope.selectHistory = function (item){
        $scope.searchString = item;
        $rootScope.searchString = angular.copy($scope.searchString);
        $rootScope.$emit("setSearch");
    };

}

SearchBarCtrl.$inject = ['$scope', '$rootScope', '$http', '$location', '$timeout'];