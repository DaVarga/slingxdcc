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

function SearchCtrl($rootScope, $scope){
    $scope.history = [];
    $scope.selected = undefined;
    if (typeof $rootScope.searchString == "undefined")$rootScope.searchString = '';

    $scope.setSearch = function (){
        var searchindex = $scope.history.indexOf($scope.searchString);

        if (searchindex != -1){
            $scope.history.splice(searchindex, 1);
        }

        $scope.history.push($scope.searchString);
        $rootScope.searchString = $scope.searchString;
        $rootScope.$broadcast('setSearch');
    }

    $scope.selectHistory = function (item){
        $scope.searchString = item
        $scope.setSearch();
    }

}

SearchCtrl.$inject = ['$rootScope', '$scope'];

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

function PacketListCtrl($scope, $http, $rootScope){

    $scope.currentPage = 1;
    $scope.loadDone = 0.5;
    if (typeof $rootScope.searchString == "undefined")$rootScope.searchString = '';
    refreshPageScope();

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
            $scope.currentPage = 1;
            refreshPageScope();
        });
    };

    $scope.setPage = function (pageNo){
        $scope.currentPage = pageNo;
        refreshPageScope();
    };

    $scope.$on('setSearch', function (){
        $scope.currentPage = 1;
        refreshPageScope();
    })

    function refreshPageScope(){
        $scope.loadDone = 0.5;
        var url;
        if ($scope.searchString.length > 0){
            url = '/api/packet/search/' + $scope.searchString + '/' + $scope.currentPage + '/';
        }else{
            url = '/api/packet/list/' + $scope.currentPage + '/'
        }
        $http({method: 'GET', url: url}).success(function (data, status, headers, config){
            $scope.numPages = data.numPages;
            $scope.packets = data.packets;
            $scope.loadDone = 1;
            refreshSortScope()
        }).error(function (data, status, headers, config){
                $scope.name = 'Error!'
                console.log("error!!!");
            });
    }

    function refreshSortScope(){
        $http({method: 'GET', url: '/api/packet/sorting/'}).success(function (data, status, headers, config){
            $scope.sorting = data;
            $scope.sorted = function (col){
                if ($scope.sorting.sortBy == col){
                    return $scope.sorting.sortOrder;
                }else{
                    return 'none';
                }
            }
        }).error(function (data, status, headers, config){
                $scope.name = 'Error!'
                console.log("error!!!");
            });
    }
}
PacketListCtrl.$inject = ['$scope', '$http', '$rootScope'];

function MyCtrl2(){
}
MyCtrl2.$inject = [];
