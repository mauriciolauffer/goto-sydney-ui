sap.ui.define([
  'sap/ui/model/BindingMode',
  'sap/ui/model/json/JSONModel',
  'sap/ui/Device'
], function(BindingMode, JSONModel, Device) {
  'use strict';

  return {
    createDeviceModel: function() {
      const model = new JSONModel(Device);
      model.setDefaultBindingMode(BindingMode.OneWay);
      return model;
    }
  };
});
