sap.ui.define([
  'sap/ui/model/json/JSONModel',
  'mlauffer/goto/sydney/australia/controller/BaseController'
], function(JSONModel, BaseController) {
  'use strict';

  const Map = BaseController.extend('mlauffer.goto.sydney.australia.controller.NoMap', {
    _target: null
  });

  Map.prototype.onInit = function() {
    this.getRouter().getTarget('noMap').attachDisplay(this._onDisplayTarget, this);
  };

  Map.prototype.onNavBack = function() {
    this.getRouter().getTargets().display(this._target);
  };

  Map.prototype._onDisplayTarget = function(evt) {
    this._target = evt.getParameter('data');
  };

  return Map;
});
