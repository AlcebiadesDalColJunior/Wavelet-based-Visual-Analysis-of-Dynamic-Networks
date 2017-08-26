/**
 * Created by pao on 12/22/15.
 */

(function(){

  'use strict';

  angular.module('dynwav')
    .directive('barChart', [barChart]);

  function barChart() {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        barsHeights:'=',
        barsColor: '=',
        height: '=',
        title: '='
      }
    };

    function link (scope, element) {
      var width, height, margin, scaleFactor, translateVec, nodeSize;

      margin = { top: 2, right: 2, bottom: 6, left: 2 };
      width = d3.select(element[0])[0][0].offsetWidth - margin.left - margin.right;
      height = scope.height - margin.top - margin.bottom;

      var svg = d3.select(element[0])
        .append("svg")
        .attr("class","chart")
        .attr("width", width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        ;

      var g = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");
      var rect = g.append("rect")
        .attr("width", width)
        .attr('height', height)
        .attr("class","vis-graph-light");

      var bars = g.selectAll(".vis-bar");

      var title = g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("class", "percents")
        .attr("y", 0)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(scope.title);

      var x = d3.scale.ordinal()
        .rangeRoundBands([10, width],.2);
      var y = d3.scale.linear()
        .domain([0,1])
        .range([height-margin.bottom, margin.top]);

      var xAxis = d3.svg.axis()
        .scale(x)
        .innerTickSize(0)
        .outerTickSize(0)
        .ticks(0)
        .tickFormat(function (d) { return ''; })
        .orient("bottom");

      scope.$watch('barsHeights', render, true);
      scope.$watch('barsColor', updateColor);

      function render (barsHeights){
        if(!barsHeights){ return; }
        var nBars = barsHeights.length;
        x.domain(d3.range(nBars));

        bars = bars.data(barsHeights);
        bars.exit().remove();

        bars.enter()
          .append('rect')
          .attr("class", "vis-bar");
        bars
          .transition().duration(1000)
          .attr("x", function(d,i) { return x(i); })
          .attr("y", function(d) {
            return y(Math.max(0, d));
          })
          .attr("height", function(d) {
            return  Math.abs(y(0) - y(d) );
          })
          .attr("width", x.rangeBand())

          updateColor(scope.barsColor);

          // if no axis exists, create one, otherwise update it
          if (g.selectAll(".x.vis-axis")[0].length < 1 ){
            g.append("g")
              .attr("class","x vis-axis")
              .attr("transform", "translate(0," + (height-margin.bottom+2) + ")")
              .call(xAxis);
          } else {
            g.selectAll(".x.vis-axis").transition().duration(1500).call(xAxis);
          }

      }
      function updateColor (barsColor){
        if(!barsColor){ return; }
        if(typeof scope.barsColor == 'object') {
          bars
            .style("fill", function(d,i){ return  scope.barsColor[i]; } );

        }else {

          bars
            .style("fill", scope.barsColor);
        }

      }
    }
  }
})();
