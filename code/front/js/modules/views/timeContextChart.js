/**
 * Created by pao on 10/23/16.
 */

(function() {

  'use strict';

  angular.module('dynwav')
    .directive('timeContextChart', ['util', timeContextChart]);

  function timeContextChart(util) {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        xvalues: '=',
        yvalues: '=',
        height: '=',
        coordinated: '='
      }
    };

    function link(scope, element) {
      var width, height, margin;

      var elemWidth = d3.select(element[0])[0][0].offsetWidth;
      margin = { top: 4, right: 20, bottom: 20, left: 55 };
      width = elemWidth - margin.left - margin.right;
      height = scope.height - margin.top - margin.bottom;

      var svg = d3.select(element[0])
          .append("svg")
          .attr("class","chart")
          .attr("width", width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        ;

      var rect = svg
        .append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","vis-graph-white");

      var gAx = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");

      var g = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");

      var gtop = svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var timeLine= gtop.selectAll(".vis-time-line");
      var currTime = {"x": 0, "y1": -5, "y2": height+5};

      var x = d3.scale.linear()
        .range([0, width]);
      var xb = d3.scale.linear()
        .range([0, width]);
      var y = d3.scale.linear()
        .range([height- margin.bottom, margin.top]);

      var lineChart = g.selectAll(".vis-line-h2");

      var line = d3.svg.line().interpolate("monotone")
        .x(function(d) { return x(d.xv); })
        .y(function(d) { return y(d.yv); });

      var brush = d3.svg.brush()
        .x(xb)
        .on("brush", brushed);


      var xAxis = d3.svg.axis();

      var leftHandle = gtop.append("image")
        .attr("width", 10)
        .attr("height", height)
        .attr("xlink:href",'img/left-handle.png');

      var rightHandle = gtop.append("image")
        .attr("width", 10)
        .attr("height",height)
        .attr("xlink:href",'img/right-handle.png');

      gtop.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", 0)
        .attr("height", height);



      scope.$watch('xvalues', render, true);
      scope.$watch('coordinated.selectedTime', changeSelected);
      scope.$watch('coordinated.timeRange', changeTimeRange);


      function render (xvalues){
        if(!xvalues){ return; }

        var data = [];
        
        scope.yvalues.forEach(function(d,i){ data.push({'xv': i, 'yv': d}); });
        
        var yext = d3.extent(data, function(d){return d.yv});
        y.domain(yext);

        x.domain(d3.extent(data, function(d){return d.xv}));
        xb.domain(x.domain());

        var tickValues = util.selectTickValues(scope.xvalues);


        xAxis.scale(x)
            .orient("bottom")
            .tickValues(tickValues)
            .tickFormat(function (d) {
              return scope.xvalues? scope.xvalues[d]: d;
            });


          // if no axis exists, create one, otherwise update it
          if (gAx.selectAll(".x.vis-axis")[0].length < 1 ){
            gAx.append("g")
              .attr("class","x vis-axis")
              .attr("transform", "translate(0," + (height-margin.bottom+5) + ")")
              .call(xAxis)
              .selectAll("text")
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", ".15em")
              .attr("transform", function(d) {
                return "rotate(-45)"
              });
          } else {
            gAx.selectAll(".x.vis-axis").transition().duration(500).call(xAxis);
          }

        timeLine = timeLine.data([currTime]);

        timeLine.enter().append("line")
          .attr("class","vis-time-line");
        timeLine
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);})
          .attr("y1", function(d) {return d.y1;})
          .attr("y2", function(d) {return d.y2;});

        timeLine.exit().remove();
        
        lineChart = g.selectAll(".vis-line-h2")
          .data([data])
          .attr("class", "vis-line-h2");

        lineChart.transition().duration(500)
          .attr("d",line);

        lineChart.enter().append("path")
          .attr("class", "vis-line-h2")
          .attr("d", line);
        lineChart.exit().remove();

      }
      function changeSelected(selectedTime){
        currTime.x = selectedTime;
        timeLine = timeLine.data([currTime]);
        timeLine
          .transition().duration(300)
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);});
      }

      function brushed() {
        var brushExtent = brush.empty() ? x.domain() : brush.extent();
        leftHandle.attr("x",x(brushExtent[0])-8);
        rightHandle.attr("x",x(brushExtent[1])-2);
        scope.$apply(function() {
          scope.coordinated.timeRange = brushExtent;
        });
      }

      function changeTimeRange(timeRange){
        gtop.select(".brush").call(brush.extent(timeRange));
        leftHandle.attr("x",x(brush.extent()[0])-8);
        rightHandle.attr("x",x(brush.extent()[1])-2);
      }


    }
  }
})();
