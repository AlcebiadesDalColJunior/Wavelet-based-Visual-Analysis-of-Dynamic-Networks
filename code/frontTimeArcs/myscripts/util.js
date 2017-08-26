var diameter = 1000,
    radius = diameter / 2,
    innerRadius = radius - 120;

  // Add color legend
function drawColorLegend() {
      var xx = 6;
      var y1 = 50;
      var y2 = 64;
      var y3 = 78;
      var y4 = 92;
      var y5 = 106;
      var rr = 6;

      // svg.append("circle")
      //   .attr("class", "nodeLegend")
      //   .attr("cx", xx)
      //   .attr("cy", y1)
      //   .attr("r", rr)
      //   .style("fill", "#00aa00");
      //
      // svg.append("text")
      //   .attr("class", "nodeLegend")
      //   .attr("x", xx+10)
      //   .attr("y", y1+2)
      //  .text("Comedy")
      //   .attr("dy", ".21em")
      //   .attr("font-family", "sans-serif")
      //   .attr("font-size", "12px")
      //   .style("text-anchor", "left")
      //   .style("fill", "#00aa00");
      //
      // svg.append("circle")
      //   .attr("class", "nodeLegend")
      //   .attr("cx", xx)
      //   .attr("cy", y2)
      //   .attr("r", rr)
      //   .style("fill", "#cc0000");
      //
      // svg.append("text")
      //   .attr("class", "nodeLegend")
      //   .attr("x", xx+10)
      //   .attr("y", y2+2)
      //   .text("Action")
      //   .attr("dy", ".21em")
      //   .attr("font-family", "sans-serif")
      //   .attr("font-size", "12px")
      //   .style("text-anchor", "left")
      //   .style("fill", "#cc0000");
      //
      //  svg.append("circle")
      //   .attr("class", "nodeLegend")
      //   .attr("cx", xx)
      //   .attr("cy", y3)
      //   .attr("r", rr)
      //   .style("fill", "#0000cc");
      //
      // svg.append("text")
      //   .attr("class", "nodeLegend")
      //   .attr("x", xx+10)
      //   .attr("y", y3+2)
      //   .text("Drama")
      //   .attr("dy", ".21em")
      //   .attr("font-family", "sans-serif")
      //   .attr("font-size", "12px")
      //   .style("text-anchor", "left")
      //   .style("fill", "#0000cc");
}

function removeColorLegend() {
 svg.selectAll(".nodeLegend").remove();
}


function getColor(category, count) {
  var minSat = 0;
  var maxSat = 200;
  var percent = count/(termMaxMax3);
  var sat = minSat+Math.round(percent*(maxSat-minSat));
  if (category=="Green")
    return "rgb("+sat+", "+180+", "+sat+")" ; // leaf node
  else if (category=="Red")
    return "rgb("+230+", "+sat+", "+sat+")" ; // leaf node
  else if (category=="Blue")
    return "rgb("+sat+", "+sat+", "+230+")" ; // leaf node
  else{
    console.log(category);
    return "#000000";    
  }
}

function colorFaded(d) {
  var minSat = 80;
  var maxSat = 200;
  var step = (maxSat-minSat)/maxDepth;
  var sat = Math.round(maxSat-d.depth*step);

  return d._children ? "rgb("+sat+", "+sat+", "+sat+")"  // collapsed package
    : d.children ? "rgb("+sat+", "+sat+", "+sat+")" // expanded package
    : "#aaaacc"; // leaf node
}


function getBranchingAngle1(radius3, numChild) {
  if (numChild<=2){
    return Math.pow(radius3,2);
  }  
  else
    return Math.pow(radius3,1);
 } 

function getRadius(d) {
 // console.log("scaleCircle = "+scaleCircle +" scaleRadius="+scaleRadius);
return d._children ? scaleCircle*Math.pow(d.childCount1, scaleRadius)// collapsed package
      : d.children ? scaleCircle*Math.pow(d.childCount1, scaleRadius) // expanded package
      : scaleCircle;
     // : 1; // leaf node
}


function childCount1(level, n) {
    count = 0;
    if(n.children && n.children.length > 0) {
      count += n.children.length;
      n.children.forEach(function(d) {
        count += childCount1(level + 1, d);
      });
      n.childCount1 = count;
    }
    else{
       n.childCount1 = 0;
    }
    return count;
};

function childCount2(level, n) {
    var arr = [];
    if(n.children && n.children.length > 0) {
      n.children.forEach(function(d) {
        arr.push(d);
      });
    }
    arr.sort(function(a,b) { return parseFloat(a.childCount1) - parseFloat(b.childCount1) } );
    var arr2 = [];
    arr.forEach(function(d, i) {
        d.order1 = i;
        arr2.splice(arr2.length/2,0, d);
    });
    arr2.forEach(function(d, i) {
        d.order2 = i;
        childCount2(level + 1, d);
        d.idDFS = nodeDFSCount++;   // this set DFS id for nodes
    });

};

d3.select(self.frameElement).style("height", diameter + "px");


// Toggle children on click.
function click(d) {}
