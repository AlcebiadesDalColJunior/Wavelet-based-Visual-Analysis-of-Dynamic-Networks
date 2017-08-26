/**
 * Created by pao on 3/21/16.
 */

(function(){
  'use strict';
  angular.module('dynwav')
    .directive('areaChart', [areaChart]);

  function areaChart() {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        data:'=',
        height: '=',
        xvalues:'=',
        colorScale: '=',
        domain:'=',
        selectedTime:'=',
        activeClasses:'=',
      }
    };

    function link (scope, element, attrs) {
      var margin = {top: 20.5, right: -.5, bottom: 9.5, left: 20.5},
        width = 720,
        height = 720;

      var n = 60,
        m = 10000,
        zero = d3.range(n).map(function() { return 0; }),
        matrix = zero.map(function() { return zero.slice(); });

      var x = d3.scale.ordinal()
        .domain(d3.range(n))
        .rangeBands([0, width]);

      var z = d3.scale.linear()
        .domain([m / n / 3, m / n, m / n * 3])
        .range(["brown", "#ddd", "darkgreen"])
        .clamp(true);

      var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("margin-left", -margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

      var row = svg.selectAll(".row")
        .data(matrix)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; });

      row.selectAll(".cell")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d, i) { return x(i); })
        .attr("width", x.rangeBand())
        .attr("height", x.rangeBand());

      row.append("line")
        .attr("x2", width);

      row.append("text")
        .attr("x", -6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .text(function(d, i) { return i; });

      var column = svg.selectAll(".column")
        .data(matrix)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

      column.append("line")
        .attr("x1", -width);

      column.append("text")
        .attr("x", 6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) { return i; });

    }
  }
})();