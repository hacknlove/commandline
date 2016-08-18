/* global Meteor, paths, HTTP */

import minimist from 'minimist'
import { Match } from 'meteor/check'
// import { check } from 'meteor/check'

var onlyAdmin = function () {
  if (!Meteor.user() || !Meteor.user().services.hacknlove.admin) {
    throw new Meteor.Error('Not allowed', 'you are not root')
  }
}

Meteor.methods({
  'command-send': function (text, CWD) {
    var response = HTTP.call('POST', Meteor.settings.private.mailgun.url + '/messages', {
      params: {
        from: 'contact@hacknlove.org',
        to: 'antonio@pykiss.com',
        subject: 'contact form',
        text: text
      },
      auth: Meteor.settings.private.mailgun.auth
    })
    if (response.status === 200) {
      return {lines: ['message sended']}
    }
    return {lines: ['something failed']}
  },
  // ONLY ADMIN
  'command-save': function (text, CWD) {
    onlyAdmin()
    if (!Match.test(text, String)) {
      throw new Meteor.Error('Bad params')
    }
    paths.upsert({_id: CWD}, {$set: {text: text}})
    return {lines: ['Text of path <strong>' + CWD + '</strong> saved']}
  },
  'command-create': function (params, cwd) {
    onlyAdmin()
    if (!params.match(/^[a-zA-Z0-9_\-]+$/)) {
      return {lines: [
        'char not allowed',
        'only alfanumeric, dash and underscore'
      ]}
    }
    if (cwd === '/') {
      cwd = ''
    }
    if (paths.findOne({_id: cwd + '/' + params}, {fields: {_id: 1}})) {
      return {lines: ['Path ' + cwd + '/' + params + ' existed yet']}
    }
    paths.insert({_id: cwd + '/' + params})
    return {lines: ['Path ' + cwd + '/' + params + ' created']}
  },
  'command-copy': function (params, cwd) {
    onlyAdmin()
    if (!params.match(/^[a-zA-Z0-9_\-\/]+$/)) {
      return {lines: [
        'char not allowed',
        'only alfanumeric, dash and underscore'
      ]}
    }
    var current = paths.findOne({_id: cwd})
    if (!current) {
      return {lines: [
        'current document not found'
      ]}
    }
    if (cwd === '/') {
      cwd = ''
    }
    if (params[0] !== '/') {
      params = cwd + '/' + params
    }
    if (paths.findOne({_id: params}, {fields: {_id: 1}})) {
      return {lines: ['Path ' + params + ' existed yet']}
    }
    current._id = params
    paths.insert(current)
    return {lines: [
      cwd + ' copied to ' + params
    ]}
  },
  'command-move': function (params, cwd) {
    onlyAdmin()
    if (!params.match(/^[a-zA-Z0-9_\-\/]+$/)) {
      return {lines: [
        'char not allowed',
        'only alfanumeric, dash and underscore'
      ]}
    }
    var current = paths.findOne({_id: cwd})
    if (!current) {
      return {lines: [
        'current document not found'
      ]}
    }
    if (cwd === '/') {
      cwd = ''
    }
    if (params[0] !== '/') {
      params = cwd + '/' + params
    }
    if (paths.findOne({_id: params}, {fields: {_id: 1}})) {
      return {lines: ['Path ' + params + ' existed yet']}
    }
    current._id = params
    paths.remove({_id: current._id})
    paths.insert(current)
    return {lines: [
      cwd + ' moved to ' + params
    ]}
  },
  'command-delete': function (params, CWD) {
    onlyAdmin()
    var args = minimist(params.split(' '), {alias: {r: 'recursive'}})
    params = args._[0] || ''

    if (!params.match(/^[a-zA-Z0-9_\-\/]*$/)) {
      return {lines: [
        'char not allowed',
        'only alfanumeric, dash and underscore'
      ]}
    }

    if (CWD === '/') {
      CWD = ''
    }
    CWD = CWD + '/' + args._[0]
    if (CWD === '/') {
      return {lines: ['Root cannot be removed']}
    }
    if (args.recursive) {
      console.log({_id: {$regex: new RegExp('^' + CWD + '(/.+)?$')}})
      paths.remove({_id: {$regex: new RegExp('^' + CWD + '(/.+)?$')}})
      return {lines: [CWD + ' deleted recursively']}
    } else {
      console.log({_id: CWD})
      paths.remove({_id: CWD})
      return {lines: [CWD + ' deleted']}
    }
  }
})
