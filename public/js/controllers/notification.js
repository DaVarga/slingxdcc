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

function NotificationCtrl($scope, $http, socket, $rootScope){
    $scope.notifications = [];

    socket.on('send:dlstart',function(data){
        $scope.notifications.push(data);
    });

    socket.on('send:dlerror',function(data){
        $scope.notifications.push(data);
    });

    socket.on('send:dlsuccess',function(data){
        $scope.notifications.push(data);
    });

    $scope.$on('$destroy', function () {
        socket.off('send:dlerror');
        socket.off('send:dlstart');
        socket.off('send:dlsuccess');
    });

    $scope.getData = function (){
        $http.get('/api/downloads/notifications/').success(function (data, status, headers, config){
            $scope.notifications = data;
        })
    };

    $scope.clearNotifications = function(){
        $http.delete('/api/downloads/notifications/').success(function (data, status, headers, config){
            $scope.getData();
            $rootScope.$emit('notificationsClear');
        })
    };

    $scope.getError = function(notification){

        if(notification.type == "dlerror"){
            return errordecoder(notification);
        }else{
            return "";
        }

        function errordecoder(notification){
            var error = notification.error;
            if(error == "filename mismatch"){
                return "Filename mismatch, got "+notification.gotFile;
            }
            if(typeof error == "string"){
                return error
            }
            if(error.code == "ETIMEDOUT")
                return "Connection timeout";
            if(error.code == "ECONNREFUSED")
                return "Connection refused";
            if(error.code == "ECONNRESET")
                return "Connection reset";
            return error.code;
        }
    };

    $scope.getData();


}

NotificationCtrl.$inject = ['$scope', '$http', 'socket', '$rootScope'];