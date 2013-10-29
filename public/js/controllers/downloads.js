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

function DownloadsCtrl($scope, $http){

    $scope.dlList = {}

    $scope.getData = function(){
        $http.get('/api/downloads/').success(function (data, status, headers, config){
            $scope.dlQueue = data.dlQueue;
            jQuery.each($scope.dlQueue,function(srvkey,srvcol){
                jQuery.each(srvcol,function(botname,botqueue){
                    jQuery.each(botqueue,function(queuePos,pack){
                        $scope.dlList[pack.server+"#"+pack.nick+"#"+pack.nr] = pack;
                        $scope.dlList[pack.server+"#"+pack.nick+"#"+pack.nr].queuePos = queuePos;
                        $scope.dlList[pack.server+"#"+pack.nick+"#"+pack.nr].progress = Math.round(Math.random()*100);
                    })
                })
            })
        });
    }



    $scope.getData();
}

DownloadsCtrl.$inject = ['$scope', '$http'];