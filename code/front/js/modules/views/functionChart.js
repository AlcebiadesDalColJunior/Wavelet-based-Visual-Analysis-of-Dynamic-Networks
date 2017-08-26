/**
 * Created by pao on 12/22/15.
 */

(function(){

  'use strict';

  angular.module('dynwav')
    .directive('functionChart', [functionChart]);

  function functionChart() {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        yvalues:'=',
        xvalues:'=',
        toolTips:'=',
        colorScale: '=',
        domain:'=',
        cvalues: '=',
        height:'=',
        coordinated:'='
      }
    };

    function link (scope, element, attrs) {
      var d3ColorScale = d3.scale.linear().range(scope.colorScale).domain(scope.domain);
      var width, height, margin, scaleFactor, translateVec, nodeSize;

      var elemWidth = d3.select(element[0])[0][0].offsetWidth;

      margin = { top: 8, right: 20, bottom: 15, left: 55};
      width = d3.select(element[0])[0][0].offsetWidth - margin.left - margin.right;
      height = scope.height - margin.top - margin.bottom;

      var svg = d3.select(element[0])
        .append("svg")
        .attr("class","chart")
        .attr("width", width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        ;

      svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width+ margin.left )
        .attr('height', height + margin.top + margin.bottom);

      var rect = svg.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","vis-graph-white");

      var g = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")")
        .attr('clip-path', 'url(#clip)');

      var gAx = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");
      var gtop = svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr('clip-path', 'url(#clip)');

      var rect_click = svg.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","no-fill");

      var lineChart = g.selectAll(".vis-line");
      var lineChartMarks = g.selectAll(".vis-marks");

      var timeLine= gtop.selectAll(".vis-time-line");
      var currTime = {"x": 0, "y1": -5, "y2": height+5};

      var x = d3.scale.linear()
        .range([0, width]);
      var y = d3.scale.linear()
        .range([height- margin.bottom, margin.top]);

      var xAxis = d3.svg.axis();


      var line = d3.svg.line().interpolate("monotone")
        .x(function(d) { return x(d.xv); })
        .y(function(d) { return y(d.yv); });

      var tool_text = function(text){return "<span>" + text + "</span>"};

      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d,i) {
          if(typeof d.tip !== 'undefined' ) {
            return tool_text(d.tip);
          }
          return tool_text(d.xv);
        });
      svg.call(tip);

      scope.$watch('yvalues', render, true);
      scope.$watch('coordinated.selectedTime', changeSelected);
      scope.$watch('coordinated.selectedTime', changeSelected);
      scope.$watch('coordinated.timeRange', changeTimeRange);


      function render (yvalues){
        if(!yvalues){ return; }


        var data = [];
        data[0] = [];

        yvalues.forEach(function(d,i){data[0].push({'xv': i,'yv': d, 'cv': scope.cvalues[i], 'tip': scope.toolTips[i]})} );

        x.domain(scope.coordinated.timeRange);
        y.domain(d3.extent(data[0], function(d){return d.yv}));

        xAxis.scale(x)
          .orient("bottom")
          .ticks(10);

        // if no axis exists, create one, otherwise update it
        if (gAx.selectAll(".x.vis-axis")[0].length < 1 ){
          gAx.append("g")
            .attr("class","x vis-axis")
            .attr("transform", "translate(0," + (height-margin.bottom+5) + ")")
            .call(xAxis);
        } else {
          gAx.selectAll(".x.vis-axis").transition().duration(500).call(xAxis);
        }

        var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .innerTickSize(-width)
          .outerTickSize(0)
          .ticks(4);

        // if no axis exists, create one, otherwise update it
        if (gAx.selectAll(".y.vis-axis")[0].length < 1 ){
          gAx.append("g")
            .attr("class","y vis-axis")
            .call(yAxis);
        } else {
          gAx.selectAll(".y.vis-axis").transition().duration(500).call(yAxis);
        }
        
        lineChart = g.selectAll(".vis-line")
          .data(data)
          .attr("class", "vis-line");

        lineChart.transition().duration(500)
          .attr("d",line);

        lineChart.enter().append("path")
          .attr("class", "vis-line")
          .attr("d", line);
        lineChart.exit().remove();
        
        lineChartMarks = g.selectAll(".vis-marks")
          .data(data[0]);

        lineChartMarks.enter()
          .append("circle")
          .attr("class","vis-marks");
        lineChartMarks.transition().duration(500)
          .attr("r", 4)
          .attr("cx", function(d) { return x(d.xv);})
          .attr("cy", function(d) { return y(d.yv);})
          .style("fill", function(d){return d3ColorScale(d.cv);});
        lineChartMarks.exit().remove()
        lineChartMarks
          .on("mouseover", function(d, i){
            tip.show(d, i);
          })
          .on("mouseout", function(d, i){
            tip.hide(d,i);
          })
          .on("click", function(){
            var sT =x.invert(this.cx.animVal.value);
            scope.$apply(function() {
              scope.coordinated.selectedTime = Math.round(sT);
            });
            d3.event.stopPropagation();
          });

        lineChartMarks.sort(function (a, b) {
          if (a.cv < b.cv) return -1;                // a is not the hovered element, send "a" to the back
          else return 1;                             // a is the hovered element, bring "a" to the front
        });


        timeLine = timeLine.data([currTime]);

        timeLine.enter().append("line")
          .attr("class","vis-time-line");
        timeLine
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);})
          .attr("y1", function(d) {return d.y1;})
          .attr("y2", function(d) {return d.y2;});

        timeLine.exit().remove();
        
        rect_click.on("wheel.zoom",wheel);

        function wheel(){
          var wd = d3.event.wheelDelta ||  d3.event.deltaY;
          var newTime = scope.coordinated.selectedTime + Math.sign(wd);
          newTime = Math.max(newTime, x.domain()[0]);
          newTime = Math.min(newTime, x.domain()[1]);
          scope.$apply(function() {
            scope.coordinated.selectedTime = newTime;
          });
          d3.event.stopPropagation();
        }
      }

      function changeTimeRange(range) {
        x.domain(range);
        lineChartMarks
          .attr("cx", function(d) { return x(d.xv);})
        lineChart
          .attr("d", line);
        timeLine
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);});
        gAx.select(".x.vis-axis").call(xAxis);
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
