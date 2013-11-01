/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Packetlistcontroller handels the packetlisting */

function PacketListCtrl($scope, $rootScope, $http){
    var loadDone = false;
    $scope.searchString = $rootScope.searchString ? $rootScope.searchString : "";

    var dlList = [];

    function getDownloads(){
        $http.get('/api/downloads/').success(function (data, status, headers, config){
            dlList = []
            $scope.dlQueue = data.dlQueue;
            jQuery.each($scope.dlQueue,function(srvkey,srvcol){
                jQuery.each(srvcol,function(botname,botqueue){
                    jQuery.each(botqueue,function(queuePos,pack){
                        dlList.push(pack);
                    })
                })
            })
        });
    }

    $rootScope.$on("setSearch",function(){
        $scope.searchString = $rootScope.searchString;
        $scope.setPage(1);
    });

    $scope.setPage = function (pageNo){
        $scope.currentPage = pageNo;
        refreshPageScope();
    };

    $scope.setPage(1);
    refreshSortScope();
    getDownloads();

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

    $scope.startDownload = function(packet){
        $http.post('/api/downloads/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                dlList.push(packet);
            }
        });
    }

    $scope.cancelDownload = function(packet){
        $http.post('/api/downloads/cancel/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                dlList = removeArrayItem(dlList,packet);
            }

        });
    }

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
            $scope.numPackets = data.numPackets;
            $scope.packets = data.packets;
            $scope.pageItemLimit = data.pageItemLimit;
            loadDone = true;
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
            };
        });
    }

    function getDownloadIndex(packet){
        var index = -1;
        for (var i=0; i<dlList.length; i++) {
            if(dlList[i].server == packet.server && dlList[i].nick == packet.nick && dlList[i].nr == packet.nr){
                index = i;
                break;
            }
        }
        return index;
    }

    function removeArrayItem(array, item) {
        var id = getDownloadIndex(item);
        if (id != -1) array.splice(id, 1);
        return array;
    }

    $scope.dlActive = function (packet){
        if (getDownloadIndex(packet) == -1){
            return true;
        }else{
            return false;
        }
    }
}

PacketListCtrl.$inject = ['$scope', '$rootScope', '$http'];