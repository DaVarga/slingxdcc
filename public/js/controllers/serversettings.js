/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* ServerSettingsCtrl for editing a server in settings */
angular.module('myApp')
  .controller('ServerSettingsCtrl', ['$scope', '$http', 'socket', function ($scope, $http, socket){
    $scope.joinChanStr = "";
    $scope.init = function (key){
        $scope.server = $scope.servers[key];
    };

    $scope.$on('$destroy', function () {
        socket.off('send:irc_error');
    });

    $scope.editServer = function (){
        if ($scope.server.host.length === 0 || parseInt($scope.server.port) > 65535 || parseInt($scope.server.port) < 0 || $scope.server.nick.length === 0) {
        	return;
        }
        
        var server = {
            srvkey        : $scope.server.key,
            host          : $scope.server.host,
            port          : $scope.server.port,
            nick          : $scope.server.nick,
            channels      : $scope.server.channels.length > 0 ? $scope.server.channels.join(' ') : "",
            observchannels: $scope.server.observchannels.length > 0 ? $scope.server.observchannels.join(' ') : ""
        };
        $http.post('/api/server/', server).then(function (response){
            $scope.server.connected = false;
            angular.copy($scope.server,$scope.servers[server.key]);
            $scope.joinChanStr = "";
            $scope.getData();
        });
    };

    $scope.removeServer = function (){
        $http.delete('/api/server/' + $scope.server.key).then(function (response){
            delete $scope.servers[$scope.server.key];
        });
    };

    $scope.joinChannels = function (){
        if ($scope.joinChanStr.length > 0){
            $http.put('/api/channel/', {srvkey: $scope.server.key, channels: $scope.joinChanStr, type: "join"}).then(function (response){
                $scope.server.channels = $scope.server.channels.concat($scope.joinChanStr.split(" "));
                $scope.joinChanStr = "";
            });
        }
    };

    $scope.partChannel = function (channel){
        $http.put('/api/channel/', {srvkey: $scope.server.key, channels: channel, type: "part"}).then(function (response){
            $scope.server.channels.splice($scope.server.channels.indexOf(channel), 1);
            if ($scope.isObserved(channel)){
                $scope.server.observchannels.splice($scope.server.observchannels.indexOf(channel), 1);
            }
        });
    };

    $scope.toggleObserv = function (channel){
        if ($scope.isObserved(channel)){
            $http.put('/api/channel/', {srvkey: $scope.server.key, channels: channel, type: "unobserv"}).then(function (response){
                $scope.server.observchannels.splice($scope.server.observchannels.indexOf(channel), 1);
            });
        }else{
            $http.put('/api/channel/', {srvkey: $scope.server.key, channels: channel, type: "observ"}).then(function (response){
                $scope.server.observchannels.push(channel);
            });
        }
    };

    $scope.hasErrors = function (){
        return ($scope.server.error.length > 0);
    };

    $scope.isObserved = function (channel){
        return ($scope.server.observchannels.indexOf(channel) !== -1);
    };

}]);

//ServerSettingsCtrl.$inject = ['$scope', '$http', 'socket'];