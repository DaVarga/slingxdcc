/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Database settings controller */


function DbSettingsCtrl($scope, $http, socket){
    socket.on('send:packetCount', function(data){
        angular.extend($scope.packetCount, data);
        $scope.redPercentage = $scope.packetCount.redPackets / ($scope.packetCount.absPackets + $scope.packetCount.redPackets) * 100;
    });

    $scope.$on('$destroy', function () {
        socket.off('send:packetCount');
    });


    $scope.compactDb = function(){
        $http.put('/api/db/compacting/');
        $scope.redPercentage = 0;
        $scope.packetCount.redPackets = 0;
    }

    $scope.toggleCompacting = function(){
        if($scope.compacting.autoCompacting){
            $http.delete('/api/db/compacting/').success(function (data, status, headers, config){
                angular.extend($scope.compacting, data);
                $('.dbsettings input').prop('disabled', false);
            });
        }else{
            var interval = isNaN(parseInt($scope.compacting.interval)) ? 60 : parseInt($scope.compacting.interval);
            if(interval < 10)
                interval = 10;
            if(interval > 60 * 24)
                interval = 60 * 24

            var percentage = isNaN(parseInt($scope.compacting.redPercentage)) ? 25 : parseInt($scope.compacting.redPercentage);
            if(percentage < 0)
                percentage = 0;
            if(percentage > 500)
                percentage = 500;

            $http.post('/api/db/compacting/',{minutes: interval, percentage: percentage}).success(function (data, status, headers, config){
                angular.extend($scope.compacting, data);
                $('.dbsettings input').prop('disabled', true);
            });
        }
    }

    $('#toggle').button()
}

DbSettingsCtrl.$inject = ['$scope', '$http', 'socket'];