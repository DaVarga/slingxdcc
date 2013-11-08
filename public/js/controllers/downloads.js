/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Downloads */

function DownloadsCtrl($scope, $http, socket){

    $scope.dlList = [];

    socket.on('send:dlstart',function(data){
        for (var i=0; i<$scope.dlList.length; i++) {
            if($scope.dlList[i].server == data.packObj.server && $scope.dlList[i].nick == data.packObj.nick && $scope.dlList[i].nr == data.packObj.nr){
                angular.extend($scope.dlList[i], data.packObj);
                break;
            }
        }
    });

    socket.on('send:dlprogress',function(data){
        for (var i=0; i<$scope.dlList.length; i++) {
            if($scope.dlList[i].server == data.packObj.server && $scope.dlList[i].nick == data.packObj.nick && $scope.dlList[i].nr == data.packObj.nr){
                angular.extend($scope.dlList[i], data.packObj);
                break;
            }
        }
    })

    socket.on('send:dlerror',function(data){
        $scope.getData();
    });

    $scope.$on('$destroy', function () {
        socket.off('send:dlerror');
        socket.off('send:dlstart');
        socket.off('send:dlprogress');
    });

    $scope.getData = function(){
        $http.get('/api/downloads/').success(function (data, status, headers, config){
            $scope.dlList = queuesToArray(data.dlQueue);
        });
    }

    $scope.cancelDownload = function(packet){
        $http.post('/api/downloads/cancel/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                removeArrayItem($scope.dlList, packet);

            }
        });
    }

    $scope.rowClass = function(pack){
        if(pack.queuePos == 0){
            return 'dlactive';
        }else{
            return 'dlinactive';
        }
    }



    $scope.upqueue = function(packet){
        $http.put('/api/downloads/upqueue/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                $scope.getData();
            };
        });
    }

    $scope.downqueue = function(packet){
        $http.put('/api/downloads/downqueue/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                $scope.getData();
            }
        });
    }

    $scope.fistqueue = function(packet, index){
        if(packet.queuePos == 1){
            return true;
        }
        return false;
    }

    $scope.lastqueue = function(packet, index){
        if(typeof $scope.dlList[index+1] === "undefined" || !($scope.dlList[index+1].queuePos > packet.queuePos)){
            return true;
        }
        return false;
    }

    $scope.hasRealSize = function(packet){
        if(packet.realsize > 0){
            return true;
        }else{
            return false;
        }
    }

    function queuesToArray(queues){
        var array = [];
        jQuery.each(queues,function(srvkey,srvcol){
            jQuery.each(srvcol,function(botname,botqueue){
                jQuery.each(botqueue,function(queuePos,pack){
                    pack.queuePos = queuePos;
                    array.push(pack);
                })
            })
        })
        return array;
    }

    function getDownloadIndex(packet){
        var index = -1;
        for (var i=0; i<$scope.dlList.length; i++) {
            if($scope.dlList[i].server == packet.server && $scope.dlList[i].nick == packet.nick && $scope.dlList[i].nr == packet.nr){
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

    $scope.getData();
}

DownloadsCtrl.$inject = ['$scope', '$http', 'socket'];