/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Dashboard */

function DashboardCtrl($scope, $http, socket){

    $scope.packetCount = {off:0};

    $scope.getServers = function (){
        $http.get('/api/server/').success(function (data, status, headers, config){
            for (var i in data){
                data[i].key = i;
            }
            $scope.servers = data;
        })
    }

    $scope.getPacketCounts = function(){
        $http.get('/api/packet/',{headers:{type:'on'}}).success(function (data, status, headers, config){
            $scope.packetCount.on = data.number;
            $scope.$apply($scope.packetCount.off -= $scope.packetCount.on);

        });

        $http.get('/api/packet/', {headers:{type:'all'}}).success(function (data, status, headers, config){
            $scope.packetCount.all = data.number;
            $scope.$apply($scope.packetCount.off += $scope.packetCount.all);
        });

        $http.get('/api/packet/', {headers:{type:'red'}}).success(function (data, status, headers, config){
            $scope.packetCount.red = data.number;
        });


    }

    $scope.getServers();
    $scope.getPacketCounts();
}

DashboardCtrl.$inject = ['$scope', '$http', 'socket'];