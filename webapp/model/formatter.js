sap.ui.define([
  'sap/ui/core/MessageType'
], function(MessageType) {
  'use strict';

  const appRootPath = sap.ui.require.toUrl('mlauffer/goto/sydney/australia/');

  return {
    getModalIcon: function(routeType) {
      return this.formatter.getNswModalIcon(routeType);
    },

    getNswModalIcon: function(routeType) {
      let icon;
      switch (routeType) {
        case '0' || '1':
          icon = 'images/nsw-lightrail.png';
          break;
        case '2':
          icon = 'images/nsw-train.png';
          break;
        case '3':
          icon = 'images/nsw-bus.png';
          break;
        case '4':
          icon = 'images/nsw-ferry.png';
          break;
        default:
      }
      return appRootPath + icon;
    },

    getNswModalIconByTripId: function(tripId) {
      return this.formatter.getNswModalIcon(this.formatter._getTripRoute(this.getModel(), tripId).route_type);
    },

    _getTripRoute: function(model, tripId) {
      const trip = model.getProperty('/Trips')
        .find(function(trip) {
          return trip.trip_id === tripId;
        });
      return model.getProperty('/Routes')
        .find(function(route) {
          return route.route_id === trip.route_id;
        });
    },

    getTripRoute: function(tripId) {
      return this._getTripRoute(this.getModel(), tripId);
    },

    getTripRouteShortName: function(tripId) {
      const route = this.formatter._getTripRoute(this.getModel(), tripId);
      return route.route_short_name;
    },

    getTripHeadsign: function(tripId) {
      return this.getModel().getProperty('/Trips').find(function(trip) {
        return trip.trip_id === tripId;
      }).trip_headsign;
    },

    hasAccessibilityAccess: function(accessibility) {
      return (accessibility) ? appRootPath + 'images/wheelchair.png' : '';
    },

    setLineHighlight: function(arrivalTime) {
      return (this.getDiffTime(arrivalTime) < 0) ? MessageType.Information : MessageType.None;
    },

    getTimeLeftForArrival: function(arrivalTime) {
      let timeLeft;
      let minutes;
      const arrivalHourMinuteSecond = arrivalTime.split(':');
      const arrival = new Date();
      const now = new Date();
      arrival.setHours(arrivalHourMinuteSecond[0], arrivalHourMinuteSecond[1]);
      const hours = arrival.getHours() - now.getHours();
      if (hours > 0) {
        timeLeft = hours + ' hrs';
      } else {
        minutes = arrival.getMinutes() - now.getMinutes();
        timeLeft = minutes + ' mins';
      }
      return timeLeft;
    },

    getDiffTime: function(time) {
      const timeHourMinuteSecond = time.split(':');
      const arrival = new Date();
      const now = new Date();
      arrival.setHours(timeHourMinuteSecond[0], timeHourMinuteSecond[1]);
      return arrival.getTime() - now.getTime();
    },

    getDiffHours: function(time) {
      const timeHourMinuteSecond = time.split(':');
      const arrival = new Date();
      const now = new Date();
      arrival.setHours(timeHourMinuteSecond[0], timeHourMinuteSecond[1]);
      return arrival.getHours() - now.getHours();
    },

    getDiffMinutes: function(time) {
      const timeHourMinuteSecond = time.split(':');
      const arrival = new Date();
      const now = new Date();
      arrival.setHours(timeHourMinuteSecond[0], timeHourMinuteSecond[1]);
      return arrival.getMinutes() - now.getMinutes();
    },

    formatTime: function(arrivalTime) {
      const time = arrivalTime.split(':');
      return [time[0], time[1]].join(':');
    }
  };
});
