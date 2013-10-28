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

    $scope.getData = function(){
        $http.get('/api/downloads/').success(function (data, status, headers, config){
            $scope.dlQueue = data.dlQueue;
        });
    }


    $scope.getData();
}

DownloadsCtrl.$inject = ['$scope', '$http'];