'use strict';

module.exports = (City) => {

  const Event = City.Event = {
    PopulationChange: 'CityPopulationChange',
  };

  City.configTraceable = function () {
    return {
      events: {
        [Event.PopulationChange]: {
          message: '%(objectName)s population is now %(details.population)i',
          details: (city) => {
            return {population: city.population};
          },
        },
        create: false, // Disable automatic create event
        update: false, // Disable automatic update event
        remove: false, // Disable automatic remove event
      },
    };
  };

};
