/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
'use strict';

/* Filters */

angular.module('myApp.filters', []).filter('interpolate', ['version', function (version){
        return function (text){
            return String(text).replace(/\%VERSION\%/mg, version);
        }
    }]).filter('truncate',function (){
        return function (text, length, end){
            if (isNaN(length))
                length = 10;

            if (end === undefined)
                end = "...";

            if (text.length <= length || text.length - end.length <= length){
                return text;
            }else{
                return String(text).substring(0, length - end.length) + end;
            }

        };
    }).filter('reverse',function (){
        return function (items){
            return items.slice().reverse();
        };
    }).filter('observTooltip',function (){
        return function (bool){
            if (bool){
                return "Click to un-observe channel";
            }else{
                return "Click to observe channel";
            }
        };
    }).filter('timeago', function (){
        return function (input, p_allowFuture){
            var substitute = function (stringOrFunction, number, strings){
                    var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, dateDifference) : stringOrFunction;
                    var value = (strings.numbers && strings.numbers[number]) || number;
                    return string.replace(/%d/i, value);
                }, nowTime = (new Date()).getTime(), date = (new Date(input)).getTime(), //refreshMillis= 6e4, //A minute
                allowFuture = p_allowFuture || false, strings = {
                    prefixAgo    : null,
                    prefixFromNow: null,
                    suffixAgo    : "",
                    suffixFromNow: "from now",
                    seconds      : "less than a minute",
                    minute       : "about a minute",
                    minutes      : "%d minutes",
                    hour         : "about an hour",
                    hours        : "about %d hours",
                    day          : "a day",
                    days         : "%d days",
                    month        : "about a month",
                    months       : "%d months",
                    year         : "about a year",
                    years        : "%d years"
                }, dateDifference = nowTime - date, words, seconds = Math.abs(dateDifference) / 1000, minutes = seconds / 60, hours = minutes / 60, days = hours / 24, years = days / 365, separator = strings.wordSeparator === undefined ? " " : strings.wordSeparator,

            // var strings = this.settings.strings;
                prefix = strings.prefixAgo, suffix = strings.suffixAgo;

            if (allowFuture){
                if (dateDifference < 0){
                    prefix = strings.prefixFromNow;
                    suffix = strings.suffixFromNow;
                }
            }

            words = seconds < 45 && substitute(strings.seconds, Math.round(seconds), strings) || seconds < 90 && substitute(strings.minute, 1, strings) || minutes < 45 && substitute(strings.minutes, Math.round(minutes), strings) || minutes < 90 && substitute(strings.hour, 1, strings) || hours < 24 && substitute(strings.hours, Math.round(hours), strings) || hours < 42 && substitute(strings.day, 1, strings) || days < 30 && substitute(strings.days, Math.round(days), strings) || days < 45 && substitute(strings.month, 1, strings) || days < 365 && substitute(strings.months, Math.round(days / 30), strings) || years < 1.5 && substitute(strings.year, 1, strings) || substitute(strings.years, Math.round(years), strings);

            return $.trim([prefix, words, suffix].join(separator));
            // conditional based on optional argument
            // if (somethingElse) {
            //     out = out.toUpperCase();
            // }
            // return out;
        }
    })
    .filter('bytes', function() {
        return function(bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
            if (typeof precision === 'undefined') precision = 1;
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));
            if(bytes == 0) return 0 +  ' ' + units[0];
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
        }
    });