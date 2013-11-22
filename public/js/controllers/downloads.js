/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Downloads controller */

function DownloadsCtrl($scope, $http, socket){

    $scope.dlList = [];
    $scope.speedsum = 0;

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

                data.packObj.progress = parseInt(data.packObj.received / $scope.dlList[i].realsize * 1000)/10;

                $scope.speedsum -= $scope.dlList[i].speed;
                $scope.speedsum += data.packObj.speed;

                angular.extend($scope.dlList[i], data.packObj);
                var secondsleft = parseInt(($scope.dlList[i].realsize - $scope.dlList[i].received) / $scope.dlList[i].speed);
                $scope.dlList[i].eta = parseInt(Date.now() + secondsleft*1000);
                break;
            }
        }
    });

    socket.on('send:dlerror',function(data){
        $scope.getData();
    });

    socket.on('send:dlsuccess',function(data){
        removeArrayItem($scope.dlList, data.packObj);
        $scope.speedsum = speedsum();
    });

    $scope.$on('$destroy', function () {
        socket.off('send:dlerror');
        socket.off('send:dlstart');
        socket.off('send:dlprogress');
        socket.off('send:dlsuccess');
    });

    $scope.getData = function(){
        $http.get('/api/downloads/').success(function (data, status, headers, config){
            $scope.dlList = queuesToArray(data.dlQueue);
            $scope.speedsum = speedsum();
        });
    };

    $scope.cancelDownload = function(packet){
        $http.put('/api/downloads/cancel/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                removeArrayItem($scope.dlList, packet);
                $scope.speedsum = speedsum();
            }
        });
    };

    $scope.rowClass = function(pack){
        if(pack.queuePos == 0){
            return 'dlactive';
        }else{
            return 'dlqueued';
        }
    };



    $scope.upqueue = function(packet){
        $http.put('/api/downloads/upqueue/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                $scope.getData();
            }
        });
    };

    $scope.downqueue = function(packet){
        $http.put('/api/downloads/downqueue/', {packObj:packet}).success(function (data, status, headers, config){
            if(data.success){
                $scope.getData();
            }
        });
    };

    $scope.fistqueue = function(packet, index){
        return (packet.queuePos == 1);
    };

    $scope.lastqueue = function(packet, index){
        return (typeof $scope.dlList[index+1] === "undefined" || !($scope.dlList[index+1].queuePos > packet.queuePos));
    };

    function queuesToArray(queues){
        var array = [];
        jQuery.each(queues,function(srvkey,srvcol){
            jQuery.each(srvcol,function(botname,botqueue){
                jQuery.each(botqueue,function(queuePos,pack){
                    pack.queuePos = queuePos;
                    if(pack.received > 0){
                        pack.progress = parseInt(pack.received / pack.realsize * 1000)/10
                    }
                    array.push(pack);
                });
            });
        });
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

    function speedsum() {
        var speedsum = 0;
        for (var i = 0; i < $scope.dlList.length; i++) {
            if ($scope.dlList[i].speed > 0) {
                speedsum += $scope.dlList[i].speed;
            }
        }
        return speedsum;
    }

    $scope.getData();
}

DownloadsCtrl.$inject = ['$scope', '$http', 'socket'];