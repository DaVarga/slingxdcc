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
angular.module('myApp')
  .controller('PacketListCtrl', ['$scope', '$rootScope', '$http', '$log', function($scope, $rootScope, $http, $log){
    var loadDone = false;
    $scope.searchString = $rootScope.searchString ? $rootScope.searchString : "";

    var dlList = [];

    function getDownloads(){
        $http.get('/api/downloads/').then(function (response){
            dlList = [];
            $scope.dlQueue = response.data.dlQueue;
            jQuery.each($scope.dlQueue,function(srvkey,srvcol){
                jQuery.each(srvcol,function(botname,botqueue){
                    jQuery.each(botqueue,function(queuePos,pack){
                        dlList.push(pack);
                    });
                });
            });
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
	
	$scope.pageChanged = function() {
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
    };
    
    $scope.getCurrentPage = function(){
        return $scope.currentPage;
    };

    $scope.setSorting = function (by){
        var value = {
            sortBy   : $scope.sorting.sortBy,
            sortOrder: $scope.sorting.sortOrder
        };
        value.sortBy = by;
        if (by === $scope.sorting.sortBy){
            if (value.sortOrder !== 'desc'){
                value.sortOrder = 'desc';
            }else{
                value.sortOrder = 'asc';
            }
        }
        $http.put('/api/packet/sorting/', value).then(function (){
            $scope.sorting = value;
            $scope.setPage(1);
        });
    };

    $scope.startDownload = function(packet){
        $http.post('/api/downloads/', {packObj:packet}).then(function (response){
            if(response.data.success){
                dlList.push(packet);
            }
        });
    };

    $scope.cancelDownload = function(packet){
        $http.put('/api/downloads/cancel/', {packObj:packet}).then(function (response){
            if(response.data.success){
                dlList = removeArrayItem(dlList,packet);
            }

        });
    };

    function refreshPageScope(){
        loadDone = false;
        var url;
        if ($scope.searchString.length > 0){
            url = '/api/packet/search/' + $scope.searchString + '/' + $scope.currentPage + '/';
        }else{
            url = '/api/packet/list/' + $scope.currentPage + '/';
        }
        $http({method: 'GET', url: url}).then(function (response){
            $scope.numPages = response.data.numPages;
            $scope.numPackets = response.data.numPackets;
            $scope.packets = response.data.packets;
            $scope.pageItemLimit = response.data.pageItemLimit;
            loadDone = true;
        });
    }

    function refreshSortScope(){
        $http({method: 'GET', url: '/api/packet/sorting/'}).then(function (response){
            $scope.sorting = response.data;
            $scope.sorted = function (col){
                if ($scope.sorting.sortBy === col){
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
            if(dlList[i].server === packet.server && dlList[i].nick === packet.nick && dlList[i].nr === packet.nr){
                index = i;
                break;
            }
        }
        return index;
    }

    function removeArrayItem(array, item) {
        var id = getDownloadIndex(item);
        if (id !== -1) {
        	array.splice(id, 1);
        }
        return array;
    }

    $scope.dlActive = function (packet){
        if (getDownloadIndex(packet) === -1){
            return true;
        }else{
            return false;
        }
    };
}]);

//PacketListCtrl.$inject = ['$scope', '$rootScope', '$http'];