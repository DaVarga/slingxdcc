/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'ui.bootstrap', 'angles', 'ngRoute']).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider){
        $routeProvider
            .when('/', {
                templateUrl: 'partials/dashboard/'
            })
            .when('/packets', {
                templateUrl: 'partials/packetlist/'
            })
            .when('/settings', {
                templateUrl: 'partials/settings/'
            })
            .when('/downloads', {
                templateUrl: 'partials/downloads/'
            })
            .otherwise({
                redirectTo: '/'
            });
        $locationProvider.html5Mode(true);
    }]);

