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
        })

    };

    $scope.getData();

}

SettingsCtrl.$inject = ['$scope', '$http', 'socket'];