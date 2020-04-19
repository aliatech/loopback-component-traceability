'use strict';

/*
 * Expose methods to register events.
 * Copyright (c) 2018. ALIA Technologies S.L.
 * Project: loopback-component-traceability
 * File: lib/event-service.js
 * Author: Juan Costa <juancosta@alialabs.com>
 */

const _ = require('lodash');
const debug = require('../lib/debug').create();
const GeneralEventType = require('../lib/event-type');

module.exports = class EventService {

  /**
   * Get a service instance.
   * @param {Object} app Loopback server instance
   * @param {Object} options Component options
   * @returns {module.EventService}
   */
  static getInstance (app, options) {
    return new EventService(app, options);
  }

  constructor (app, options) {
    this.app = app;
    this.options = options;
  }

  /**
   * Build a new event.
   * @param {ModelEvent|EventType|Object|String} event
   *  ModelEvent instance, EventType instance, data object to build instance, or just event type if string
   * @param {User} [author]
   * @param {Traceable} traceable Model instance
   * @return {Promise<ModelEvent|false>}
   */
  async buildEvent (event, author = null, traceable = null) {
    if (!event) {
      throw new Error('event argument is required');
    }
    let Traceable;
    if (traceable === null) {
      traceable = author;
      author = null;
    }
    if (traceable) {
      Traceable = traceable.constructor;
    }
    const Event = this.app.models.ModelEvent;
    // Build event instance
    if (!(event instanceof Event)) {
      if (_.isString(event) || event instanceof GeneralEventType) {
        event = {type: event};
      }
      if (_.isString(event.type) && Traceable) {
        event.type = _.defaultTo(Traceable.getEventType(event.type), event.type);
      }
      event = Event.getInstance(event);
      if (traceable) {
        event.setObject(traceable);
      }
      event.setAuthor(author);
      return event;
    }
  }

  /**
   * Trace a new event for the object.
   * @param {ModelEvent|EventType|Object|String} event
   *  ModelEvent instance, EventType instance, data object to build instance, or just event type if string
   * @param {User} [author]
   * @param {Traceable} traceable Model instance
   * @return {Promise<ModelEvent|false>}
   */
  async traceEvent (event, author = null, traceable = null) {
    event = await this.buildEvent(event, author, traceable);
    if (!event.isRegistrable()) {
      return false;
    }
    // Save event
    await event.save();
    debug(`${event.objectType} '${event.objectName}' registered event '${event.type}'`);
    return event;
  }

};
