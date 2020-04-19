'use strict';

const _ = require('lodash');
const should = require('should');
const EventType = require('../lib/event-type');

describe('Employee events', () => {

  let Employee, Company, City, ctx;

  //=====================================================================================
  // Init fixture
  //=====================================================================================

  before((done) => {
    require('./fixtures/get-app')('simple-app')((err, app, _ctx) => {
      if (err) return done(err);
      require('../')(app);
      Employee = app.models.Employee;
      Company = app.models.Company;
      City = app.models.City;
      ctx = _ctx;
      done();
    });
  });

  //=====================================================================================
  // Callback style tests
  //=====================================================================================

  it('Event types should be properly initialized', (done) => {
    // Check that general events were initialized
    should.exist(EventType.pool);
    EventType.pool.should.be.an.Object()
      .and.have.properties(['create', 'update', 'remove', 'hired']);
    // Check employee events
    should.exist(Employee.__traceableEventPool);
    // Check that employee meets hired event
    const hireEventType = Employee.getEventType('hired');
    should.exist(hireEventType);
    // Check that employee disabled remove event
    Employee.getEventType('remove').isEnabled().should.be.false();
    done();
  });

  it('Create employee should register create event', async () => {
    const employee = await Employee.create({
      name: 'John Doe',
      address: {city: 'London'},
    });
    ctx.employee = employee;
    const events = await employee.traceEvents.find();
    should.exist(events);
    events.should.be.an.Array().and.have.size(1);
    const event = events[0];
    event.should.have.property('message')
      .and.be.equal('a Employee John Doe was created');
  });

  it('Update employee should register update event', async () => {
    ctx.employee.position = 'senior';
    const employee = await ctx.employee.save();
    const events = await employee.traceEvents.find(true);
    should.exist(events);
    events.should.be.an.Array().and.have.size(2);
    const event = events[0];
    event.should.have.property('message')
      .and.be.equal('a Employee John Doe was updated');
  });

  it('Should register event which is not preset (passing only type)', async () => {
    const event = await ctx.employee.traceEvent('employee-of-the-month');
    should.exist(event);
    event.should.have.property('objectType').and.be.equal('Employee');
    event.should.have.property('objectId').and.be.equal(ctx.employee.id);
  });

  it('Should register event which is not preset (passing options)', async () => {
    const event = await ctx.employee.traceEvent({
      type: 'arrives-late',
      message: '%(objectName)s as arrived %(details.minutes)i minutes late',
      details: {
        minutes: 15,
      },
    });
    should.exist(event);
    event.should.have.property('message').and.be.equal('John Doe as arrived 15 minutes late');
  });

  it('Should register event computing details as a function', async () => {
    const cityName = 'Barcelona';
    const population = 2873000;
    ctx.city = await City.create({
      name: cityName,
      population,
    });
    const event = await ctx.city.traceEvent(City.Event.PopulationChange);
    should.exist(event);
    event.should.have.property('message')
      .and.be.equal(`${cityName} population is now ${population}`);
  });

  it('Should register preset event (passing EventType)', async () => {
    const event = await ctx.employee.traceEvent(Employee.getEventType('hired'));
    should.exist(event);
    event.should.have.property('message')
      .and.be.equal('John Doe has been hired by an undefined company');
  });

  it('Should register preset event (passing only type)', async () => {
    const event = await ctx.employee.traceEvent('hired');
    should.exist(event);
    event.should.have.property('message')
      .and.be.equal('John Doe has been hired by an undefined company');
  });

  it('Should register preset event (passing options)', async () => {
    const event = await ctx.employee.traceEvent({
      type: 'hired',
      details: {
        companyName: 'ALIA Technologies',
      },
    });
    should.exist(event);
    event.should.have.property('message')
      .and.be.equal('John Doe has been hired by ALIA Technologies');
    event.should.have.propertyByPath('details', 'city')
      .and.be.equal('London');
  });

  it('Should retrieve all events for the employee', async () => {
    const events = await ctx.employee.traceEvents.find(true);
    should.exist(events);
    events.should.be.an.Array().and.have.size(7);
  });

  it('Remove employee should not register remove event because it\'s disabled', async () => {
    await ctx.employee.destroy();
    const events = await ctx.employee.traceEvents.find(true);
    should.exist(events);
    events.should.be.an.Array().and.have.size(7);
    const removeEvent = _.find(events, ['type', 'remove']);
    should.not.exist(removeEvent);
  });

  it('Create company should register create event', async () => {
    const company = await Company.create({name: 'ALIA Technologies'});
    ctx.company = company;
    const events = await company.traceEvents.find();
    should.exist(events);
    events.should.be.an.Array().and.have.size(1);
    const event = events[0];
    event.should.have.property('message')
      .and.be.equal('a Company ALIA Technologies was created');
  });

  it('Remove company should not register remove event', async () => {
    await ctx.company.destroy();
    const events = await ctx.company.traceEvents.find(true);
    should.exist(events);
    events.should.be.an.Array().and.have.size(2);
    const event = events[0];
    event.should.have.property('message')
      .and.be.equal('a Company ALIA Technologies was removed');
  });

});
