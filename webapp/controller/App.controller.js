sap.ui.define([
  'sap/base/Log',
  'sap/m/BusyDialog',
  'sap/m/MessageToast',
  'sap/ui/model/json/JSONModel',
  'mlauffer/goto/sydney/australia/controller/BaseController'
], function(Log, BusyDialog, MessageToast, JSONModel, BaseController) {
  'use strict';

  const viewModelName = 'appView';
  const App = BaseController.extend('mlauffer.goto.sydney.australia.controller.App', {});

  App.prototype.onInit = function() {
    this.createViewModel(viewModelName, {
      busy: true
    });

    const model = this.getModel();
    const title = this.getResourceBundle().getText('errorLoadingData');
    model.read('/agency', '/Agency')
      .then(function() {
        return Promise.all([
          model.read('/routes', '/Routes'),
          model.read('/trips', '/Trips'),
          model.read('/tripdirections', '/TripDirections')
        ]);
      })
      .then(function() {
        return Promise.all([
          model.read('/stops', '/Stops'),
          model.read('/stoptimes', '/StopTimes'),
          model.read('/calendar', '/Calendar')
        ]);
      })
      .then(function() {
        Log.info('Data selected from API');
        this.setStopMapMarkers(model.getProperty('/Stops'));
        this.displayMarkers();
      }.bind(this))
      .catch(function(err) {
        MessageToast.show(title);
        Log.error(title);
        Log.error(err.statusText);
      })
      .finally(function() {
        this.setAppBusy(false);
      }.bind(this));
  };

  /**
   * Set app busy status.
   * @function
   * @public
   * @param {boolean} busy App busy status
   */
  App.prototype.setAppBusy = function(busy) {
    this.getModel(viewModelName).setProperty('/busy', busy);
  };

  return App;
});
