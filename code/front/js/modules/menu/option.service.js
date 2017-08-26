/**
 * Created by pao on 3/2/16.
 */

(function(){
  'use strict';

angular.module('dynwav')
  .factory('dynwav.option.service', function($rootScope) {
  var sharedService = {};

  sharedService.option = '';

  sharedService.prepForBroadcast = function(opt) {
    this.message = opt;
    this.broadcastItem();
  };

  sharedService.broadcastItem = function() {
    $rootScope.$broadcast('handleBroadcast');
  };

  return sharedService;
});
}());