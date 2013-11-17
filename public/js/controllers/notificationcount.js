/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Notification controller */

function NotificationCountCtrl($scope, $http, socket, $rootScope){
    $scope.notificationCount = {
        dlstart: 0,
        dlsuccess: 0,
        dlerror: 0
    };

    $rootScope.$on('notificationsClear',function(){
        $scope.notificationCount = {
            dlstart: 0,
            dlsuccess: 0,
            dlerror: 0
        };
    });

    socket.on('send:dlstart',function(data){
        $scope.notificationCount.dlstart++;
    });

    socket.on('send:dlerror',function(data){
        $scope.notificationCount.dlerror++;
    });

    socket.on('send:dlsuccess',function(data){
        $scope.notificationCount.dlsuccess++;
    });

    $scope.$on('$destroy', function () {
        socket.off('send:dlerror');
        socket.off('send:dlstart');
        socket.off('send:dlsuccess');
    });

    $scope.getData = function (){
        $http.get('/api/downloads/notifications/count/').success(function (data, status, headers, config){
            $scope.notificationCount = data;
        })
    };

    $scope.clearNotifications = function(){
        $http.delete('/api/downloads/notifications/count/').success(function (data, status, headers, config){
            $scope.notificationCount = {
                dlstart: 0,
                dlsuccess: 0,
                dlerror: 0
            };
        })
    };

    $scope.getData();


}

NotificationCountCtrl.$inject = ['$scope', '$http', 'socket', '$rootScope'];