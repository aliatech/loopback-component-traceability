'use strict';

/*
 * Traceable Mixin.
 * Copyright (c) 2018. ALIA Technologies S.L.
 * Project: loopback-component-traceability
 * File: mixins/model-traceable.js
 * Author: Juan Costa <juancosta@alialabs.com>
 */

const _ = require('lodash');
const debug = require('../lib/debug').create();
const GeneralEventType = require('../lib/event-type');

/**
 * Become a model traceable.
 * @param {Model} Traceable
 * @param {Object} options
 */

module.exports = (Traceable, options = {}) => {
  //============================================================================================================
  //  SETUP
  //============================================================================================================

  /**
   * Mixin options extended with defaults.
   * @var {Object}
   */
  const mixinOptions = Traceable.__traceableOptions = _.merge({
    displayProperty: 'name',
    events: {
      create: true,
      update: true,
      remove: true,
    },
  }, options);

  /**
   * Pool of custom events for this model.
   * @var {Object}
   */
  const eventPool = Traceable.__traceableEventPool = {};

  // Configure mixin properties and relations once the model is attached to app
  Traceable.on('attached', () => {
    // Define specific custom event types for this model
    _.each(mixinOptions.events, (eventOptions, eventType) => {
      return Traceable.addEventType(eventType, eventOptions);
    });
    // Attach traceEvents relation
    Traceable.hasMany('ModelEvent', {
      description: 'All events related to the object',
      as: 'traceEvents',
      polymorphic: {
        discriminator: 'objectType',
        foreignKey: 'objectId',
      },
      scope: {
        order: 'createdAt desc',
      },
    });
  });

  //============================================================================================================
  //  OPERATION HOOKS
  //============================================================================================================

  // Register create event after save
  Traceable.observe('after save', async (ctx) => {
    const inst = ctx.instance || ctx.currentInstance;
    if (!inst) return;
    if (ctx.isNewInstance) {
      return inst.traceEvent('create');
    } else {
      return inst.traceEvent('update');
    }
  });

  // Register remove event after delete
  Traceable.observe('after delete', async (ctx) => {
    const inst = ctx.instance || ctx.currentInstance;
    if (!inst) return;
    return inst.traceEvent('remove');
  });

  //============================================================================================================
  //  STATIC METHODS
  //============================================================================================================

  /**
   * Get an event type from the pool of customized events of the model or from the general pool.
   * @param {String} typeName
   * @returns {EventType|Boolean} EventType instance or false if the event type doesn't exist or it's disabled for the model
   */
  Traceable.getEventType = function (typeName) {
    const eventType = eventPool[typeName];
    if (eventType === false) return false;
    return eventType || GeneralEventType.getType(typeName);
  };

  /**
   * Register new event type for the model.
   * @param {String} typeName
   * @param {Object|boolean} [typeOptions]
   * @returns {EventType}
   */
  Traceable.addEventType = function (typeName, typeOptions = null) {
    let customEventType;
    const generalEventType = GeneralEventType.getType(typeName);
    if (generalEventType) {
      if (!_.isNil(typeOptions)) {
        if (_.isBoolean(typeOptions)) {
          typeOptions = {enabled: typeOptions};
        }
        customEventType = generalEventType.clone(typeOptions);
      }
    } else {
      customEventType = GeneralEventType.createType(typeName, typeOptions);
    }
    // Attach to model custom event pool
    eventPool[typeName] = customEventType;
  };

  Traceable.traceEvent = async function (...args) {
    return this.getEventService().traceEvent(...args);
  };

  Traceable.getEventService = function () {
    return Traceable.app.__traceabilityComponent.service;
  };

  //============================================================================================================
  //  INSTANCE METHODS
  //============================================================================================================

  /**
   * Trace a new event for the object.
   * @see EventService.traceEvent
   */
  Traceable.prototype.traceEvent = async function (...args) {
    return Traceable.traceEvent(...args, this);
  };
};
