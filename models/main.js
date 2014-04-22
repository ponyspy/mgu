var mongoose = require('mongoose'),
		i18nMongoose = require('mongoose-i18n'),
		Schema = mongoose.Schema;

var userSchema = new Schema({
   login: String,
password: String,
   email: String,
  status: {type: String, default: 'User'},
    date: {type: Date, default: Date.now},
});

var TestSchema = new Schema({
  title: {
    type: String,
    i18n: true
  },
  description: {
    type: String,
    i18n: true
  },
  comments: {
  	title: {
  		type: String,
  		i18n: true
  	}
  }
});

TestSchema.plugin(i18nMongoose, {languages: ['en', 'ru'], defaultLanguage: 'ru'});

module.exports.Test = mongoose.model('Test', TestSchema);

module.exports.User = mongoose.model('User', userSchema);