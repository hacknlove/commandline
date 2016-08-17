/* global paths: true, Meteor, Package, Accounts */
import { Match } from 'meteor/check'
import { check } from 'meteor/check'

var NpmModuleBcrypt = Package['npm-bcrypt'].NpmModuleBcrypt
var bcryptHash = Meteor.wrapAsync(NpmModuleBcrypt.hash)
var bcryptCompare = Meteor.wrapAsync(NpmModuleBcrypt.compare)

var hashPassword = function (password) {
  return bcryptHash(password, Accounts._bcryptRounds)
}

import minimist from 'minimist'

Meteor.publish('path', function (cwd) {
  return paths.find({_id: cwd})
})

Meteor.publish(undefined, function () {
  return paths.find({private: {$exists: 0}})
})
Meteor.publish(undefined, function () {
  return Meteor.users.find({_id: this.userId}, {fields: {'services.hacknlove.user': 1, 'services.hacknlove.admin': 1}})
})

Meteor.methods({
  'command-ls': function (params) {
    var args = minimist(params.split(' '), {alias: {
      u: 'user'
    }})
    if (!args.user) {
      console.log('no user')
      throw new Meteor.Error('params', 'missing user', 'use: login -u username -p password or login --user=username --password=password')
    }
  }
})

Accounts.registerLoginHandler('hacknlove', function (loginRequest) {
  if (!loginRequest.hacknlove) {
    return
  }
  console.log(loginRequest)

  check(loginRequest.hacknlove.user, String)
  check(loginRequest.hacknlove.password, {digest: String, algorithm: 'sha-256'})

  var password = hashPassword(loginRequest.hacknlove.password.digest)

  var user = Meteor.users.findOne({'services.hacknlove.id': loginRequest.hacknlove.user}, {fields: {_id: 1, 'services.hacknlove.password': 1}})
  if (!user) {
    console.log('no encontrado')
    return new Meteor.Error(403, 'Incorrect user or password')
  }
  if (bcryptCompare(password, user.services.hacknlove.password)) {
    console.log('mala contraseña')
    return new Meteor.Error(403, 'Incorrect user or password')
  }
  return {userId: user._id}
})
Accounts.registerLoginHandler('hacknlover', function (loginRequest) {
  console.log('hacknlover')
  if (!loginRequest.hacknlover) {
    return
  }

  check(loginRequest.hacknlover, {
    user: String,
    password: {digest: String, algorithm: 'sha-256'}
  })

  loginRequest.hacknlover.password = hashPassword(loginRequest.hacknlover.password.digest)

  var user = Meteor.users.findOne({'services.hacknlove.id': loginRequest.hacknlover.user})

  if (user) {
    throw new Meteor.Error('401')
  }
  loginRequest.hacknlover.id = loginRequest.hacknlover.user
  return Accounts.updateOrCreateUserFromExternalService(
    'hacknlove', loginRequest.hacknlover)
})
