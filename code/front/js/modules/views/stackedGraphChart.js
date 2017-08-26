/**
 * Created by pao on 2/24/16.
 */

(function(){
  'use strict';
  angular.module('dynwav')
    .directive('stackedGraphChart', [stackedGraphChart]);

  function stackedGraphChart() {
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
        var d3ColorScale = d3.scale.linear();
        var width, height, margin, scaleFactor, translateVec, nodeSize;

        margin = { top: 10, right: 10, bottom: 5, left: 10 };
        width = d3.select(element[0])[0][0].offsetWidth - margin.left - margin.right;
        height = scope.height - margin.top - margin.bottom;

        var svg = d3.select(element[0])
          .append("svg")
          .attr("class","chart")
          .attr("width", width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          ;

        var g = svg.append('g')
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var gtop = svg.append('g')
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var layers = g.selectAll(".vis-layer");
        var timeLine= gtop.selectAll(".vis-time-line");

        var currTime = {"x": 0, "y1": 0, "y2": height};

        var x = d3.time.scale()
          .range([0, width]);
        var y = d3.scale.linear()
          .range([height, 0]);

        var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");
        var yAxis = d3.svg.axis()
          .scale(y);

        var stack = d3.layout.stack() // y0 for each time cluster is calculated here!!
          .offset("silhouette")
          .values(function(d) {
            return d.values; // values must be an array with all clusters per each d (each time)
          })
          .x(function(d) {
            return d.x;
          })
          .y(function(d) {
            return d.value;
          });
        var nest = d3.nest() // reusable object to aggroup per key, values is the array with the aggrouped values
          .key(function(d) {
            return d.key;
          });

        var area = d3.svg.area()
          .x(function(d){
            return x(d.x); // x is a time scale, here we are interpolating
          })
          .y0(function(d) {
            return y(d.y0); // y is a scale, here we are interpolating
          })
          .y1(function(d) {
            return y(d.y0 + d.y); // y is a scale, here we are interpolating
          });
      d3ColorScale.range(scope.colorScale).domain(scope.domain);



      scope.$watch('data', render);
        scope.$watch('selectedTime', changeSelected);
        scope.$watch('activeClasses', render, true);


      function render (){
          if(!scope.data){ return; }

          var activeData = scope.data.filter(function(d,i) {return scope.activeClasses[i];})

          var layersData = stack(activeData);
          x.domain([0, d3.max(layersData, function(val) { // sets y domain to extent (max min) of all dates
            return d3.max(val.values, function(d){
              return d.x;
            });
          })]);

          y.domain([0, d3.max(layersData, function(val) { // sets y domain to extent (max min) of all dates
            return d3.max(val.values, function(d){
              return d.y0 + d.y;
            });
          })]);

          layers = layers.data(layersData);

          layers.enter().append("path")
            .attr("class", "vis-layer")
            ;
          layers
            .style("fill", function(d, i) {
              return d3ColorScale(d.key);
            })
            .transition().duration(1500)
            .attr("d", function(d) {
              return area(d.values);
            });
        layers.exit().remove();

          timeLine = timeLine.data([currTime]);

          timeLine.enter().append("line")
            .attr("class","vis-time-line")
            .attr("x1", function(d) {return d.x;})
            .attr("x2", function(d) {return d.x;})
            .attr("y1", function(d) {return d.y1;})
            .attr("y2", function(d) {return d.y2;})
            .attr("z-index",3);

        timeLine.exit().remove();



      }

        function changeSelected(selectedTime){
          currTime.x = selectedTime;
          timeLine = timeLine.data([currTime]);
          timeLine
            .transition().duration(300)
            .attr("x1", function(d) {return x(d.x);})
            .attr("x2", function(d) {return x(d.x);})

        }

    }
  }
})();
