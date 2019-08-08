'use strict';

/*
 * Module initialization as Loopback component.
 * Copyright (c) 2018. ALIA Technologies S.L.
 * Project: loopback-component-traceability
 * File: index.js
 * Author: Juan Costa <juancosta@alialabs.com>
 */

const _ = require('lodash');
const EventType = require('./lib/event-type');
const EventService = require('./lib/event-service');
const Options = require('./lib/options-class');
const debug = require('./lib/debug').create('init');

/**
 * Initialize module as Loopback component.
 * @param {Object} app Loopback app instance
 * @param {Object} componentOptions Loopback component options
 */
const Component = module.exports = function (app, componentOptions = {}) {
  // Attach to app a reference to the component
  app.__traceabilityComponent = Component;

  // Build options
  const options = Options.create(app);
  options.extend(componentOptions);

  // Configure event types
  _.each(options.events, (eventOptions, eventType) => {
    EventType.addType(eventType, eventOptions);
  });

  // Configure service
  Component.service = EventService.getInstance(app, options);

  // Configure model event dynamic relations once it's attached to app
  app.models.ModelEvent.setupRelations(options);

  debug('initialized with component options:');
  debug(options);
};
