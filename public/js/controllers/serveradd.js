/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Serveraddcontroller for creating a new server in settings */

function ServerAddCtrl($scope, $http){
    $scope.joinChanStr = "";
    $scope.nServConf = {
        key           : "",
        host          : "",
        port          : "",
        nick          : "",
        channels      : [],
        observchannels: []
    };

    $scope.addServer = function (){
        if ($scope.nServConf.key.length == 0 || $scope.nServConf.host.length == 0 || parseInt($scope.nServConf.port) > 65535 || parseInt($scope.nServConf.port) < 0 || $scope.nServConf.nick.length == 0) return;

        var server = {
            srvkey        : $scope.nServConf.key,
            host          : $scope.nServConf.host,
            port          : $scope.nServConf.port,
            nick          : $scope.nServConf.nick,
            channels      : $scope.nServConf.channels.length > 0 ? $scope.nServConf.channels.join(' ') : "",
            observchannels: $scope.nServConf.observchannels.length > 0 ? $scope.nServConf.observchannels.join(' ') : ""
        }

        $http.post('/api/server/', server).success(function (data){
            $scope.server.connected = false;
            angular.copy($scope.server,$scope.servers[server.key]);
            $scope.joinChanStr = "";
            $scope.getServers();
        }).success(function (data){
                $scope.servers[$scope.nServConf.key] = {}
                $scope.nServConf.connected = false;
                angular.copy($scope.nServConf, $scope.servers[$scope.nServConf.key]);
                $scope.joinChanStr = "";
                $scope.nServConf = {
                    key           : "",
                    host          : "",
                    port          : "",
                    nick          : "",
                    channels      : [],
                    observchannels: []
                };

                $scope.getServers();
            })
    };

    $scope.joinChannels = function (){
        if ($scope.joinChanStr.length > 0){
            $scope.nServConf.channels = $scope.nServConf.channels.concat($scope.joinChanStr.split(" "));
            $scope.joinChanStr = "";
        }
    }

    $scope.partChannel = function (channel){
        $scope.nServConf.channels.splice($scope.nServConf.channels.indexOf(channel), 1);
    }

    $scope.toggleObserv = function (channel){
        if ($scope.isObserved(channel)){
            $scope.nServConf.observchannels.splice($scope.nServConf.observchannels.indexOf(channel), 1);
        }else{
            $scope.nServConf.observchannels.push(channel);
        }
    }

    $scope.isObserved = function (channel){
        if ($scope.nServConf.observchannels.indexOf(channel) != -1){
            return true;
        }else{
            return false;
        }
    }

    $scope.isKeyUniqe = function (){
        if(typeof $scope.nServConf.key !== "undefined" && $scope.nServConf.key.length > 0)
            return (typeof $scope.servers[$scope.nServConf.key] === "undefined");
        return true;
    }
}

ServerAddCtrl.$inject = ['$scope', '$http'];