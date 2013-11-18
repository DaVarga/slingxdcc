
function DashboardCtrl($scope, $http, $timeout) {

    $scope.notifications = [];
    $scope.servers = {};
    $scope.onServers = 0;
    $scope.numServers = 0;
    $scope.nextDbCleanup = 0;
    $scope.packetCount = {
        redPackets: 0,
        conPackets: 0,
        offPackets: 0
    };


    $scope.chartServerData = [
        {
            value: 0,
            color: "#5cb85c"
        },
        {
            value: 0,
            color: "#d9534f"
        }
    ];

    $scope.chartPacketData = [
        {
            value: 0,
            color: "#5cb85c"
        },
        {
            value: 0,
            color: "#d9534f"
        },
        {
            value: 0,
            color: "#999"
        }
    ];

    $scope.redPacketPercentage = function () {
        return $scope.packetCount.redPackets / ($scope.packetCount.absPackets + $scope.packetCount.redPackets) * 100;
    };

    $scope.onPacketPercentage = function () {
        return $scope.packetCount.conPackets / ($scope.packetCount.absPackets + $scope.packetCount.redPackets) * 100;
    };

    $scope.offPacketPercentage = function () {
        return $scope.packetCount.offPackets / ($scope.packetCount.absPackets + $scope.packetCount.redPackets) * 100;
    };

    $scope.onServerPercentage = function () {
        return $scope.onServers / $scope.numServers * 100;
    };

    $scope.offServerPercentage = function () {
        return 100 - $scope.onServerPercentage();
    };

    $scope.getData = function () {

        $http.get('/api/server/').success(function (data, status, headers, config) {
            $scope.onServers = 0;
            $scope.numServers = 0;
            for (var i in data) {
                data[i].key = i;
                if (data[i].connected) {
                    $scope.onServers++;
                }
                $scope.numServers++;
            }
            $scope.servers = data;

            $scope.chartServerData[0].value = $scope.onServers;
            $scope.chartServerData[1].value = $scope.numServers - $scope.onServers;


        });

        $http.get('/api/packet/').success(function (data, status, headers, config) {
            $scope.packetCount = data;
            $scope.chartPacketData[0].value = $scope.packetCount.absPackets-$scope.packetCount.offPackets;
            $scope.chartPacketData[1].value = $scope.packetCount.offPackets;
            $scope.chartPacketData[2].value = $scope.packetCount.redPackets;

        });

        $http.get('/api/db/compacting/').success(function (data, status, headers, config) {
            $scope.nextDbCleanup = data.nextCompacting;
        });

        $http.get('/api/downloads/notifications/').success(function (data, status, headers, config){
            $scope.notifications = data;
        });

    };


    $scope.chartOptions = {
        //Boolean - Whether we should show a stroke on each segment
        segmentShowStroke: true,

        //String - The colour of each segment stroke
        segmentStrokeColor: "#ffffff",

        //Number - The width of each segment stroke
        segmentStrokeWidth: 2,

        //Boolean - Whether we should animate the chart
        animation: true,

        //Number - Amount of animation steps
        animationSteps: 100,

        //String - Animation easing effect
        animationEasing: "easeOutQuart",

        //Boolean - Whether we animate the rotation of the Pie
        animateRotate: true,

        //Boolean - Whether we animate scaling the Pie from the centre
        animateScale: false,

        //Function - Will fire on animation completion.
        onAnimationComplete: deaktivateAnimation
    };

    function deaktivateAnimation() {
        $scope.chartOptions.animateRotate = false;
    }

    $scope.getData();

    var timeout;
    repeat();

    function repeat() {
        timeout = $timeout(function () {
            $scope.getData();
            repeat();
        }, 30000)
    }

    $scope.$on('$destroy', function () {
        $timeout.cancel(timeout);
    });
}

DashboardCtrl.$inject = ['$scope', '$http', '$timeout'];
'use strict';
/* Notification controller */

function NotificationCtrl($scope, $http, socket, $rootScope){

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

    $scope.clearNotifications = function(){
        $http.delete('/api/downloads/notifications/').success(function (data, status, headers, config){
            $scope.notifications=[];
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

}

NotificationCtrl.$inject = ['$scope', '$http', 'socket', '$rootScope'];