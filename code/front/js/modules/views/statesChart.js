/**
 * Created by pao on 12/22/15.
 */

(function(){

  'use strict';

  angular.module('dynwav')
    .directive('statesChart', [statesChart]);

  function statesChart() {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        xvalues:'=',
        yvalues:'=',
        toolTips:'=',
        colorScale: '=',
        domain:'=',
        cvalues: '=',
        height:'=',
        coordinated:'=',
        statesProps:'='
      }
    };

    function link (scope, element) {
      var d3ColorScale = d3.scale.linear().range(scope.colorScale).domain(scope.domain);
      var width, height, margin;
      var statesProps;

      var elemWidth = d3.select(element[0])[0][0].offsetWidth;
      margin = { top: 5, right: 20, bottom: 5, left: 55 };
      width = elemWidth - margin.left - margin.right;
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

      var rect = svg
        .append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","vis-graph-white");

      var gAx = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");

      var g = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")")
        .attr('clip-path', 'url(#clip)');
      var gtop = svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr('clip-path', 'url(#clip)');

      var lineChart = g.selectAll(".vis-line");
      var lineChartMarks = g.selectAll(".vis-marks");

      var timeLine= gtop.selectAll(".vis-time-line");
      var currTime = {"x": 0, "y1": -5, "y2": height+5};

      var x = d3.scale.linear()
        .range([0, width]);
      var y = d3.scale.linear()
        .range([height- margin.bottom, margin.top]);
      var x_orig;


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

      var zoom = d3.behavior.zoom()
        .scaleExtent([1, Infinity])
        .on("zoom", zoomed);

      rect.call(zoom);
      svg.call(tip);


      scope.$watch('yvalues', render, true);
      scope.$watch('coordinated.selectedTime', changeSelected);
      scope.$watch('coordinated.timeRange', changeTimeRange);


      function render (yvalues){
        if(!yvalues){ return; }
        statesProps = scope.statesProps;

        var data = [];
        data[0] = [];

        yvalues.forEach(function(d,i){data[0].push({
          'xv': i,
          'yv': d,
          'cv': scope.cvalues[i],
          'tip':scope.toolTips[i]
        })} );

        var yext = d3.extent(data[0], function(d){return d.yv});
        x_orig = d3.extent(data[0], function(d){return d.xv});
        x.domain(x_orig);
        y.domain(yext);

        zoom.x(x);

        var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .innerTickSize(-width)
          .outerTickSize(0);

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
        lineChartMarks
          .on("mouseover", function(d, i){
            tip.show(d, i);
            d3.select(this).transition().duration(100)
              .attr("r", 7)
              .style("stroke-width", 2);
          })
          .on("mouseout", function(d, i){
            tip.hide(d,i);
            if(d.xv != scope.coordinated.selectedTime)
              d3.select(this).transition().duration(100)
                .attr("r", 4)
                .style("stroke-width", 1);

          })
          .on("click", function(){
            var sT =x.invert(this.cx.animVal.value);
            scope.$apply(function() {
              scope.coordinated.selectedTime = Math.round(sT);
            });
          d3.event.stopPropagation();
        });
        lineChartMarks.transition().duration(500)
          .attr("r", 4)
          .attr("cx", function(d) { return x(d.xv);})
          .attr("cy", function(d) { return y(d.yv);})
          .style("fill", function(d) {
            if (d.cv.constructor == Array) {
              var color = '#' + rybColorMixer.mix(scope.colorScale, d.cv);
              return color;
            }
            return d3ColorScale(d.cv);
          });
        lineChartMarks.exit().remove();


        lineChartMarks.sort(function (a, b) {
          if (a.cv < b.cv) return -1;               // a is not the hovered element, send "a" to the back
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

      }
      function changeSelected(selectedTime){
        currTime.x = selectedTime;
        timeLine = timeLine.data([currTime]);
        timeLine
          .transition().duration(300)
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);});

        lineChartMarks
          .transition().duration(300)
          .attr("r", function(d){
            if(d.xv == selectedTime)
              return 7;
            return 4;
          })
          .attr("cx", function(d) { return x(d.xv);})
          .attr("cy", function(d) { return y(d.yv);})
          .style("fill", function(d) {
            if (d.cv.constructor == Array) {
              var color = '#' + rybColorMixer.mix(scope.colorScale, d.cv);
              return color;
            }
            return d3ColorScale(d.cv);
          })
          .style("stroke-width", function(d){
            if(d.xv == selectedTime)
              return 2;
            return 1;
          });

      }

      function changeTimeRange(range) {
        var s_orig = x_orig;
        var s = range;

        x.domain(range);

        lineChartMarks
          .attr("cx", function(d) { return x(d.xv);})
        lineChart
          .attr("d", line);
        timeLine
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);});

        var newS = (s_orig[1]-s_orig[0])/(s[1]-s[0]);
        var t = (s[0]-s_orig[0])/(s_orig[1]-s_orig[0]);
        var trans = width*newS*t;
        zoom.scale(newS);
        zoom.translate([-trans,0]);
      }

      function zoomed() {
        var t = 	d3.event.translate;
        var s = 	d3.event.scale;
        var size = width*s;
        t[0] = Math.min(t[0], 0);
        t[0] = Math.max(t[0], width-size);
        zoom.translate(t);

        // Find extent of zoomed area, what's currently at edges of graphed region
        var brushExtent = [x.invert(0), x.invert(width)];
        scope.$apply(function() {
          scope.coordinated.timeRange = brushExtent;
        });
      }
    }
  }
})();
