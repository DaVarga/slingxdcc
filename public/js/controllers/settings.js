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

angular.module('myApp')
  .controller('SettingsCtrl', ['$scope', '$http', 'socket', function ($scope, $http, socket){
    $scope.servers = {};
    $scope.packetCount = {};
    $scope.compacting = {};

    $scope.filter = {};

    socket.on('send:irc_connected', function(data){
        if(typeof $scope.servers[data.server.key] == 'undefined'){
            getServerData();
        }else{
            $scope.servers[data.server.key].connected = true;
        }
    });

    socket.on('send:irc_error', function(data){
        if(typeof $scope.servers[data.server.key] == 'undefined'){
            getServerData();
        }else{
            $scope.servers[data.server.key].error = data.server.error;
        }
    });

    $scope.$on('$destroy', function () {
        socket.off('send:irc_connected');
        socket.off('send:irc_error');
    });

    $scope.getData = function (){
        getServerData();
        getDbData();
    };

    function getServerData(){
        $http.get('/api/server/').then(function (response){
            for (var i in response.data){
                response.data[i].key = i;
            }
            $scope.servers = response.data;
        });
    }

    function getDbData(){
        $http.get('/api/db/compacting/').then(function (response){
            angular.extend($scope.compacting, response.data);
            if(response.data.autoCompacting){
                $('.dbsettings .compactingsettings input').prop('disabled', true);
            }
        });
        $http.get('/api/db/compactingfilter/').then(function (response){
            $scope.filter.compactingfilter = response.data.filter;
            $scope.filter.tmpfilter = response.data.filter ? response.data.filter : 24;
            $scope.filter.autoDeleting = (response.data.filter ? true : false);
        });
        $http.get('/api/packet/').then(function (response) {
            angular.extend($scope.packetCount,response.data);
            $scope.redPercentage = $scope.packetCount.redPackets / ($scope.packetCount.absPackets + $scope.packetCount.redPackets) * 100;
        });
    }

    $scope.getData();

    $('.collapse').collapse({
        toggle: false
    })

}]);

//SettingsCtrl.$inject = ['$scope', '$http', 'socket'];