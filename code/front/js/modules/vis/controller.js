(function() {
  'use strict';

  angular.module('dynwav')
    .controller( 'dynwav.vis.controller', [
      '$scope',
      '$window',
      'dynwav.data',
      'dynwav.option.service',
      'util',
      visController])
  ;

  function visController($scope,
                         $window,
                         dataService,
                         optionService,
                         util) {
    var self = this;

    self.loading = false;

    self.width = $window.innerWidth-60;

    self.height = $window.innerHeight-60;
    var height12 = self.height/12;
    self.tcHeight = 2*height12-40;
    self.naHeight = 4*height12-40;
    self.nrHeight = 3*height12-60;
    self.tsHeight = 3*height12-60;

    self.grHeight = 12*height12-50;

    self.coordinated = {selected: -1, tr: [0, 0], sc: 1, selectedTime: 1, hovered: -1, hoveredTime: -1, timeRange: [0, 0]};
    self.graphNodesFile = "nodes.json";
    self.graphLinksFile = "edges_" + (self.coordinated.selectedTime) + ".json";
    self.graphFunctionFile = "f.json";
    self.graphWaveletCoeffFile = "wav_coeff.json";
    self.graphClassificationFile = "node_class.json";
    self.statesFile2 = "network_class.json";
    self.timeLabelsFile = "time_labels.json";
    self.timeLabelsDetFile = "time_labels_per_hour.json";

    self.networkDegreeFile = "f_network.json";

    self.updateSignal = updateSignal;

    $scope.$on('handleBroadcast', function () {
      self.coordinated = {selected: -1, tr: [0, 0], sc: 1, selectedTime: 1, hovered: -1, hoveredTime: -1, timeRange: [0, 0]};
      
      self.dataDir = optionService.message.dir;

      self.graphHasLoaded = false;
      self.signalHasLoaded = false;
      self.wavHasLoaded = false;
      self.classHasLoaded = false;
      self.wavMeanHasLoaded = false;
      self.corHasLoaded = false;
      self.graphReady = false;
      self.isNodeSelected = false;
      self.statesHasLoaded = false;

      self.loading = true;

      self.graphSignal = undefined;
      self.currentSignal = undefined;
      self.currentColorScale = undefined;
      self.currentColorScaleType = undefined;
      self.currentDomain = undefined;
      self.wavCurrent = [];

      self.graphLinksFile = "edges_" + (self.coordinated.selectedTime) + ".json";

      self.checkClass = [];

      loadGraph(self);


    });


    $scope.$watch(function () {
      return self.coordinated.selectedTime;
    }, updateSelectedTime);
    $scope.$watch(function () {
      return self.coordinated.hoveredTime;
    }, updateHoveredTime);
    $scope.$watch(function () {
      return self.coordinated.selected;
    }, updateSelectedNode);


    function loadGraph(ctr) {
      dataService.graphNodes(ctr.dataDir + ctr.graphNodesFile).then(function (graph) {
        ctr.graph = graph;
        console.log("num nodes", ctr.graph.nodes.length);
        dataService.graphLinks(ctr.dataDir + ctr.graphLinksFile, ctr.graph.nodes).then(function (links) {
            ctr.graph.links = links;
            ctr.graph.nodes.forEach(function (d, i) {
              d.score = 1;
            });
            loadSignal(ctr);
            loadClassification(ctr);
            loadStates(ctr);
        }).finally(function () {
          ctr.graphHasLoaded = true;
        });
      });
    }

    function loadSignal(ctr) {
      dataService.graphFunction(ctr.dataDir + ctr.graphFunctionFile).then(function (signal) {
        var ex = util.extent(signal);
        ctr.signalDomain = util.linspace(ex[0], ex[1], 8);
        ctr.signalColorScale = colorbrewer.Greens[9].slice(1,9);
        ctr.signal = signal;
        ctr.signalT = d3.transpose(ctr.signal);
        ctr.maxValue = signal.length - 1;
        ctr.signalHasLoaded = true;
      });
    }

    function loadWaveletCoefficients(ctr) {
      dataService.graphFunction(ctr.dataDir + ctr.graphWaveletCoeffFile).then(function (wav) {
        ctr.wav = wav;
        ctr.nScales = ctr.wav.length;
        ctr.classColorScale = ["#fff", '#3b4cc0', '#8caffe', '#ffffbf', '#f49a7b', '#b40426'];
        ctr.classDomain = d3.range(1, 7);
        ctr.colorScale = d3.scale.linear()
          .range(ctr.classColorScale)
          .domain(ctr.classDomain);
        ctr.rangeScales = [];
        for (var i = 0; i < ctr.nScales; ++i) ctr.rangeScales[i] = i;
        ctr.wavDomain = [-1, 0, 1];
        ctr.wavColorScale = colorbrewer.RdBu[3];

        ctr.wavHasLoaded = true;
        ctr.loading = false;

        updateSignal(0);
      });
    }

    function loadStates(ctr) {
      dataService.plain(ctr.dataDir + ctr.statesFile2).then(function (ncl) {
        ctr.states = ncl;
        ctr.statesDomain = d3.range(1, 7);
        ctr.numStates = ctr.statesDomain.length;
        ctr.statesColorScale = ["#fff", '#3b4cc0', '#8caffe', '#ffffbf', '#f49a7b', '#b40426'];
        loadTimeLabels(ctr);
      });
    }


    function loadTorque(ctr) {
      dataService.graphFunction(ctr.dataDir + ctr.torqueFile).then(function (tor) {
        ctr.torque = d3.transpose(tor);
      }).finally(function () {
        ctr.torqueHasLoaded = true;
      });

    }


    function loadClassification(ctr) {
      dataService.graphFunction(ctr.dataDir + ctr.graphClassificationFile).then(function (classification) {
        ctr.classification = classification;
        ctr.classificationT = d3.transpose(ctr.classification);
        ctr.sclass = util.histogram(classification);
        loadWaveletCoefficients(ctr);
      }).finally(function () {
        ctr.classHasLoaded = true;
      });
    }

    function loadTimeLabels(ctr) {
      dataService.plain(ctr.dataDir + ctr.timeLabelsFile).then(function (timeLabels) {
        ctr.timeLabels = timeLabels;
        ctr.coordinated.timeRange[0] = 0;
        ctr.coordinated.timeRange[1] = ctr.timeLabels.length - 1;
        dataService.plain(ctr.dataDir + ctr.timeLabelsDetFile).then(function (timeLabelsDet) {
          ctr.toolTips = [];
          for (var i = 0; i < timeLabelsDet.length; ++i) {
            if (timeLabelsDet[i] == timeLabels[i])
              ctr.toolTips.push(timeLabelsDet[i]);
            else
              ctr.toolTips.push(timeLabels[i] + " " + timeLabelsDet[i]);
          }
          loadNetworkDegree(ctr);
        });
      });
    }


    function loadNetworkDegree(ctr) {
      dataService.plain(ctr.dataDir + ctr.networkDegreeFile).then(function (networkDegree) {
        ctr.networkDegree = networkDegree;
      }).finally(function () {
        ctr.statesHasLoaded = true;
      });
    }

    function updateHoveredTime(value) {
      if(value>=0)
        updateSelectedTime(value);
      else
        updateSelectedTime(self.coordinated.selectedTime);
    }

    function updateHoveredNode(value) {
      if(value>=0)
        updateSelectedNode(value);
      else
        updateSelectedNode(self.coordinated.selected);
    }

    function updateSelectedTime(value) {
      if (self.classHasLoaded && self.wavHasLoaded) {
        value = parseInt(value);
        self.currentSignal = self.graphSignal[value];
        self.currentClass = self.classification[value];
        self.graphLinksFile = "edges_" + (value) + ".json";
        dataService.graphLinks(self.dataDir + self.graphLinksFile, self.graph.nodes).then(function (links) {
          self.graph.links = links;
          if (self.isNodeSelected) {
            self.selectedCoeff = [];
            self.wav.forEach(function (wj) {
              self.selectedCoeff.push(wj[self.coordinated.selectedTime][self.coordinated.selected])
            });
            self.selectedCoeffColor = self.colorScale(self.classificationT[self.coordinated.selected][self.coordinated.selectedTime]);
          }
        }).finally(function () {
          self.wav.forEach(function (d, i) {
            self.wavCurrent[i] = d[value];
          });
          self.graphReady = true;
        });
      }
    }

    function updateSignal(option) {
      if (self.classHasLoaded && self.graphHasLoaded) {
        console.log("updating signal");
        self.currentSignalOption = option;
        if (option === 0) {
          self.graphSignal = self.signal;
          self.currentDomain = self.signalDomain;
          self.currentColorScale = self.signalColorScale;
          self.currentColorScaleType = 0;
          self.graphColorBar = true;
        } else if (option === 1) {
          self.graphSignal = self.classification;
          self.currentDomain = self.classDomain;
          self.currentColorScale = self.classColorScale;
          self.currentColorScaleType = 1;
          self.graphColorBar = false;
        }
        updateSelectedTime(self.coordinated.selectedTime);
      }
    }

    function updateSelectedNode(value) {
      if (self.graphReady && value != -1) {

        self.functionY = self.signalT[value];
        self.functionC = self.classificationT[value];

        self.selectedCoeff = [];
        self.wav.forEach(function (wj) {
          self.selectedCoeff.push(wj[self.coordinated.selectedTime][value])
        });
        self.selectedCoeffColor = self.colorScale(self.classificationT[value][self.coordinated.selectedTime]);

        self.isNodeSelected = true;
      } else
        self.isNodeSelected = false;
    }
  }

}());