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

    $scope.packetCount = {off:0,on:0,red:0};
    $scope.servers = {};
    $scope.onServers = 0;
    $scope.numServers = 0;
    $scope.nextDbCleanup = 0;

    $scope.redPacketPercentage = function(){
        return $scope.packetCount.red / ($scope.packetCount.all + $scope.packetCount.red) * 100;
    }

    $scope.onPacketPercentage = function(){
        return $scope.packetCount.on / ($scope.packetCount.all + $scope.packetCount.red) * 100;
    }

    $scope.offPacketPercentage = function(){
        return $scope.packetCount.off / ($scope.packetCount.all + $scope.packetCount.red) * 100;
    }

    $scope.onServerPercentage = function(){
        return $scope.onServers / $scope.numServers * 100;
    }

    $scope.offServerPercentage = function(){
        return 100 - $scope.onServerPercentage();
    }

    $scope.getData = function (){
        $scope.chartPacketData = [];
        $scope.chartServerData = [];

        $http.get('/api/server/').success(function (data, status, headers, config){
            for (var i in data){
                data[i].key = i;
                if(data[i].connected){
                    $scope.onServers++;
                }
                $scope.numServers++;
            }
            $scope.servers = data;

            $scope.chartServerData.push({
                value: $scope.onServers,
                color:"#5cb85c"
            });
            $scope.chartServerData.push({
                value: $scope.numServers - $scope.onServers,
                color:"#d9534f"
            });


        })

        $http.get('/api/packet/',{headers:{type:'on'}}).success(function (data, status, headers, config){
            $scope.packetCount.on = data.number;
            $scope.packetCount.off -= $scope.packetCount.on;
            $scope.chartPacketData.push({
                value: $scope.packetCount.on,
                color:"#5cb85c"
            });

        });

        $http.get('/api/packet/', {headers:{type:'all'}}).success(function (data, status, headers, config){
            $scope.packetCount.all = data.number;
            $scope.packetCount.off += $scope.packetCount.all;
            $scope.chartPacketData.push({
                value: $scope.packetCount.off,
                color:"#d9534f"
            });
        });

        $http.get('/api/packet/', {headers:{type:'red'}}).success(function (data, status, headers, config){
            $scope.packetCount.red = data.number;
            $scope.chartPacketData.push({
                value: $scope.packetCount.red,
                color:"#999"
            });
        });

        $http.get('/api/db/compacting/').success(function (data, status, headers, config){
            $scope.nextDbCleanup = data.nextCompacting;
        })

    }

    $scope.chartPacketData = [];
    $scope.chartServerData = [];

    $scope.chartPacketOptions =  {
        //Boolean - Whether we should show a stroke on each segment
        segmentShowStroke : true,

        //String - The colour of each segment stroke
        segmentStrokeColor : "#ffffff",

        //Number - The width of each segment stroke
        segmentStrokeWidth : 2,

        //Boolean - Whether we should animate the chart
        animation : true,

        //Number - Amount of animation steps
        animationSteps : 100,

        //String - Animation easing effect
        animationEasing : "easeOutBounce",

        //Boolean - Whether we animate the rotation of the Pie
        animateRotate : true,

        //Boolean - Whether we animate scaling the Pie from the centre
        animateScale : false,

        //Function - Will fire on animation completion.
        onAnimationComplete : null
    };
    $scope.chartPacketData = [];

    $scope.getData();
}

DashboardCtrl.$inject = ['$scope', '$http', 'socket'];