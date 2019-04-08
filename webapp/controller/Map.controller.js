sap.ui.define([
  'sap/ui/model/json/JSONModel',
  'mlauffer/goto/sydney/australia/controller/BaseController'
], function(JSONModel, BaseController) {
  'use strict';

  const viewModelName = 'mapView';
  const Map = BaseController.extend('mlauffer.goto.sydney.australia.controller.Map', {
    _target: null
  });

  Map.prototype.onInit = function() {
    this.createViewModel(viewModelName, {
      busy: true
    });
    this.getRouter().getTarget('map').attachDisplay(this._onDisplayTarget, this);
    this.getView().addEventDelegate({
      onBeforeShow: function() {
        if (!this.isGoogleMapsLoaded()) {
          this.getRouter().getTargets().display('noMap');
        }
      }
    }, this);
  };

  Map.prototype.onAfterRendering = function() {
    this.initMap(this.getView().byId('mapCanvas').getDomRef().id);
    this.getModel(viewModelName).setProperty('/busy', false);
  };

  Map.prototype.onNavBack = function() {
    this.getRouter().getTargets().display(this._target);
  };

  Map.prototype._onDisplayTarget = function(evt) {
    this.byId('mapCanvas').focus();
    setTimeout(this.displayMarkers.bind(this), 300);
    this._target = evt.getParameter('data');
  };

  return Map;
});
