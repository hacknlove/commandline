lines = new Mongo.Collection(null)
env = new Mongo.Collection(null)
before = []
after = []

env.insert({_id: 'CWD', value: '/'})
env.insert({_id: 'user', value: 'guest'})
env.insert({_id: 'server', value: 'hacknlove'})
env.insert({_id: 'current', value: '', private: true})
env.insert({_id: 'pos', value: 0, private: true})
env.insert({_id: 'time', value: (new Date() + '').match(/..:..:../)[0], private: true})
