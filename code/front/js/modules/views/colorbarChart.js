/**
 * Created by pao on 3/30/16.
 */

(function(){

  'use strict';

  angular.module('dynwav')
    .directive('colorbarChart', [colorbarChart]);

  function colorbarChart() {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        yvalues:'=',
        xvalues:'=',
        colorScale: '=',
        domain:'=',
        cvalues: '=',
        height:'=',
        selectedTime:'='
      }
    };

    function link (scope, element, attrs) {
      var d3ColorScale = d3.scale.linear().range(scope.colorScale).domain(scope.domain);
      var width, height, margin;

      margin = { top: 0, right: 14, bottom: 2, left: 12 };
      width = d3.select(element[0])[0][0].offsetWidth - margin.left - margin.right;
      height = scope.height - margin.top - margin.bottom;

      var svg = d3.select(element[0])
        .append("svg")
        .attr("class","chart")
        .attr("width", width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        ;

      var gcb = svg.append('g').classed("colorbar_h",true)
        .attr("transform", "translate(" + margin.left + "," + margin.top  + ")");

      var cbar = Colorbar()
        .orient("horizontal")
        .origin([0,0])
        .barlength(100)
        .thickness(10);


      scope.$watch('yvalues', render, true);


      function render (yvalues){
        if(!yvalues){ return; }
        cbar.scale(d3ColorScale);

        var colorbarObject = gcb.call(cbar);


      }
      function changeSelected(selectedTime){

      }
    }
  }
})();
