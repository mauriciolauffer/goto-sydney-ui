sap.ui.define([
  'sap/base/Log',
  'sap/m/MessageToast',
  'sap/ui/core/mvc/Controller',
  'sap/ui/core/routing/History',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator',
  'sap/ui/model/json/JSONModel',
  'mlauffer/goto/sydney/australia/controller/TimetableDialog',
  'mlauffer/goto/sydney/australia/model/formatter'
], function(Log, MessageToast, Controller, History, Filter, FilterOperator, JSONModel, TimetableDialog, formatter) {
  'use strict';

  let map;
  let mapHasLoaded = false;
  let selectedRoutePath;
  let selectedTripPath;
  let selectedStopPath;
  let realtimeIntervalId;
  let stopMapMarkers = [];
  let vehicleMapMarkers = [];
  const appRootPath = sap.ui.require.toUrl('mlauffer/goto/sydney/australia/');

  const BaseController = Controller.extend('mlauffer.goto.sydney.australia.controller.BaseController', {
    _logger: (this.getOwnerComponent && this.getOwnerComponent()) ? this.getOwnerComponent()._logger : null,
    _timetableDialog: new TimetableDialog(),
    formatter: formatter
  });

  /**
   * Convenience method for destroying the object.
   * @public
   */
  BaseController.prototype.destroy = function() {
    this._logger = null;
    this.formatter = null;
    this._timetableDialog.destroy();
    this._timetableDialog = null;
  };

  /**
   * Convenience method for accessing the router in every controller of the application.
   * @public
   * @returns {sap.ui.core.routing.Router} the router for this component
   */
  BaseController.prototype.getRouter = function() {
    return this.getOwnerComponent().getRouter();
  };

  /**
   * Convenience method for getting the view model by name in every controller of the application.
   * @public
   * @param {string} sName the model name
   * @returns {sap.ui.model.Model} the model instance
   */
  BaseController.prototype.getModel = function(sName) {
    return this.getView().getModel(sName);
  };

  /**
   * Convenience method for setting the view model in every controller of the application.
   * @public
   * @param {sap.ui.model.Model} oModel the model instance
   * @param {string} sName the model name
   * @returns {sap.ui.mvc.View} the view instance
   */
  BaseController.prototype.setModel = function(oModel, sName) {
    return this.getView().setModel(oModel, sName);
  };

  /**
   * Convenience method for getting the resource bundle.
   * @public
   * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
   */
  BaseController.prototype.getResourceBundle = function() {
    return this.getOwnerComponent()._custom.resourceBundle;
    //return this.getOwnerComponent().getModel('i18n').getResourceBundle();
  };

  /**
   * Event handler for navigating back.
   * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
   * If not, it will replace the current entry of the browser history with the master route.
   * @function
   * @public
   */
  BaseController.prototype.onNavBack = function() {
    let target;
    switch (this.getView().getViewName()) {
      case 'mlauffer.goto.sydney.australia.view.Stops':
        target = 'trips';
        selectedStopPath = null;
        selectedTripPath = null;
        break;
      case 'mlauffer.goto.sydney.australia.view.Trips':
        target = 'master';
        selectedTripPath = null;
        selectedRoutePath = null;
        break;
      default:
        if (selectedStopPath) {
          target = 'stops';
        } else if (selectedTripPath) {
          target = 'trips';
        } else {
          target = 'master';
        }
    }
    this.getRouter().getTargets().display(target);
  };

  /**
   * Creates a model to handle view parameters.
   * @function
   * @public
   * @param {string} viewModelName view model name to be set
   * @param {object} attributes view attributes to be handled by a model
   * @return {sap.ui.model.json.JSONModel} JSON Model with view attributes
   */
  BaseController.prototype.createViewModel = function(viewModelName, attributes) {
    const model = new JSONModel(attributes);
    this.setModel(model, viewModelName);
    return model;
  };

  BaseController.prototype.initMap = function(id) {
    if (this.isGoogleMapsLoaded()) {
      const sydney = { lat: -33.847927, lng: 150.999655 };
      const limits = { north: -32.5, south: -34.5, west: 150, east: 152 };
      map = new google.maps.Map(document.getElementById(id), {
        zoom: 10,
        center: sydney,
        restriction: { latLngBounds: limits}
      });
      google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
        mapHasLoaded = true;
        this.displayMarkers();
      }.bind(this));
    } else {
      Log.error('Google Maps not loaded!');
    }
  };

  BaseController.prototype.isGoogleMapsLoaded = function() {
    return (window.google && window.google.maps);
  };

  BaseController.prototype.setStopMapMarkers = function(stops) {
    if (this.isGoogleMapsLoaded() && stops && stops.length > 0) {
      stopMapMarkers.forEach(function(marker) {
        marker.setMap(null);
        marker = null;
      });
      stopMapMarkers = [];
      stops.forEach(function(stop) {
        const position = new google.maps.LatLng(stop.stop_lat, stop.stop_lon);
        const title = stop.stop_code + ' - ' + stop.stop_name;
        const marker = new google.maps.Marker({ position: position, title: title, icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' });
        marker.addListener('click', function() {
          if (selectedTripPath) {
            this.getRouter().getViews().getView({viewName:'mlauffer.goto.sydney.australia.view.Stops'})
              .then(function(view) {
                const stopItem = view.byId('list').getItems()
                  .find(function(item) {
                    return item.getIntro() === stop.stop_id;
                  });
                if (stopItem) {
                  stopItem.setSelected(true);
                  stopItem.firePress();
                }
              });
          } else {
            MessageToast.show(this.getResourceBundle().getText('stopInfo', [stop.stop_code, stop.stop_name]));
          }
        }.bind(this));
        stopMapMarkers.push(marker);
      }.bind(this));
    }
  };

  BaseController.prototype.displayMarkers = function() {
    if (map && mapHasLoaded) {
      stopMapMarkers.forEach(function(marker) {
        marker.setMap(map);
      });
      vehicleMapMarkers.forEach(function(marker) {
        marker.setMap(map);
      });
      setTimeout(this.setMapBounds.bind(this), 200);
    }
  };

  BaseController.prototype.setVehicleMapMarkers = function(realtimeTrips) {
    if (this.isGoogleMapsLoaded() && realtimeTrips && realtimeTrips.length > 0) {
      vehicleMapMarkers.forEach(function(marker) {
        marker.setMap(null);
        marker = null;
      });
      vehicleMapMarkers = [];
      realtimeTrips.filter(function(trip) {
        return (trip.vehicle);
      })
        .forEach(function(trip) {
          const vehiclePosition = trip.vehicle.vehicle.position;
          const vehicle = trip.vehicle.vehicle.vehicle;
          const position = new google.maps.LatLng(vehiclePosition.latitude, vehiclePosition.longitude);
          const title = vehicle.id + ' - ' + vehicle.label;
          const marker = new google.maps.Marker({ position: position, title: title, icon: appRootPath + 'images/boat.png' });
          marker.addListener('click', function() {
            MessageToast.show(title);
          });
          vehicleMapMarkers.push(marker);
        });
      vehicleMapMarkers.forEach(function(marker) {
        marker.setMap(map);
      });
    }
  };

  BaseController.prototype.setMapBounds = function() {
    if (map) {
      const bounds = new google.maps.LatLngBounds();
      if (stopMapMarkers.length > 0) {
        stopMapMarkers.forEach(function(marker) {
          bounds.extend(marker.getPosition());
        });
        map.setCenter(bounds.getCenter());
        map.fitBounds(bounds);
      }
    }
  };

  BaseController.prototype.getMapMarkers = function() {
    return stopMapMarkers;
  };

  BaseController.prototype.getSelectedRoutePath = function() {
    return selectedRoutePath;
  };

  BaseController.prototype.getSelectedTripPath = function() {
    return selectedTripPath;
  };

  BaseController.prototype.getSelectedStopPath = function() {
    return selectedStopPath;
  };

  BaseController.prototype.setSelectedRoutePath = function(path) {
    selectedRoutePath = path;
  };

  BaseController.prototype.setSelectedTripPath = function(path) {
    selectedTripPath = path;
  };

  BaseController.prototype.setSelectedStopPath = function(path) {
    selectedStopPath = path;
  };

  BaseController.prototype.setRealtimeRoute = function(routeId) {
    this._getRealtimeRouteInfo(routeId);
  };

  BaseController.prototype._getRealtimeRouteInfo = function(routeId) {
    if (!this.getOwnerComponent()._custom.isOffline) {
      const model = this.getModel();
      const setMarker = this.setVehicleMapMarkers.bind(this);
      const message = this.getResourceBundle().getText('tripsLoadingRealtime');
      const _fetchRealtime = function() {
        MessageToast.show(message);
        model.read('/realtime?routeId=' + routeId, '/RealtimeTrips')
          .then(function() {
            setMarker(model.getProperty('/RealtimeTrips'));
          });
      };
      setTimeout(_fetchRealtime.bind(this), 200);
      clearInterval(realtimeIntervalId);
      realtimeIntervalId = setInterval(_fetchRealtime, 60000 * 2);
    }
  };

  BaseController.prototype.openTimetableDialog = function() {
    this._timetableDialog.open(this.getView());
  };

  BaseController.prototype.onTimeTableUpdateFinished = function(evt) {
    this._timetableDialog.onTimeTableUpdateFinished(evt);
  };

  BaseController.prototype.onCloseTimetableDialog = function(evt) {
    this._timetableDialog.onCloseTimetableDialog(evt);
  };

  BaseController.prototype.onOpenTimetableDialog = function(evt) {
    this._timetableDialog.onOpenTimetableDialog(evt);
  };

  BaseController.prototype.onPressCloseTimetableDialog = function() {
    this._timetableDialog._timetableDialog.close();
  };



  /**
   * Gets all stops by Route ID
   * @function
   * @private
   * @param {string} routeId Route ID to be used to select the stops
   * @return {array} stops List of Stops
   */
  BaseController.prototype.getStopsByRoute = function(routeId) {
    const trips = this.getModel().getProperty('/Trips')
      .filter(function(trip) {
        return trip.route_id === routeId;
      });
    return this._getStops(trips);
  };

  /**
   * Gets all stops by Route ID + Trip Direction
   * @function
   * @private
   * @param {string} routeId Route ID to be used to select the stops
   * @param {string} tripDirection Trip Direction to be used to select the stops
   * @return {array} stops List of Stops
   */
  BaseController.prototype.getStopsByRouteTripDirection = function(routeId, tripDirection) {
    const trips = this.getModel().getProperty('/Trips')
      .filter(function(trip) {
        return trip.route_id === routeId && trip.direction_id === tripDirection;
      });
    return this._getStops(trips);
  };

  BaseController.prototype._getStops = function(trips) {
    const stops = this.getModel().getProperty('/Stops');
    const stopTimes = this.getModel().getProperty('/StopTimes');
    return stopTimes
      .filter(function(stopTime) {
        return trips.some(function(trip) {
          return stopTime.trip_id === trip.trip_id;
        });
      })
      .map(function(stopTime) {
        return stopTime.stop_id;
      })
      .filter(function(stopId, i, self) {
        return i === self.indexOf(stopId);
      })
      .map(function(stopId) {
        return stops.find(function(stop) {
          return stop.stop_id === stopId;
        });
      });
  };

  BaseController.prototype.onPressOffline = function() {
    MessageToast.show(this.getResourceBundle().getText('btOfflineTooltip'));
  };

  return BaseController;
});
