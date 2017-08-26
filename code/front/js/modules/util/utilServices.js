/**
 * Created by pao on 11/2/16.
 */

(function() {
  'use strict';
  angular.module('dynwav').factory('util',function(){
    return {
      argSort: function (arr) {
        var arr2 = arr.map(function (o, i) {
          return {idx: i, obj: o};
        }).sort(function (a, b) {
          return b.obj - a.obj;
        });
        return arr2.map(function (d) {
          return d.idx;
        });
      },
      intersection: function (d, e, condition) {
        var intersection = 0;
        for (var j = 0; j < d.length; ++j) {
          if (condition(d[j]) && condition(e[j]) && d[j] == e[j])
            intersection++;
        }
        return intersection;
      },
      isNumeric: function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
      },
      selectTickValues: function (ticks) {
        var tickValues = [];
        if (!this.isNumeric(ticks[0])) {
          var last = ticks[0];
          tickValues.push(0);
          for (var i = 1; i < ticks.length; ++i) {
            if (last != ticks[i]) {
              tickValues.push(i);
              last = ticks[i];
            }
          }
        } else {
          for (var i = 0; i < ticks.length; i += 5) {
            tickValues.push(i);
          }
        }
        return tickValues;
      },
      histogram: function(matrix){
        var data = {};
        var fdata = [];

        var n = matrix.length;

        matrix.forEach(function (vecti, ti) {
          vecti.forEach(function (k) {
            if (!data[k]) {
              data[k] = {};
              for (var i = 0; i < n; ++i)
                data[k][i] = {"value": 0, "key": k, "x": i};
            }
            data[k][ti]["value"]++;
          })
        });

        for (var key in data) {
          var tmp = [];
          for (var fkey in data[key]) {
            tmp.push(data[key][fkey]);
          }
          fdata.push({"key": key, "values": tmp})
        }

        return fdata;
      },
      histogramCond: function(matrix, cond_matrix, threshold)
    {
      var data = {};
      var fdata = [];

      var n = matrix.length;

      matrix.forEach(function (vecti, ti) {
        vecti.forEach(function (k, j) {
          if (!data[k]) {
            data[k] = {};
            for (var i = 0; i < n; ++i)
              data[k][i] = {"value": 0, "key": k, "x": i};
          }
          if (cond_matrix[ti, j] > threshold)
            data[k][ti]["value"]++;
        })
      });

      for (var key in data) {
        var tmp = [];
        for (var fkey in data[key]) {
          tmp.push(data[key][fkey]);
        }
        fdata.push({"key": key, "values": tmp})
      }

      return fdata;
    },
    unique: function(matrix) {
      var set_unique = [];
      matrix.forEach(function (row) {
        set_unique = set_unique.concat(d3.set(row).values());
      });
      return d3.set(set_unique).values();
    },
      extent: function(matrix) {
      var ex = [];
      ex[0] = matrix[0][0];
      ex[1] = matrix[0][0];
      matrix.forEach(function (row) {
        row.forEach(function (e) {
          e = Math.abs(e);
          ex[0] = e < ex[0] ? e : ex[0];
          ex[1] = e > ex[1] ? e : ex[1];
        });
      });
      return ex;
    },
      shortened: function (name) {
        var pos = name.indexOf(',');
        if(pos!=-1)
          return name.slice(0,pos);
        return name;
      },
      linspace: function(start, stop, nsteps){
        var delta = (stop-start)/(nsteps-1)
        return d3.range(nsteps).map(function(i){return start+i*delta;});
      }
  }
  });

})();
