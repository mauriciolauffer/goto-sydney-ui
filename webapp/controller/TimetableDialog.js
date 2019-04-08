sap.ui.define([
  'sap/ui/core/Fragment',
  'sap/ui/core/MessageType',
  'sap/ui/core/mvc/Controller',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator',
  'sap/ui/model/json/JSONModel',
  'mlauffer/goto/sydney/australia/model/formatter'
], function(Fragment, MessageType, Controller, Filter, FilterOperator, JSONModel, formatter) {
  'use strict';

  const DateFormatOptions = { weekday: 'long'};
  const i18nDateFormat = new Intl.DateTimeFormat('en-GB', DateFormatOptions);

  const TimetableDialog = Controller.extend('mlauffer.goto.sydney.australia.controller.TimetableDialog', {
    _view: null,
    _timetableDialog: null
  });

  /**
   * Convenience method for destroying the object.
   * @public
   */
  TimetableDialog.prototype.destroy = function() {
    this.formatter = null;
    this._view = null;
    this._timetableDialog.destroy();
    this._timetableDialog = null;
  };



  TimetableDialog.prototype.open = function(view) {
    if (!this._timetableDialog) {
      this._createTimetableDialog(view);
    } else {
      this._openTimetableDialog();
    }
  };

  TimetableDialog.prototype._createTimetableDialog = function(view) {
    const url = sap.ui.require.toUrl('mlauffer/goto/sydney/australia/view/');
    this._view = view;
    fetch(url + 'TimetableDialog.fragment.xml')
      .then(function(response) {
        return response.text();
      })
      .then(function(fragmentDefinition) {
        return Fragment.load({
          id: 'timetableDialogFragment',
          name: 'mlauffer.goto.sydney.australia.view.TimetableDialog',
          controller: view.getController(),
          definition: fragmentDefinition
        });
      })
      .then(function(dialog) {
        this._timetableDialog = dialog;
        const model = new JSONModel({
          filterBarLabel: null,
          dialogTitle: null
        });
        this._timetableDialog.setModel(model, 'timetableView');
        view.addDependent(this._timetableDialog);
        this._openTimetableDialog();
      }.bind(this));
  };

  TimetableDialog.prototype._openTimetableDialog = function() {
    this._filterTimetable();
    this._setTimetableIcon();
    this._setTimetableTitle();
    this._timetableDialog.open();
  };

  TimetableDialog.prototype._setTimetableTitle = function() {
    const stop = this._view.getModel().getProperty(this._view.getController().getSelectedStopPath());
    if (stop) {
      const title = this._view.getController().getResourceBundle().getText('timetableTitle', [stop.stop_code, stop.stop_name]);
      this._timetableDialog.getModel('timetableView').setProperty('/dialogTitle', title);
    } else {
      this._timetableDialog.getModel('timetableView').setProperty('/dialogTitle', '');
    }
  };

  TimetableDialog.prototype._setTimetableIcon = function() {
    const route = this._view.getModel().getProperty(this._view.getController().getSelectedRoutePath());
    this._timetableDialog.setIcon(formatter.getNswModalIcon(route.route_type));
  };

  TimetableDialog.prototype._filterTimetable = function() {
    const filters = [];
    const date = new Date();
    const weekday = i18nDateFormat.format(date);
    const filterLabel = weekday + ', ' + date.toLocaleDateString('en-GB');
    const calendar = this._view.getModel().getProperty('/Calendar').filter(function(item) {
      return item[weekday.toLowerCase()] === '1';
    });
    const table = Fragment.byId('timetableDialogFragment', 'timetable');
    const selectedTrip = this._view.getModel().getProperty(this._view.getController().getSelectedTripPath());
    if (!selectedTrip) {
      return;
    }
    const stop = this._view.getModel().getProperty(this._view.getController().getSelectedStopPath());
    if (stop) {
      filters.push(new Filter('stop_id', FilterOperator.EQ, stop.stop_id));
    }
    this._timetableDialog.getModel('timetableView').setProperty('/filterBarLabel', filterLabel);
    this._view.getModel().getProperty('/Trips').filter(function(trip) {
      return trip.route_id === selectedTrip.route_id && trip.direction_id === selectedTrip.direction_id
        && calendar.some(function(item) {
          return item.service_id === trip.service_id;
        });
    })
      .forEach(function(trip) {
        filters.push(new Filter('trip_id', FilterOperator.EQ, trip.trip_id));
      });
    table.getBinding('items').filter(filters, 'Application');
  };

  TimetableDialog.prototype.onTimeTableUpdateFinished = function(evt) {
    evt.getSource().getItems().forEach(function(item) {
      const highlight = (formatter.getDiffTime(item.getBindingContext().getObject().arrival_time) < 0)
        ? MessageType.None : MessageType.Information;
      item.setHighlight(highlight);
    });
  };

  TimetableDialog.prototype.onCloseTimetableDialog = function() {
    if (this._view.getViewName() === 'mlauffer.goto.sydney.australia.view.Stops') {
      this._view.byId('list').removeSelections(true);
    }
  };

  TimetableDialog.prototype.onOpenTimetableDialog = function() {
    let nextTripIndex;
    const table = Fragment.byId('timetableDialogFragment', 'timetable');
    const items = table.getItems();
    const nextTrip = items.find(function(item, i) {
      nextTripIndex = i - 1;
      return formatter.getDiffTime(item.getBindingContext().getObject().arrival_time) >= 0;
    });
    if (nextTrip && items.length > 4) {
      setTimeout(function() {
        items[nextTripIndex].getDomRef().scrollIntoView(true);
      }, 200);
    }
  };

  return TimetableDialog;
});
