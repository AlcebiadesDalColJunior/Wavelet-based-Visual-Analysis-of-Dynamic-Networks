/**
 * Created by pao on 3/15/16.
 */
/**
 * Created by pao on 2/24/16.
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
      var d3ColorScale = d3.scale.linear();
      var width, height, margin, nclasses;

      margin = { top: 2, right: 2, bottom: 5, left: 2 };
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

      var rect_click = svg.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","no-fill")
        .style("pointer-events","visible");

      var currTime = {"x": 0, "y1": 0, "y2": height};

      var x = d3.scale.linear()
        .range([margin.left, width - margin.right]);
      var yBands = d3.scale.ordinal()
        .rangeRoundBands([height - margin.bottom, margin.top],.1, 0);


      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
      //.ticks(g.tick);


      d3ColorScale.range(scope.colorScale).domain(scope.domain);

      scope.$watch('data', render);
      scope.$watch('selectedTime', changeSelected);
      scope.$watch('activeClasses', render, true);

      function render (){
        if(!scope.data){ return; }

        var data = scope.data;
        //var activeColors = scope.colorScale.filter(function(d,i) {return scope.activeClasses[i];})
        //var activeDomain = scope.domain.filter(function(d,i) {return scope.activeClasses[i];})

        //console.log("data", scope.data);

        yBands.domain(data.map(function(d) { return d.key}));


        var y = {};
        var yAxis = {};
        data.forEach(function(d){
          y[d.key] = d3.scale.linear()
            .range([yBands(d.key) + yBands.rangeBand(), yBands(d.key)])
            .domain([0,
              d3.max(d.values, function(e){
                return e.value;
              })
            ]);
          yAxis[d.key] = d3.svg.axis()
            .scale(y[d.key])
            .orient("left")
            .innerTickSize(0)
            .outerTickSize(2)
            //.tickPadding(10)
            .ticks(1);
        });


        x.domain([0, d3.max(data, function(val) { //sets y domain to extent (max min) of all dates
          return d3.max(val.values, function(d){return d.x; });
        })]);

        var area = {};
        data.forEach(function(b){
          area[b.key] = d3.svg.area()
            .interpolate("basis")
            .x(function(d){
              return x(d.x); // x is a time scale
            })
            .y0(function(d) {
              return y[b.key](0); // y is a scale
            })
            .y1(function(d) {
              return y[b.key](d.value); // y is a scale
            });
        });

        var layersData = data.map(function(d) { return {"key": d.key, "area": area[d.key](d.values)};});

        layers = layers.data(data);

        layers.enter().append("path")
          .attr("class", "vis-layer");
        layers
          .style("fill", function(d, i) {
            return d3ColorScale(d.key);
          })
          .transition().duration(1500)
          .attr("d", function(d) {
            return area[d.key](d.values);
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

        rect_click.on("click", function(){
          var coords = d3.mouse(this);
          scope.$apply(function() {
            scope.selectedTime = Math.round(x.invert(coords[0]));
          });
          d3.event.stopPropagation();
        });
        rect_click.on("wheel.zoom",wheel);
        function wheel(){
          var wd = d3.event.wheelDelta ||  d3.event.deltaY;
          var newTime = scope.selectedTime + Math.sign(wd);
          newTime = Math.max(newTime, x.domain()[0]);
          newTime = Math.min(newTime, x.domain()[1]);
          scope.$apply(function() {
            scope.selectedTime = newTime;
          });
          d3.event.stopPropagation();
        }

      }

      function changeSelected(selectedTime){
        currTime.x = selectedTime;
        timeLine = timeLine.data([currTime]);
        timeLine
          .transition().duration(300)
          .attr("x1", function(d) {return x(d.x );})
          .attr("x2", function(d) {return x(d.x );})

      }

    }
  }
})();
