/* global Template, Meteor, lines: true, env: true, before: true, after: true, localMethods, $*/
var isMobile = function () {
  return 'ontouchstart' in document.documentElement
}

Template.lines.helpers({
  line: function () {
    return lines.find()
  }
})
Template.lines.events({
  'blur textarea': function () {
    $('input').attr('tabindex', -1).focus().click()
  }
})

Tracker.autorun(function () {
  lines.find().count()
  window.scrollTo(0, 99999999999999999999999999999999999999999)
})

setInterval(function () {
  env.update({_id: 'time'}, {$set: {value: (new Date() + '').match(/..:..:../)[0]}})
}, 1000)

Template.command.helpers({
  hora: function () {
    return env.findOne({_id: 'time'}).value
  },
  env: function (key) {
    return (env.findOne({_id: key, private: {$exists: 0}}) || {value: ''}).value
  },
  server: function () {
    return Meteor.settings.public.servername
  },
  user: function () {
    var user = Meteor.user() || {services: {hacknlove: {user: 'guest'}}}
    return user.services.hacknlove.user
  },
  mobile: isMobile
})
Template.current.helpers({
  pre: function () {
    var current = env.findOne({_id: 'current'}).value
    var pos = env.findOne({_id: 'pos'}).value
    return current.slice(0, pos)
  },
  post: function () {
    var current = env.findOne({_id: 'current'}).value
    var pos = env.findOne({_id: 'pos'}).value
    return current.slice(pos + 1)
  },
  cursor: function () {
    var current = env.findOne({_id: 'current'}).value
    var pos = env.findOne({_id: 'pos'}).value
    return current[pos] || ' '
  }
})
Template.currentMobile.onRendered(function () {
  this.$('input').attr('tabindex', -1).focus().click()
})
Template.currentMobile.events({
  'blur input': function (event, template) {
    if (!$('textarea').length) {
      template.$('input').attr('tabindex', -1).focus().click()
    }
  },
  'keyup input': function (event, template) {
    if (event.key.length === 1) {
      return
    }
    var current = template.$('input').val()
    switch (event.key) {
      case 'ArrowUp':
        if (current) {
          after.push(current)
        }
        if (before.length) {
          current = before.pop()
          template.$('input').val(current)
        } else if (current) {
          current = ''
          template.$('input').val(current)
        }
        break
      case 'ArrowDown':
        if (current) {
          before.push(current)
        }
        if (after.length) {
          current = after.pop()
          template.$('input').val(current)
        } else if (current) {
          current = ''
          template.$('input').val(current)
        }
        break
      case 'Enter':
        if (current.trim()) {
          before.push(current)
          if (after.length) {
            after = []
          }
        }
        var CWD = env.findOne({_id: 'CWD'}).value

        lines.insert({text: template.$('input').parent().find('pre').text() + current})

        current = current.trim()

        env.update({_id: 'time'}, {$set: {value: (new Date() + '').match(/..:..:../)[0]}})

        if (current === '') {
          return
        }
        template.$('input').val('')

        current = current.match(/^([^ ]*) ?(.*)$/)

        if (localMethods[current[1]]) {
          var response = localMethods[current[1]](current[2], CWD) || {}
          response.lines = response.lines || []
          response.lines.forEach(function (line) {
            lines.insert({text: line})
          })
          return
        }
        Meteor.call('command-' + current[1], current[2], CWD, function (error, response) {
          if (error) {
            console.log(error)
            if (error.error === 404) {
              lines.insert({text: current[1] + ' not found'})
              return
            }
            lines.insert({text: error.message})
            lines.insert({text: error.details})
            return
          }
          response.lines = response.lines || []
          response.lines.forEach(function (line) {
            lines.insert({text: line})
          })
        })
    }
  }
})
Template.current.onRendered(function () {
  this.$('input').attr('tabindex', -1).focus().click()
})
Template.current.events({
  'blur input': function (event, template) {
    if (!$('textarea').length) {
      template.$('input').attr('tabindex', -1).focus().click()
    }
  },
  'keyup input': function (event, template) {
    var current = env.findOne({_id: 'current'}).value
    var pos = env.findOne({_id: 'pos'}).value
    if (event.key.length === 1) {
      if (template.$('.cursor').hasClass('insert')) {
        env.update({_id: 'current'}, {$set: {value: current.slice(0, pos) + event.key + current.slice(pos)}})
        env.update({_id: 'pos'}, {$inc: {value: 1}})
      } else {
        env.update({_id: 'current'}, {$set: {value: current.slice(0, pos) + event.key + current.slice(pos + 1)}})
        env.update({_id: 'pos'}, {$inc: {value: 1}})
      }
      return
    }
    switch (event.key) {
      case 'Backspace':
        if (pos > 0) {
          env.update({_id: 'current'}, {$set: {value: current.slice(0, pos - 1) + current.slice(pos)}})
          env.update({_id: 'pos'}, {$inc: {value: -1}})
        }
        break
      case 'Delete':
        env.update({_id: 'current'}, {$set: {value: current.slice(0, pos) + current.slice(pos + 1)}})
        break
      case 'ArrowLeft':
        if (pos > 0) {
          env.update({_id: 'pos'}, {$inc: {value: -1}})
        }
        break
      case 'ArrowRight':
        if (pos < current.length) {
          env.update({_id: 'pos'}, {$inc: {value: +1}})
        }
        break
      case 'ArrowUp':
        if (current) {
          after.push(current)
        }
        if (before.length) {
          current = before.pop()
          env.update({_id: 'current'}, {$set: {value: current}})
        } else if (current) {
          current = ''
          env.update({_id: 'current'}, {$set: {value: ''}})
        }
        env.update({_id: 'pos'}, {$set: {value: current.length}})
        break
      case 'ArrowDown':
        if (current) {
          before.push(current)
        }
        if (after.length) {
          current = after.pop()
          env.update({_id: 'current'}, {$set: {value: current}})
        } else if (current) {
          current = ''
          env.update({_id: 'current'}, {$set: {value: ''}})
        }
        env.update({_id: 'pos'}, {$set: {value: current.length}})
        break
      case 'Insert':
        template.$('.cursor').toggleClass('insert')
        break
      case 'Enter':
        if (current.trim()) {
          before.push(current)
          if (after.length) {
            after = []
          }
        }
        var CWD = env.findOne({_id: 'CWD'}).value

        current = current.trim()
        lines.insert({text: template.$('.cursor').parent().parent().text()})

        if (current === '') {
          return
        }

        env.update({_id: 'current'}, {$set: {value: ''}})
        env.update({_id: 'pos'}, {$set: {value: 0}})
        current = current.match(/^([^ ]*) ?(.*)$/)

        if (localMethods[current[1]]) {
          var response = localMethods[current[1]](current[2], CWD) || {}
          response.lines = response.lines || []
          response.lines.forEach(function (line) {
            lines.insert({text: line})
          })
          return
        }
        Meteor.call('command-' + current[1], current[2], CWD, function (error, response) {
          if (error) {
            console.log(error)
            if (error.error === 404) {
              lines.insert({text: current[1] + ' not found'})
              return
            }
            lines.insert({text: error.message})
            lines.insert({text: error.details})
            return
          }
          response.lines = response.lines || []
          response.lines.forEach(function (line) {
            lines.insert({text: line})
          })
        })
    }
  }
})
