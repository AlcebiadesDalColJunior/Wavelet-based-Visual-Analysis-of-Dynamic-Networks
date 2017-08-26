/**
 * Created by pao on 11/28/16.
 */

(function() {
  'use strict';
  angular.module('dynwav')
    .factory('nodeRanking',['util', nodeRanking]);

  function nodeRanking (util){
    return {
      rank: function(signalArr, peaksArr, signalExtent, windowSize, percentage, lambda, extent, debug) {
        var signalLen = extent[1]-extent[0]+1;
        var numTops = Math.ceil(signalLen*percentage);
        var relevance = signalArr.map(function (signal, i) {
          if(debug) console.log("node", i);
          var signalInExtent = signal.slice(extent[0], extent[1]+1);
          var peaksInExtent = peaksArr[i].slice(extent[0], extent[1]+1);
          return getNodeRelevance(signalInExtent, peaksInExtent, windowSize, numTops, signalExtent, lambda, util, debug);
        });
        return relevance;
      },
      getPeaks: topHatPeaks
    }
  }

  var getNodeRelevance = function(signal, peaks, windowSize, numTops, signalExtent, lambda, util, debug){
    var signalMax = signalExtent[1]-signalExtent[0];
    var sumSignal = signal.reduce(function(a, b) { return (a === b) ? a : NaN;});

    if (!isNaN(sumSignal)) {
      return -Infinity;
    }

    var idx = util.argSort(peaks).filter(function(d) {return peaks[d]>0;});
    idx = idx.slice(0, numTops);

    idx.sort(function(a, b) {
      return a - b;
    });

    var tMax = signal.length;

    var deltaI = 0;
    var deltaMin = Infinity;
    var deltaMax = -Infinity;

    var intensity = 0;
    var periodicity = 0;

    for(var i=0; i<idx.length-1; ++i){
      deltaI = Math.abs(idx[i+1] - idx[i]);
      deltaMin = Math.min(deltaMin, deltaI);
      deltaMax = Math.max(deltaMax, deltaI);
      periodicity += deltaI;

      intensity += signal[idx[i]]-signalExtent[0];
      if(debug) {
        console.log('peak', peaks[idx[i]]);
        console.log('idx', idx[i])
        console.log('sig', signal[idx[i]]);
      }
    }
    if(debug) {
      console.log('peak', peaks[idx[i]]);
      console.log('idx', idx[i])
      console.log('sig', signal[idx[i]]);
      console.log('dmin', deltaMin);
      console.log('dmax', deltaMax);
    }


    intensity += signal[idx[i]]-signalExtent[0];

    var intensityW =  intensity/(numTops*signalMax);
    var periodicityW = periodicity*deltaMin/(deltaMax*tMax);
    periodicityW = isNaN(periodicityW)? 0: periodicityW;


    if(debug) {
      console.log('in', intensityW);
      console.log('per', periodicityW);
    }

    var relevance = lambda*intensityW + (1-lambda)*periodicityW;
    relevance = isNaN(relevance)? -Infinity: relevance;

    return relevance;
  }

  var applyOperator = function(signal, index, windowSize, operator){
    if(!signal || signal.length==0) return;
    var offset = (windowSize-1)/2;
    var from = Math.max(0, index-offset);
    var to = Math.min(signal.length-1, index+offset);

    var res = signal[index];

    for(var i=from; i<=to; ++i){
      res = operator(res, signal[i]);
    }
    return res;
  };

  var operation = function(signal, windowSize, operator){
    var res = [];
    for(var i=0; i<signal.length; ++i){
        res[i] = applyOperator(signal, i, windowSize, operator);
    }
    return res;
  };

  var diff = function(signalA, signalB){
    if(signalA.length>signalB.length) return;
    var res = signalA.map(function (d, i) {
      return d-signalB[i];
    });
    return res;
  };

  function topHatPeaks (signal, windowSize){
    var erosion = operation(signal, windowSize, Math.min);
    var opening = operation(erosion, windowSize, Math.max);
    var topHat = diff(signal, opening);
    return topHat;
  }

})();
