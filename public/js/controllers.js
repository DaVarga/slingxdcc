/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Controllers */

function AppCtrl($scope, $http){

    $http({method: 'GET', url: '/api/packet/'}).success(function (data, status, headers, config){
        $scope.totalpackets = data.number;
    }).error(function (data, status, headers, config){
            $scope.totalpackets = 'Error!'
        });
}

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

    //TODO
    $scope.isKeyUniqe = function (){
        if(typeof $scope.nServConf.key !== "undefined" && $scope.nServConf.key.length > 0)
            return (typeof $scope.servers[$scope.nServConf.key] === "undefined");
        return true;
    }
}

ServerAddCtrl.$inject = ['$scope', '$http'];

function ServerSettingsCtrl($scope, $http){
    $scope.joinChanStr = "";
    $scope.init = function (server){
        $scope.server = server;
    }

    $scope.editServer = function (){
        if ($scope.server.host.length == 0 || parseInt($scope.server.port) > 65535 || parseInt($scope.server.port) < 0 || $scope.server.nick.length == 0) return;
        var server = {
            srvkey        : $scope.server.key,
            host          : $scope.server.host,
            port          : $scope.server.port,
            nick          : $scope.server.nick,
            channels      : $scope.server.channels.length > 0 ? $scope.server.channels.join(' ') : "",
            observchannels: $scope.server.observchannels.length > 0 ? $scope.server.observchannels.join(' ') : ""
        }
        $http.post('/api/server/', server).success(function (data){
            $scope.server.connected = false;
            angular.copy($scope.server,$scope.servers[server.key]);
            $scope.joinChanStr = "";
            $scope.getServers();
        })
    };

    $scope.removeServer = function (){
        $http.delete('/api/server/' + $scope.server.key).success(function (data){
            delete $scope.servers[$scope.server.key];
        });
    };

    $scope.joinChannels = function (){
        if ($scope.joinChanStr.length > 0){
            $http.put('/api/channel/', {srvkey: $scope.server.key, channels: $scope.joinChanStr, type: "join"}).success(function (data){
                $scope.server.channels = $scope.server.channels.concat($scope.joinChanStr.split(" "));
                $scope.joinChanStr = "";
            });
        }
    }

    $scope.partChannel = function (channel){
        $http.put('/api/channel/', {srvkey: $scope.server.key, channels: channel, type: "part"}).success(function (data){
            $scope.server.channels.splice($scope.server.channels.indexOf(channel), 1);
        });
    }

    $scope.toggleObserv = function (channel){
        if ($scope.isObserved(channel)){
            $http.put('/api/channel/', {srvkey: $scope.server.key, channels: channel, type: "unobserv"}).success(function (data){
                $scope.server.observchannels.splice($scope.server.observchannels.indexOf(channel), 1);
            });
        }else{
            $http.put('/api/channel/', {srvkey: $scope.server.key, channels: channel, type: "observ"}).success(function (data){
                $scope.server.observchannels.push(channel);
            });
        }
    }

    $scope.hasErrors = function (){
        if ($scope.server.error.length > 0){
            return true;
        }else{
            return false;
        }
    }

    $scope.isObserved = function (channel){
        if ($scope.server.observchannels.indexOf(channel) != -1){
            return true;
        }else{
            return false;
        }
    }
}

ServerSettingsCtrl.$inject = ['$scope', '$http'];

function SettingsCtrl($scope, $http){
    $scope.getServers = function (){
        $http.get('/api/server/').success(function (data, status, headers, config){
            for (var i in data){
                data[i].key = i;
            }
            $scope.servers = data;
        })
    }

    $scope.getServers();

}

SettingsCtrl.$inject = ['$scope', '$http'];

function SearchBarCtrl($scope, $rootScope){
    $scope.history = [];

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


}

SearchBarCtrl.$inject = ['$scope', '$rootScope'];

function PacketListCtrl($scope, $rootScope, $http){
    var loadDone = false;
    $scope.searchString = "";

    $rootScope.$on("setSearch",function(){
        $scope.searchString = $rootScope.searchString;
        $scope.setPage(1);
    });

    $scope.setPage = function (pageNo){
        $scope.currentPage = pageNo;
        refreshPageScope();
    };

    $scope.setPage(1);

    $scope.getOpacity = function(){
        if(loadDone){
            return 1;
        }else{
            return 0.5;
        }
    }
    $scope.getCurrentPage = function(){
        return $scope.currentPage;
    }

    $scope.refreshSortScope = function(){
        $http({method: 'GET', url: '/api/packet/sorting/'}).success(function (data, status, headers, config){
            $scope.sorting = data;

            if(typeof $scope.sorted === "undefined"){
                $scope.sorted = function (col){
                    if ($scope.sorting.sortBy == col){
                        return $scope.sorting.sortOrder;
                    }else{
                        return 'none';
                    }
                };
            }
        });
    }


    $scope.setSorting = function (by){
        var value = {
            sortBy   : $scope.sorting.sortBy,
            sortOrder: $scope.sorting.sortOrder
        }
        value.sortBy = by;
        if (by == $scope.sorting.sortBy){
            if (value.sortOrder != 'desc'){
                value.sortOrder = 'desc';
            }else{
                value.sortOrder = 'asc';
            }
        }
        $http.put('/api/packet/sorting/', value).success(function (){
            $scope.sorting = value;
            $scope.setPage(1);
        });
    };

    function refreshPageScope(){
        loadDone = false;
        var url;
        if ($scope.searchString.length > 0){
            url = '/api/packet/search/' + $scope.searchString + '/' + $scope.currentPage + '/';
        }else{
            url = '/api/packet/list/' + $scope.currentPage + '/'
        }
        $http({method: 'GET', url: url}).success(function (data, status, headers, config){
            $scope.numPages = data.numPages;
            $scope.packets = data.packets;
            loadDone = true;
        });
    }
}

PacketListCtrl.$inject = ['$scope', '$rootScope', '$http'];
