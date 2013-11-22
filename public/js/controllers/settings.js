/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Settingscontroller parent controller for settings */


function SettingsCtrl($scope, $http, socket){
    $scope.servers = {};
    $scope.packetCount = {};
    $scope.compacting = {};

    socket.on('send:irc_connected', function(data){
        $scope.servers[data.server.key].connected = true;
    });

    socket.on('send:irc_error', function(data){
        $scope.servers[data.server.key].error = data.server.error;
    });

    $scope.$on('$destroy', function () {
        socket.off('send:irc_connected');
        socket.off('send:irc_error');
    });

    $scope.getData = function (){
        $http.get('/api/server/').success(function (data, status, headers, config){
            for (var i in data){
                data[i].key = i;
            }
            $scope.servers = data;
        });
        $http.get('/api/db/compacting/').success(function (data, status, headers, config){
            angular.extend($scope.compacting, data);
            if(data.autoCompacting){
                $('.dbsettings input').prop('disabled', true);
            }
        });
        $http.get('/api/packet/').success(function (data, status, headers, config) {
            angular.extend($scope.packetCount, data);
            $scope.redPercentage = $scope.packetCount.redPackets / ($scope.packetCount.absPackets + $scope.packetCount.redPackets) * 100;
        });

    };

    $scope.getData();

    $('.collapse').collapse({
        toggle: false
    })

}

SettingsCtrl.$inject = ['$scope', '$http', 'socket'];