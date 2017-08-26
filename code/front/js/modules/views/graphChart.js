/**
 * Created by pao on 12/8/15.
 */

(function(){

  'use strict';

  angular.module('dynwav')
    .directive('graphChart', [graphChart]);

  function graphChart() {
    return {
      restrict: 'E',
      replace: false,
      link: link,
      scope: {
        graph:'=',
        coordinated:'=',
        gfun:'=',
        colorScale:'=',
        scores:'=',
        colorbar:'=',
        domain:'=',
        height:'=',
        coeffs:'=',
        cvalues:'=',
        currentClass:'=',
        classColorScale:'='
      }
    };

    function link (scope, element, attrs) {
      var width, height, margin, scaleFactor, translateVec, nodeSize,
        nodeSizeSc, colorScale, linkWidth, linkWidthSc, nodeStrokeSc, scoreScale;
      var graphReady = false;
      var debug = true;


      margin = { top: 10, right: 10, bottom: 28, left: 10 };
      width = d3.select(element[0])[0][0].offsetWidth - margin.left - margin.right;
      height = scope.height - margin.top - margin.bottom;

      colorScale = d3.scale.linear();

      var tooltip = d3.select("#tooltip");
      if(tooltip.empty()) {
        tooltip = d3.select("body")
          .append("div")
          .attr('id', 'tooltip');
        tooltip.append("div")
          .attr("class", "tooltip-text");
        tooltip.append("svg")
          .attr("width", 100)
          .attr('height', 100);
      }





      var toolMax = -Infinity;
      var toolMin = Infinity;
      scope.coeffs.forEach(function(wci) {
        wci.forEach(function (wt) {
          wt.forEach(function (wd) {
            toolMax = Math.max(wd, toolMax);
            toolMin = Math.min(wd, toolMin);
          });
        });
      });

      var tool_text = function(label, text, id){
        var tt =  label + ": " +
        "<span style='color:#ffc8cd'>" + text + "</span>";
        return tt ;
      };


      var svg = d3.select(element[0])
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        ;

      var rect = svg.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("class","graph");


      var pg = svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      var g = pg.append('g');
      var gtop = pg.append('g');

      var links = g.selectAll(".vis-link");
      var nodes = gtop.selectAll(".vis-node");

      var barLength = width/1.5;
      var barMargin = .16*width;
      var barThickness = 12;

      var gcb = svg.append('g').classed("colorbar", true)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      var gl = svg.append('g')
        .classed("vis-legend", true)
        .attr("transform", "translate(" + (barMargin) + ", 0)");
      
        var cb = Colorbar()
          .origin([margin.left+barMargin, height-10])
          .barlength(barLength)
          .thickness(barThickness)
          .orient("horizontal");

      var legendLabels = ['Zero', 'Low', 'Mid-low', 'Mid', 'Mid-high', 'High'];
      var legend = gl.selectAll(".legend")
        .data(legendLabels)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
          var iv = i==0? 0:i+1;
          return "translate("+ iv * barLength/legendLabels.length + ", 0)";
        });

      var legendRect = legend.append("rect")
        .attr("y", height)
        .attr("width", barLength/6)
        .attr("height", barThickness)
        .style("stroke", '#333');

      legend.append("text")
        .attr("x", barLength/12)
        .attr("y", height)
        .attr("dy", "30px")
        .style("fill", 'black')
        .style("font-size", '10pt')
        .style("text-anchor", "middle")
        .text(function(d, i) {  if (i <= 1 || i == 5) return d;  return''; });


      var x = d3.scale.linear();
      var y = d3.scale.linear();

      scope.$watch('graph', render);
      scope.$watch('coordinated.tr[0]*coordinated.tr[1]*coordinated.sc', transformView);
      scope.$watch('coordinated.selected', changeSelected);
      scope.$watch('coordinated.hoveredNode', changeHoveredNode);
      scope.$watch('coordinated.selectedTime', colorNodes);
      scope.$watch('graph.nodes', updateNodesPosition);
      scope.$watch('graph.links', updateLinks,true);
      scope.$watch('gfun', colorNodes, true);
      scope.$watch('colorScale', updateScale, true);

      function updateScale() {
        colorScale = d3.scale.linear()
          .range(scope.colorScale)
          .domain(scope.domain);
        if(scope.colorbar) {
          cb.scale(colorScale);
          gcb.call(cb);
          gl.style("display", "none");
          gcb.style("display","block");
        }else{
          legendRect.style("fill", function(d,i){ return scope.colorScale[i]});
          gl.style("display","block");
          gcb.style("display","none");
        }

        colorNodes();
      }


      function render (graph){
        if(!graph){ return; }

        rect.on("click", function () {
          scope.$apply(function() {
            scope.coordinated.selected = -1;
          });
        });


        nodeSize = 8;
        linkWidth = 2;
        nodeSizeSc = nodeSize;
        linkWidthSc = linkWidth;
        nodeStrokeSc = 1;

        scoreScale = d3.scale.linear()
          .range([nodeSizeSc, 2*nodeSizeSc])
          .domain(d3.extent(scope.graph.nodes, function(d){
            return d.score;
          }));

        function zoomed(ev) {
          scope.$apply(function(){
            var tr = d3.event.translate;
            scope.coordinated.sc=  d3.event.scale;
            scope.coordinated.tr[0] = tr[0]/scaleFactor;
            scope.coordinated.tr[1] =  tr[1]/scaleFactor;

            console.log(scope.coordinated.tr);
            console.log(scope.coordinated.sc);
            
            nodeSizeSc = nodeSize/d3.event.scale;
            nodes.attr("r", nodeSizeSc);
            nodeStrokeSc = linkWidth/d3.event.scale;
            linkWidthSc = linkWidth/d3.event.scale;
            links.style("stroke-width", linkWidthSc);

          });
        }
        graphReady = true;
      };

      function updateLinks(graph_links){
        if(!scope.graph.links || !graphReady){ return; }
        links =  links
          .data(scope.graph.links);
        links.enter()
          .append("line")
          .attr("class","vis-link");
        links
          .attr("x1", function(d) {return x(d.source.x);})
          .attr("y1", function(d) {return y(d.source.y);})
          .attr("x2", function(d) {return x(d.target.x);})
          .attr("y2", function(d) {return y(d.target.y);})
          .style("stroke-width", linkWidthSc);
        links.exit()
          .transition().duration(200)
          .style("stroke-width", 0)
          .transition().delay(200)
          .remove();

        highlightSelectedLinks();

        console.log('links updated');
      }

      function updateNodesPosition(graph_nodes ){
        if(!scope.graph.nodes|| !graphReady){ return; }

        var xext = d3.extent(scope.graph.nodes, function(d){return d.x});
        var yext = d3.extent(scope.graph.nodes, function(d){return d.y});

        x.domain(xext);
        y.domain(yext);

        var ws = width-20;
        var hs = height-40;
        var rs = ws/hs;

        var wi = xext[1]-xext[0];
        var hi = yext[1]-yext[0];
        var ri = wi/hi;

        var hnew = 0;
        var wnew = 0;

        if(rs > ri){
          wnew = wi* hs/hi;
          hnew = hs;
        }else{
          wnew  = ws;
          hnew = hi* ws/wi;
        }
        var top = (hs - hnew)/2;
        var left = (ws - wnew)/2;

        x.range([left+10, wnew+left+10]);
        y.range([hnew+top+5, top+5]);

        nodes = nodes.data(scope.graph.nodes);

        nodes.enter()
          .append("circle")
          .attr("class","vis-node");
        nodes
          .attr("r", function (d) {
            return nodeSizeSc;
          })
          .attr("cx", function(d) {
            return x(d.x);
          })
          .attr("cy", function(d) {
            return y(d.y);
          })
          .style("stroke-width", nodeStrokeSc)
          .on("click", function(d, i){
            scope.$apply(function(){
              scope.coordinated.selected = d.id;
            });
          })
          .on("mouseover",  function(d){
            showTip(d);
            d3.select(this).transition().duration(150).style("stroke-width", nodeStrokeSc*1.5);
            highlightLinks(d);
          })
          .on("mouseout",  function(d){
            hideTip();
            if(d.id!=scope.coordinated.selected)
              d3.select(this).transition().duration(150).style("stroke-width", nodeStrokeSc);
            highlightSelectedLinks();
          })
          .on("mousemove", tipMove);
        nodes.exit().remove();
        var selected = scope.coordinated.selected;
        if(selected>=0) changeSelected(selected);
        colorNodes();
        console.log('nodes updated');

      }

      function highlightSelectedLinks(){
        var selNode =  scope.graph.nodes
          .filter(function (d) {
            return d.id == scope.coordinated.selected;
          });
        if(selNode.length > 0) {
          highlightLinks(selNode[0]);
        }else{
          unhighlightLinks(-1);
        }
      }
      function nodeHovered(hId){

        var nH = undefined;
        nodes.transition().duration(150)
          .style("stroke-width", function (d) {
            if(d.id == hId) {
              nH = d;
              return 1.5*nodeStrokeSc;
            }
            return nodeStrokeSc;
          });

        highlightLinks(nH);
      }

      function nodeUnhovered(unId){
        var selected = scope.coordinated.selected;
        nodes.transition().duration(150)
          .style("stroke-width", function (d) {
            if(d.id != selected) {
              return nodeStrokeSc;
            }
            return 1.5*nodeStrokeSc;
          });
        highlightSelectedLinks();
      }


      function highlightLinks(node){
        if(node == undefined) return;
        links
          .attr("class", function(d) {
            if ((d.source.x == node.x && d.source.y == node.y) || (d.target.x == node.x && d.target.y == node.y)) {
              return 'vis-link';
            }
            return 'vis-link transparent';
          });

        nodes
          .attr("class", 'vis-node transparent');
        nodes
          .filter(function (d) {
            return d.id == node.id || indexOf(node.edgeList, d.id)>=0 ;
          })
          .attr("class", 'vis-node');
        
      }
      function unhighlightLinks(node){
        var selected = scope.coordinated.selected;
        if(selected != -1){ return; }

        links
          .attr("class", 'vis-link');
        nodes
          .attr("class", 'vis-node')
          .style("stroke", '#333')
          .style("stroke-width", nodeStrokeSc);
      }

      function colorNodes(){
        console.log("color");
        if(!scope.gfun|| !graphReady){ return; }

        nodes
          .attr("fill", function(d, i) {
          d.value = scope.gfun[d.id];
          return colorScale(d.value);
          return "none";
        });

        nodes.sort(function (a, b) {
          if (a.value < b.value) return -1;          // a is not the hovered element, send "a" to the back
          else return 1;                             // a is the hovered element, bring "a" to the front
        });

      }

      function transformView(){
        
        var transform = "";
        transform += "translate(" + scope.coordinated.tr + ")";
        transform += "scale(" + scope.coordinated.sc + ")";

        console.log(transform);

        g.attr("transform", transform );
        gtop.attr("transform", transform);
      }

      function changeSelected(selected) {

        if (typeof selected === "undefined" || selected == -1) {
          unhighlightLinks(-1);
          return;
        }
        selected = parseInt(selected, 10);
        var selNode = undefined;
        nodes
          .transition().duration(300)
          .attr("r", function (d, i) {
            return scoreScale(d.score);
          })
          .style("stroke", function (d, i) {
            if (d.id === selected) {
              selNode = d;
              return '#00a0ea';
            }
            return '#333';
          })
          .style("stroke-width", function (d, i) {
            if (d.id === selected) {
              return nodeStrokeSc * 1.5;
            }
            return nodeStrokeSc;
          });

        if (!d3.select('#wavcoeff').empty()) {
          var wc = [];
          scope.coeffs.forEach(function(wci) {
            wc.push(wci[scope.coordinated.selectedTime][selected]);
          });

          updateBarChart(wc, 100, 100, selected, '#wavcoeff');
        }

        highlightLinks(selNode);
      }

      function changeHoveredNode(hovered, prevHovered){
        if(typeof hovered === "undefined" || hovered == -1){
          if(typeof prevHovered === "undefined" || prevHovered == -1){
            return;
          }
          nodeUnhovered(prevHovered);
          return;
        }
        nodeHovered(hovered);
      }

      function searchNode(nId){
        var sNode = undefined;
        nodes.each(function (d) {
          if(d.id==nId)
            sNode = d;
        });
        return sNode;
      }

      function indexOf(arr, val) {
        if(!arr) return -1;
        for (var i = 0, len = arr.length; i < len; ++i) {
          if ( i in arr && (arr[i] == val) ) {
            return i;
          }
        }
        return -1;
      }

      function showTip(d) {


        d3.select(".tooltip-text")
          .append("text")
          .attr("class", "textmode")
          .html(tool_text("Name", d.name, d.id));

        var wc = [];
        scope.coeffs.forEach(function(wci) {
          wc.push(wci[scope.coordinated.selectedTime][d.id]);
        });
        updateBarChart(wc, 100, 100, d.id, '#tooltip');

        tooltip
          .style("visibility", "visible");
      }

      function hideTip() {
        tooltip.selectAll(".textmode").remove();
        tooltip.style("visibility", "hidden");
      }

      function tipMove(){
        return tooltip
          .style("top", (d3.event.pageY-10)+"px")
          .style("left",(d3.event.pageX-120)+"px");
      }

      function updateBarChart(_data, _width, _height, _id, _elId){
        d3.select(_elId).selectAll(".vis-bar").remove();
        d3.select(_elId).selectAll(".vis-barchart").remove();

        var _svg = d3.select(_elId)
          .select("svg")
          .append("g")
          .attr("class", "vis-barchart")
          .attr("transform", "translate(5,5)");

        _height -= 10;
        _width -= 6;

        var _x = d3.scale.ordinal().rangeRoundBands([0, _width] ,0.1);
        var _y = d3.scale.linear().range([_height, 2]);

        _x.domain(d3.range(0, _data.length));
        _y.domain([toolMin, toolMax]);

        var _xAxis = d3.svg.axis()
          .scale(_x)
          .orient("bottom")
          .innerTickSize(0)
          .outerTickSize(0)
          .ticks(0)
          .tickFormat('');

        _svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + (_height+1) + ")")
          .call(_xAxis);

        _svg.selectAll(".vis-bar")
          .data(_data)
          .enter()
          .append("rect")
          .style("fill", scope.classColorScale[scope.currentClass[_id]-1])
          .attr("x", function(d,i) { return _x(i); })
          .attr("width", _x.rangeBand())
          .attr("y", function(d) {  return _y(d); })
          .attr("height", function(d) { return _height - _y(d); });

      }

    }


  };

})();
