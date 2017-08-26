/**
 * Created by pao on 12/22/15.
 */

(function(){

  'use strict';

  angular.module('dynwav')
    .directive('nodesChart', ['util', nodesChart]);

  function nodesChart(util) {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        nodes: '=',
        xvalues:'=',
        colorScale: '=',
        domain:'=',
        cvalues: '=',
        signal: '=',
        height:'=',
        nodeHeight:'=',
        coordinated:'=',
        order:'='
      }
    };

    function link (scope, element) {

      var d3ColorScale = d3.scale.linear().range(scope.colorScale).domain(scope.domain);
      var width, height, margin;

      var elemWidth = d3.select(element[0])[0][0].offsetWidth;

      margin = { top: 20, right: 20, bottom: 5, left: 55};
      width = elemWidth - margin.left - margin.right;

      var svg= d3.select(element[0])
        .append("svg")
        .attr("class","chart")
        .attr("width", width + margin.left + margin.right);

      var clip = svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width + 4 );

      var rect = svg.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr("class","vis-graph-white");

      var gAx = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + 5 + ")");

      var g = svg.append('g')
        .attr("transform","translate(" + margin.left + "," + 5 + ")")

      var gtimeline = svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + 5 + ")")

      var timeLine= gtimeline.selectAll(".vis-time-line");
      var currTime = {"x": 0, "y1": -5, "y2": 100+5};

      var x = d3.scale.linear()
        .range([0, width]);
      var y = d3.scale.ordinal();

      var nodeChartMarks = {};
      var data = [];
      var dataIdx = {};
      var rankedNodes = [];

      var order = [];
      var distance = [];
      var whichOrder = 0;
      var nodeRoot = 0;

      var name = 'name';

      var condition = function (d) {return d>4;};

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .innerTickSize(-width)
        .outerTickSize(0);

      scope.$watch('nodes', updateNodes);
      scope.$watch('coordinated.selectedTime', changeSelectedTime);
      scope.$watch('coordinated.selected', changeSelectedNode);
      scope.$watch('coordinated.timeRange', changeTimeRange);

      function updateNodes (nodes){
        if(!nodes){ return; }
        if(nodes[0].hasOwnProperty('shortname'))
          name = 'shortname';
        x.domain([0, scope.cvalues[0].length-1]);

      render();

      }

      function render(){

        computeVisibleData();

        if (whichOrder==0 || !dataIdx[nodeRoot]) {
          order = data.map(function(d){return d.id;});
        } else{
          order = computeOrdering();
        }
        
        var dataLength = data.length;

        height = scope.nodeHeight*dataLength;
        svg.attr('height', height + margin.top + margin.bottom);

        clip.attr('height', height + margin.top + margin.bottom);

        rect.attr('height', height + margin.top + margin.bottom)
          .on("click", function () {
            whichOrder = 0;
            changeOrder(data.map(function(d){return d.id;}));
          });
        currTime = {"x": scope.coordinated.selectedTime, "y1": -5, "y2": height+5};


        y.rangeBands([8, height-8], 0, 0)
          .domain(order);

        yAxis.tickFormat(function (d) {
          return data[dataIdx[d]].name;
        });
        // if no axis exists, create one, otherwise update it
        if (gAx.selectAll(".y.vis-axis")[0].length < 1 ){
          gAx.append("g")
            .attr("class","y vis-axis")
            .call(yAxis)
            .selectAll("text")
            .attr("transform", "translate(0," + (-y.rangeBand()/2)+ ")")
            .on({
              "mouseover": labelOver,
              "mouseout": labelOut
            })
            .on("click", labelClicked);
        } else {
          gAx.selectAll(".y.vis-axis").transition().duration(500).call(yAxis)
          gAx.selectAll(".y.vis-axis")
            .selectAll("text")
            .attr("class", "node-axis-label")
            .attr("transform", "translate(0," + (-y.rangeBand()/2)+ ")")
            .on({
              "mouseover": labelOver,
              "mouseout": labelOut
            })
            .on("click", labelClicked);
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
        g.selectAll('.node-line').attr('opacity', 0);
        data.map(renderNode);
      }


      function renderNode(nodeData){

        var nodeLine;
        if (g.selectAll('.node-line.id-'+nodeData.id)[0].length < 1 ) {
          nodeLine = g.append("g")
            .attr("class", 'node-line id-' + nodeData.id)
            .attr("transform", "translate(0," + y(nodeData.id) + ")");
          g.select('.node-line.id-' + nodeData.id).datum(nodeData.id)

        }else{
          nodeLine = g.select('.node-line.id-' + nodeData.id)
            .attr("transform", "translate(0," + y(nodeData.id) + ")");
        }
        nodeLine.attr('opacity', 1);

        var datum = nodeData.datum;

        nodeChartMarks[nodeData.id] = nodeLine.selectAll(".vis-marks.id-"+nodeData.id)
          .data(datum);

        nodeChartMarks[nodeData.id]
          .enter()
          .append("circle")
          .attr("class","vis-marks id-" + nodeData.id);
        nodeChartMarks[nodeData.id]
          .attr("r", 4)
          .attr("cx", function(d) { return x(d.x);})
          .style("fill", function(d){
            return  d3ColorScale(d.cv);
          });
        nodeChartMarks[nodeData.id].exit().remove();
        nodeChartMarks[nodeData.id]
          .on("mouseover", function(d){
            d3.select(this).transition().duration(100)
              .attr("r", 7)
              .style("stroke-width", 2);
            gAx.selectAll('text')
              .style("font-weight", function(dt,it) {return order[it] == nodeData.id ? 900 : 'normal'});
            var sT =x.invert(this.cx.animVal.value);
            scope.$apply(function() {
              scope.coordinated.hoveredNode = d.id;
            });
          })
          .on("mouseout", function(d){
            if(d.x != scope.coordinated.selectedTime || d.id != scope.coordinated.selected)
              d3.select(this).transition().duration(100)
                .attr("r", 4)
                .style("stroke-width", 1);
            gAx.selectAll('text').style("font-weight", 'normal');
            scope.$apply(function() {
                scope.coordinated.hoveredNode = -1;
            });
          })
          .on("click", function(d){
            var sT =x.invert(this.cx.animVal.value);
            scope.$apply(function() {
              scope.coordinated.selectedTime = Math.round(sT);
              scope.coordinated.selected = d.id;
            });
            d3.event.stopPropagation();
          });

        nodeChartMarks[nodeData.id].sort(function (a, b) {
          if (a.cv < b.cv) return -1;               // a is not the hovered element, send "a" to the back
          else return 1;                             // a is the hovered element, bring "a" to the front
        });

      }


      function computeVisibleData(){
        data = [];
        dataIdx = {};

        rankedNodes = scope.nodes.filter(function (d) { return d.rank>0; });
        rankedNodes.sort(function(a, b) {
          return b.rank - a.rank;
        });

        rankedNodes.forEach(function(d){
          var cv = scope.cvalues[d.id];
          var cvInRange = cv.filter(function(dcv, i){
            return  condition(dcv) && (i>=x.domain()[0]) &&  (i <= x.domain()[1]);
          });
          if(cvInRange.length > 0)
            data.push({'name': d[name], 'd': d ,'id': d.id, 'cv': cv});
        });

        data.forEach(function(e, i) {
          e.datum = e.cv.map(function (d, i) {
            return {"id": e.id, "cv": d, "x": i}
          })
            .filter(function (d) {
            return condition(d.cv);
          });
          e.pos = i;
          dataIdx[e.id] = i;
        });

      }


      function changeSelectedTime(selectedTime){
        currTime.x = selectedTime;
        timeLine = timeLine.data([currTime]);
        timeLine
          .transition().duration(300)
          .attr("x1", function(d) {return x(d.x);})
          .attr("x2", function(d) {return x(d.x);});

        data.forEach(highlightSelectedNode);
      }

      function changeSelectedNode(){
        data.forEach(highlightSelectedNode);
      }

      function highlightSelectedNode(data){
        nodeChartMarks[data.id]
          .attr("r", function(d){
            if(d.x != scope.coordinated.selectedTime || d.id != scope.coordinated.selected)
              return 4;
            return 7;
          })
          .style("stroke-width", function(d){
            if((!condition(d.cv)) || d.x != scope.coordinated.selectedTime || d.id != scope.coordinated.selected)
              return 1;
            return 2;
          })
          .attr("cx", function(d) { return x(d.x);})
          .style("fill", function(d){
            return  d3ColorScale(d.cv);
          });
      }

      function changeOrder(newOrder){
        if(!newOrder) return;
        var e = order.length === newOrder.length && order.every(function(element, index) {
          return element === newOrder[index];
        });
        if(e) return;
        order = newOrder;
        y.domain(order);

        if(whichOrder==1){

          g.selectAll(".node-line")
            .style('opacity', function(d) {
              return distance[dataIdx[d]] == 0 ? 0.3: 1;
            });


          gAx.selectAll(".y.vis-axis").call(yAxis)
            .selectAll("text")
            .style("opacity", function(d) {
              return distance[dataIdx[d]] === 0 ? 0.4: 1;
            });

        }else{
          g.selectAll(".node-line")
            .style('opacity', 1);
        }

        var transition = svg.transition().duration(400);

        transition.selectAll(".node-line")
            .attr("transform", function(d) {
            var newY = order.indexOf(d)!=-1? y(d):-400;
            return "translate( 0," +  newY  +  ")";
          });

        gAx.selectAll(".y.vis-axis").call(yAxis)
          .selectAll("text")
          .style("opacity", 1)
          .attr("transform", "translate(0," + (-y.rangeBand()/2)+ ")")
          .on({
            "mouseover": labelOver,
            "mouseout": labelOut
          })
          .on("click", labelClicked);

      }

      function labelOver(d) {
        d3.select(this).style("cursor", "pointer")
          .style("fill", "#00a0ea");
        scope.$apply(function() {
          scope.coordinated.hoveredNode = d;
        });

      }
      function labelOut() {
        d3.select(this).style("cursor", "default")
          .style("fill", '#666');
        scope.$apply(function() {
          scope.coordinated.hoveredNode = -1;
        });

      }


      function labelClicked(d) {
        whichOrder = 1;
        nodeRoot = d;
        console.log(scope.nodes[d]);
        scope.$apply(function() {
          scope.coordinated.selected = d;
        });
        var newOrder = computeOrdering();
        changeOrder(newOrder);
      }

      function changeTimeRange(range) {
        x.domain(range);
        rankNodes();
        render();
      }


      function rankNodes(){
        
        console.log("rank nodes");

        var extent = x.domain();
        extent[0] = Math.round(extent[0]);
        extent[1] = Math.round(extent[1]);

        var countif = d => d>4;
        var ranking = scope.cvalues.map(function (cv) {
          var count = 0;
          for(var j=extent[0]; j<=extent[1]; ++j){
            count += countif(cv[j])? 1: 0;
          }
          return count;
        });

        scope.nodes.forEach((d,i) => d.rank = ranking[i]);

      }

      function computeOrdering(){

        var idx = dataIdx[nodeRoot];

        distance = [];
        distance[idx] = Infinity;
        for(var i=0; i<data.length; ++i){
          if(i != idx){
            distance[i] = util.intersection(data[idx].cv, data[i].cv, condition);
          }
        }

        var dsort = util.argSort(distance);
        return dsort.map(function (d) {
          return data[d].id;
        });



      }

    }
  }
})();
