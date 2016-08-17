
var subscription
var computation
FlowRouter.route('/:path*', {
  triggersEnter: function (context) {
    env.upsert({_id: 'CWD'}, {$set: {value: context.path}})

    subscription = Meteor.subscribe('path', context.path)

    computation = Tracker.autorun(function (computation) {
      console.log('do')
      console.log(subscription.ready())
      if (!subscription.ready()) {
        return
      }
      console.log('re')
      var text = paths.findOne({_id: context.path}, {fields: {text: 1}})
      if (text.text) {
        lines.insert({text: text.text})
      }
    })
  },
  triggersLeave: function (context) {
    subscription.stop()
    computation.stop()
  }
})
