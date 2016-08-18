/* global Accounts, lines, localMethods: true, paths, FlowRouter, $, Meteor */
import minimist from 'minimist'
import { Match } from 'meteor/check'
// import { check } from 'meteor/check'

localMethods = {}

localMethods.clean = function () {
  lines.remove({})
}
localMethods.echo = function (params) {
  lines.insert({text: params})
}
localMethods.login = function (params) {
  params = params || ''
  var args = minimist(params.split(' '), {alias: {
    u: 'user', 'p': 'password'
  }})
  if (!Match.test(args, Match.ObjectIncluding({
    user: String,
    password: String
  }))) {
    return {lines: ['Bad params']}
  }
  return Accounts.callLoginMethod({
    methodArguments: [{hacknlove: {
      user: args.user,
      password: Accounts._hashPassword(args.password)
    }}]
  }, function (error, response) {
    console.log(error, response)
  })
}
localMethods.logout = function (params) {
  Meteor.logout()
}
localMethods.edit = function (params, CWD) {
  if (!Meteor.user() || !Meteor.user().services.hacknlove.admin) {
    return {lines: ['Not allowed, only root']}
  }
  if ($('textarea').length) {
    $('textarea.edit').focus()
  } else {
    var text = (paths.findOne({_id: CWD}, {fields: {text: 1}}) || {}).text || ''
    return {lines: ['<textarea class="edit">' + text + '</textarea>']}
  }
}
localMethods.save = function (params, CWD) {
  if (!$('textarea.edit').length) {
    return {lines: ['Nothing to save']}
  }
  Meteor.call('command-save', $('textarea.edit').val(), CWD, function (error, response) {
    if (error) {
      console.log(error)
      lines.insert({text: error.message})
      lines.insert({text: error.details})
      return
    }
    response.lines = response.lines || []
    response.lines.forEach(function (line) {
      lines.insert({text: line})
    })
    $('textarea').remove()
  })
}
localMethods.send = function (params, CWD) {
  if (!$('textarea.contact').length) {
    return {lines: ['Nothing to send']}
  }
  Meteor.call('command-send', $('textarea.contact').val(), CWD, function (error, response) {
    if (error) {
      console.log(error)
      lines.insert({text: error.message})
      lines.insert({text: error.details})
      return
    }
    response.lines = response.lines || []
    response.lines.forEach(function (line) {
      lines.insert({text: line})
    })
    $('textarea').remove()
  })
}
localMethods.cancel = function (params, CWD) {
  if (!$('textarea').length) {
    return {lines: ['Nothing to cancel']}
  }
  $('textarea').remove()
}

localMethods.follow = function (params) {
  params = params.trim()
  var line = lines.findOne({text: {$regex: new RegExp('> *' + params + ' *</a>')}})
  if (!line) {
    return {lines: ['Link not found']}
  }
  var a = line.text.match(new RegExp('<a([^>]*)> *' + params + ' *<'))
  if (!a[1]) {
    return {lines: ['Link not found']}
  }
  a = a[1].match(/href *= *("[^""]*")/)
  $('a[href=' + a[1] + ']')[0].click()
}
localMethods.help = function (params) {
  if (Meteor.user()) {
    return {lines: [
      'Commands availables:',
      'cancel, clean, contact, copy, create, download, edit, follow, goto, help, list, login, logout, move, register, reload, save, send, up',
      ''
      //    '<strong>help command</strong> shows the help of the command'
    ]}
  }
  return {lines: [
    'Commands availables:',
    'cancel, clean, contact, follow, goto, help, list, login, register, reload, send, up',
    ''
    //    '<strong>help command</strong> shows the help of the command'
  ]}
}

localMethods.register = function (params) {
  return {lines: [
    'Registrations are closed, if you want to become a hacknlove member, please contact'
  ]}
}

localMethods.reload = function (params, CWD) {
  var text = (paths.findOne({_id: CWD}, {fields: {text: 1}}) || {}).text || ''
  return {lines: [text]}
}

localMethods.list = function (params, CWD) {
  var ls
  if (CWD === '/') {
    CWD = ''
  }
  var endregex
  var args = minimist(params.split(' '), {alias: {r: 'recursive'}})
  if (args.recursive) {
    endregex = ''
  } else {
    endregex = '/[^\/]+$'
  }
  ls = paths.find({_id: {$regex: new RegExp('^' + CWD + endregex)}}, {fields: {_id: 1}}).map(function (path) {
    return '<span class="goto">' + path._id + '</span>'
  })
  return {lines: [ls.join(' ')]}
}

localMethods.up = function (params, CWD) {
  CWD = CWD.replace(/\/[^\/]*$/, '')
  FlowRouter.go('/' + CWD)
  return {lines: [CWD || '/']}
}
localMethods.goto = function (params, CWD) {
  if (!params.match(/^[a-zA-Z0-9_\-\/]+$/)) {
    return {lines: [
      'char not allowed',
      'only alfanumeric, dash and underscore'
    ]}
  }
  if (CWD === '/') {
    CWD = ''
  }
  if (params[0] !== '/') {
    params = CWD + '/' + params
  }
  if (!paths.findOne({_id: params})) {
    return {lines: [
      'Path ' + params + ' not found'
    ]}
  }
  FlowRouter.go(params)
  return {lines: [params]}
}

localMethods.contact = function (params, CWD) {
  if ($('textarea').length) {
    $('textarea').focus()
  } else {
    return {lines: ['<textarea class="contact">Use the command send, when you finished.\n-Name: \n-Email:\n-Message:</textarea>']}
  }
}
/* todo
  download
  help
*/
