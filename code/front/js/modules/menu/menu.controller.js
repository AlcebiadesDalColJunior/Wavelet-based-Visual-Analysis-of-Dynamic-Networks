/**
 * Created by pao on 3/2/16.
 */

(function(){
  'use strict';

  angular.module('dynwav')
    .controller('dynwav.menu.controller',[
        'dynwav.option.service',
        'dynwav.data',
        menuController]);

  function menuController( optionService, dataService) {
    var self = this;
    var rootDir = 'results/';
      
    dataService.plain(rootDir + 'cases.json').then(function (cs) {
      self.cases = cs;
    });

    self.optChanged = function () {
      optionService.prepForBroadcast(self.option);
    };

  }
}());