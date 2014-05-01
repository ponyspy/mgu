var mongoose = require('mongoose'),
		i18nMongoose = require('mongoose-i18n'),
		Schema = mongoose.Schema;

var userSchema = new Schema({
		login: String,
		password: String,
		email: String,
		status: {type: String, default: 'User'},
		exercises: [{
			exercise: { type: Schema.Types.ObjectId, ref: 'Exercise' },
			status: Boolean
		}],
		date: {type: Date, default: Date.now},
});

var courseSchema = new Schema({
		title: String,
		description: String,
		lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
		date: {type: Date, default: Date.now},
});

var lessonSchema = new Schema({
		title: String,
		description: String,
		blocks: [{ type: Schema.Types.ObjectId, ref: 'Block' }],
		date: {type: Date, default: Date.now},
});

var blockSchema = new Schema({
		stat: Boolean,
		title: String,
		description: String,
		vocabulary: [String],
		exercises: [{
			title: String,
			main: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
			second: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }]
		}],
		static_content: [{
			title: String,
			content: [String]
		}],
		test: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
		date: {type: Date, default: Date.now},
});

var exerciseSchema = new Schema({
		type: {type: String, default: 'Base'},
		task: String,
		answer: Schema.Types.Mixed,
		text: String,
		words: [String],
		images: [String],
		audio: [String],
		video: [{
			path: String,
			subs: [String]
		}],
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
module.exports.Course = mongoose.model('Course', courseSchema);
module.exports.Lesson = mongoose.model('Lesson', lessonSchema);
module.exports.Block = mongoose.model('Block', blockSchema);
module.exports.Exercise = mongoose.model('Exercise', exerciseSchema);