'use strict';

angular.module('myApp').controller('DashboardCtrl', ['$scope', '$http', '$timeout', function DashboardCtrl($scope, $http, $timeout) {

    $scope.notifications = [];
    $scope.servers = {};
    $scope.onServers = 0;
    $scope.numServers = 0;
    $scope.compacting = {};
    $scope.packetCount = {
        redPackets: 0,
        absPackets: 0
    };

    // Initial data for charts, will be filled by live data afterwards
    $scope.chartServerData = [0,0];
    $scope.chartPacketData = [0,0,0];

    // Default chart colors
    $scope.chartColors =['#5cb85c', '#d9534f', '#999'];
    // Labels for Packet chart
    $scope.chartPacketLabels =['Unique', 'Redundant'];
    // Labels for Server chart
    $scope.chartServerLabels =['Online', 'Offline'];

    
    

    $scope.redPacketPercentage = function () {
      return $scope.packetCount.redPackets / ($scope.packetCount.absPackets + $scope.packetCount.redPackets) * 100;
    };

    $scope.unqPacketPercentage = function () {
      return 100 - $scope.redPacketPercentage();
    };


    $scope.onServerPercentage = function () {
        return $scope.onServers / $scope.numServers * 100;
    };

    $scope.offServerPercentage = function () {
        return 100 - $scope.onServerPercentage();
    };

    $scope.getData = function () {

    	// retrieve status of servers
        $http.get('/api/server/').then(function (response) {
            $scope.onServers = 0;
            $scope.numServers = 0;
            for (var i in response.data) {
                response.data[i].key = i;
                if (response.data[i].connected) {
                    $scope.onServers++;
                }
                $scope.numServers++;
            }
            $scope.servers = response.data;

            $scope.chartServerData = [ $scope.onServers, $scope.numServers - $scope.onServers];

        });

    	// retrieve status of packet information
        $http.get('/api/packet/').then(function (response) {
            angular.extend($scope.packetCount, response.data);
            $scope.chartPacketData = [ $scope.packetCount.absPackets, $scope.packetCount.redPackets ];

        });

    	// retrieve status of compacting information
        $http.get('/api/db/compacting/').then(function (response) {
            angular.extend($scope.compacting, response.data);
        });

    	// retrieve notifiations
        $http.get('/api/downloads/notifications/').then(function (response){
            $scope.notifications = response.data;
        });

    };


    function deaktivateAnimation() {
        $scope.chartOptions.animation.animateRotate = false;
    }
    
    $scope.chartOptions = {
    	responsive: false,
    	maintainAspectRatio: false,
    		
    		//Boolean - Whether we should show a stroke on each segment
        segmentShowStroke: true,

        //String - The colour of each segment stroke
        segmentStrokeColor: "#ffffff",

        //Number - The width of each segment stroke
        segmentStrokeWidth: 2,

        //Boolean - Whether we should animate the chart
        animation: {
        	numSteps: 100,
        	easing: "easeOutQuart",
        	//Function - Will fire on animation completion.
            onComplete: deaktivateAnimation
        },
      
        onAnimationComplete: deaktivateAnimation
    };



    $scope.getData();
    var timeout;
    
    function repeat() {
        timeout = $timeout(function () {
            $scope.getData();
            repeat();
        }, 30000);
    }
    
    $scope.$on('$destroy', function () {
        $timeout.cancel(timeout);
    });
    
    repeat();
}]);



/* Notification controller */
angular.module('myApp').controller('NotificationCtrl', ['$scope', '$http', 'socket', '$rootScope', '$location',  function ($scope, $http, socket, $rootScope, $location){

    socket.on('send:dlstart',function(data){
        data.type = 'dlstart';
        $scope.notifications.push(data);
    });

    socket.on('send:dlerror',function(data){
        data.type = 'dlerror';
        $scope.notifications.push(data);
    });

    socket.on('send:dlsuccess',function(data){
        data.type = 'dlsuccess';
        $scope.notifications.push(data);
    });

    $scope.$on('$destroy', function () {
        socket.off('send:dlerror');
        socket.off('send:dlstart');
        socket.off('send:dlsuccess');
    });

    $scope.clearNotifications = function(){
        $http.delete('/api/downloads/notifications/').then(function (response){
            $scope.notifications=[];
            $rootScope.$emit('notificationsClear');
        });
    };

    $scope.getError = function(notification){

    	function errordecoder(notification){
            var error = notification.error;
            console.log(error);
            if(error === "filename mismatch"){
                return "Filename mismatch, got "+notification.gotFile;
            }
            if(typeof error === "string"){
                return error;
            }
            if(error.code === "ETIMEDOUT"){
                return "Connection timeout";
            }
            if(error.code === "ECONNREFUSED"){
                return "Connection refused";
            }
            if(error.code === "ECONNRESET"){
                return "Connection reset";
    		}
            return error.code;
        }
    	
        if(notification.type === "dlerror"){
            return errordecoder(notification);
        }else{
            return "";
        }

        
    };

    $scope.searchPacket = function(name){
        $rootScope.searchString = angular.copy(name);
        $scope.$emit("setSearch");
        $location.path("packets");
    };

}]);