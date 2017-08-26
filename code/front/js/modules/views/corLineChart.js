/**
 * Created by pao on 12/22/15.
 */

(function(){

  'use strict';

  angular.module('dynwav')
    .directive('corLineChart', [corLineChart]);

  function corLineChart() {
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

      margin = { top: 2, right: 2, bottom: 5, left: 2 };
      width = d3.select(element[0])[0][0].offsetWidth - margin.left - margin.right;
      height = scope.height - margin.top - margin.bottom;

      var svg = d3.select(element[0])
        .append("svg")
        .attr("class","chart")
        .attr("width", width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        ;

      var rect = svg.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","vis-graph-white");

      var g = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");
      var gtop = svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var rect_click = svg.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","no-fill");

      var lineChart = g.selectAll(".vis-line");
      var lineChartMarks = g.selectAll(".vis-marks");

      var timeLine= gtop.selectAll(".vis-time-line");
      var currTime = {"x": 0, "y1": -5, "y2": height};

      var x = d3.scale.linear()
        .rangeRound([margin.left, width - margin.right]);
      var y = d3.scale.linear()
        .range([height, 0]);

      var line = d3.svg.line().interpolate("monotone")
        .x(function(d) { return x(d.xv); })
        .y(function(d) { return y(d.yv); });

      scope.$watch('yvalues', render, true);
      scope.$watch('selectedTime', changeSelected);


      function render (yvalues){
        if(!yvalues){ return; }

        var data = [];
        data[0] = [];
        yvalues.forEach(function(d,i){data[0].push({'xv': i,'yv': d, 'cv': scope.cvalues[i]})} );

        x.domain(d3.extent(data[0], function(d){return d.xv}));
        y.domain([0,1]);

        var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(10);

        // if no axis exists, create one, otherwise update it
        if (g.selectAll(".x.vis-axis")[0].length < 1 ){
          g.append("g")
            .attr("class","x vis-axis")
            .attr("transform", "translate(0," + (height-margin.bottom+6) + ")")
            .call(xAxis);
        } else {
          g.selectAll(".x.vis-axis").transition().duration(1500).call(xAxis);
        }
        
        lineChartMarks = g.selectAll(".vis-marks")
          .data(data[0]);

        lineChartMarks.enter()
          .append("rect")
          .attr("class","vis-marks");

        lineChartMarks.on("click", function(){
          var sT =x.invert(this.x.animVal.value + this.width.animVal.value/2.0 - margin.left);
          scope.$apply(function() {
            scope.selectedTime = Math.round(sT);
          });
          d3.event.stopPropagation();
        });
        lineChartMarks
          .transition().duration(1500)
          .attr("width", 3)
          .attr("height", 15)
          .attr("x", function(d) { return x(d.xv);})
          .attr("y", function(d) { return y(1);})
          .style("fill", function(d){
            if(d.cv>.95) {
              return d3ColorScale(d.cv);
            }
            return "none";});
        lineChartMarks.exit().remove();


        timeLine = timeLine.data([currTime]);

        timeLine.enter().append("line")
          .attr("class","vis-time-line");
        timeLine
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);})
          .attr("y1", function(d) {return d.y1;})
          .attr("y2", function(d) {return d.y2;});

        timeLine.exit().remove();
        
        rect.on("wheel.zoom",wheel);

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
