(function() {
  'use strict';

  angular.module('dynwav')
    .factory('dynwav.data', dataService);

  function dataService($http) {
    return {
      plain: function (file) {
          return $http.get(file).then(function (response) {
            var data = response.data;
            return data;
          }, function (err) {
            throw err;
          });
      },
      graph: function(file){
        return $http.get(file).then(function(response){
          var graph = response.data;
          if(!graph) return;
          var bounds = [
            [graph.nodes[0].x, graph.nodes[0].y],
            [graph.nodes[0].x, graph.nodes[0].y]
          ];
          graph.nodes.forEach(function(d) {
            bounds[0][0] = Math.min(bounds[0][0], d.x);
            bounds[0][1] = Math.min(bounds[0][1], d.y);
            bounds[1][0] = Math.max(bounds[1][0], d.x);
            bounds[1][1] = Math.max(bounds[1][1], d.y);
          });

          graph.links.forEach(function(d) {
            d.source = graph.nodes[d.source];
            d.target = graph.nodes[d.target];
          });

          graph.dx =  bounds[1][0] - bounds[0][0];
          graph.dy =  bounds[1][1] - bounds[0][1];
          graph.cx = (bounds[0][0] + bounds[1][0]) / 2.0;
          graph.cy = (bounds[0][1] + bounds[1][1]) / 2.0;

          return graph;
        }, function(err){
          throw err;
        });
    },

      graphLinks: function (file, nodes){
        return $http.get(file).then(function(response){
          nodes.forEach(function(d){ d.edgeList = []; });

          var links = response.data.links;
          if(!links) return;
          if(links[0].source == null){
            return [];
          }

          links.forEach(function(d, i) {
            d.sourceID = d.source;
            d.targetID = d.target;
            d.source = nodes[d.sourceID];
            d.target = nodes[d.targetID];

            nodes[d.sourceID].edgeList.push(d.targetID);
            nodes[d.targetID].edgeList.push(d.sourceID);
          });

          nodes.forEach(function(d){ d.edgeList = d3.set(d.edgeList).values(); });

          return links;
        }, function(err){
          throw err;
        });
    },

      graphNodes: function (file){

        return $http.get(file).then(function(response){
          var graph = response.data;
          if(!graph) return;
          graph.nodes.forEach(function(d, i){
            d.id = i;
            d.x = d.x*100;
            d.y = d.y*100;})
          var bounds = [
            [graph.nodes[0].x, graph.nodes[0].y],
            [graph.nodes[0].x, graph.nodes[0].y]
          ];
          graph.nodes.forEach(function(d) {
            d.edgeList = [];
            bounds[0][0] = Math.min(bounds[0][0], d.x);
            bounds[0][1] = Math.min(bounds[0][1], d.y);
            bounds[1][0] = Math.max(bounds[1][0], d.x);
            bounds[1][1] = Math.max(bounds[1][1], d.y);
          });

          graph.dx =  Math.abs(bounds[1][0] - bounds[0][0]);
          graph.dy =  Math.abs(bounds[1][1] - bounds[0][1]);
          graph.cx = (bounds[0][0] + bounds[1][0]) / 2.0;
          graph.cy = (bounds[0][1] + bounds[1][1]) / 2.0;

          return graph;
        }, function(err){
          throw err;
        });

    },

    graphFunction: function (file){
        return $http.get(file).then(function(response){
          var fun_graph= response.data;
          if(!fun_graph) return;
          return fun_graph;
        }, function(err){
          throw err;
        });

    }

    }
  }
})();
