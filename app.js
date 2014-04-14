var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });

var express = require('express');
    var app = express();
var async = require('async');

var mongoose = require('mongoose');
  var models = require('./models/main.js');
mongoose.connect('localhost', 'main');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.locals.pretty = true;
// app.use(express. favicon(__dirname + '/public/images/design/favicon.png'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir:__dirname + '/uploads' }));
app.use(express.methodOverride());
app.use(express.cookieParser());

app.use(express.session({
  key: 'cim.sess',
  secret: 'keyboard cat',
  cookie: {
    path: '/',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

app.use(express.static(__dirname + '/public'));
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});
app.use(app.router);


app.use(function(req, res, next) {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('error', { url: req.url, status: 404 });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
      res.send({
      error: {
        status: 'Not found'
      }
    });
    return;
  }

  // default to plain-text
  res.type('txt').send('Not found');
});

app.use(function(err, req, res, next) {
  var status = err.status || 500;

  res.status(status);
  res.render('error', { error: err, status: status });
});


// -------------------
// *** Model Block ***
// -------------------


var User = models.User;
var Member = models.Member;
var Event = models.Event;
var News = models.News;
var Press = models.Press;
var Partner = models.Partner;
var Photo = models.Photo;
var Schedule = models.Schedule;
var Project = models.Project;


// ------------------------
// *** Midleware Block ***
// ------------------------


function checkAuth (req, res, next) {
  if (req.session.user_id)
    next();
  else
    res.redirect('/login');
}


// ------------------------
// *** Handlers Block ***
// ------------------------


var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};


// ------------------------
// *** Post parms Block ***
// ------------------------


app.post('/edit', function (req, res) {
  var files = req.files;
  var name = files.mf_file_undefined.path.slice(33);
  var newPath = __dirname + '/public/preview/' + name;
  gm(files.mf_file_undefined.path).resize(1120, false).quality(60).noProfile().write(newPath, function() {
    var path = {'path':'/preview/' + name}
    res.send(path);
  });
});


// ------------------------
// *** Main Block ***
// ------------------------


app.get('/', function(req, res) {
  res.render('index');
});


// ------------------------
// *** Auth Block ***
// ------------------------


app.get('/auth', checkAuth, function (req, res) {
  res.render('auth');
});


// ------------------------
// *** Add Event Block ***
// ------------------------


app.get('/auth/add/event', photoStream, checkAuth, function (req, res) {
  Member.find(function(err, members) {
    res.render('auth/add/event.jade', {members: members});
  });
});

app.post('/auth/add/event', function(req, res) {
  var post = req.body;
  var files = req.files;
  var event = new Event();

  event.ru.title = post.ru.title;
  event.ru.s_title = post.ru.s_title;
  event.ru.body = post.ru.body;
  event.ru.ticket = post.ru.ticket;
  event.ru.comment = post.ru.comment;
  event.ru.p_author = post.ru.p_author;

  if (post.en) {
    event.en.title = post.en.title;
    event.en.s_title = post.en.s_title;
    event.en.body = post.en.body;
    event.en.ticket = post.en.ticket;
    event.en.comment = post.en.comment;
    event.en.p_author = post.en.p_author;
  };

  event.category = post.category;
  event.hall = post.hall;
  event.age = post.age;
  event.members = post.members;
  event.duration = post.duration;
  event.meta.columns = post.columns;

  if (post.img != 'null') {
    fs.mkdir(__dirname + '/public/images/events/' + event._id, function() {
      var newPath = __dirname + '/public/images/events/' + event._id + '/photo.jpg';
      gm(__dirname + '/public' + post.img).write(newPath, function() {
        event.photo = '/images/events/' + event._id + '/photo.jpg';
        fs.unlink(__dirname + '/public' + post.img);
        event.save(function() {
          res.redirect('back');
        });
      });
    });
  }
  else {
    event.save(function(err, event) {
      res.redirect('back');
    });
  }
});


// ------------------------
// *** Edit Events Block ***
// ------------------------


app.get('/auth/edit/events', checkAuth, function (req, res) {
  Event.find().sort('-date').exec(function(err, events) {
    res.render('auth/edit/events', {events: events});
  });
});

app.get('/auth/edit/events/:id', checkAuth, photoStream, function (req, res) {
  var id = req.params.id;

  Event.find({'_id':id}).populate('members.m_id').exec(function(err, event) {
    if (!event) return next(err);
    Member.find().exec(function(err, members) {
      res.render('auth/edit/events/event.jade', {event: event[0], members: members});
    });
  });
});

app.post('/rm_event', function (req, res) {
  var id = req.body.id;

  Project.update({'events.event':id}, { $pull: { 'events': { event: id } } }, { multi: true }).exec(function() {
    Schedule.update({'events.event':id}, { $pull: { 'events': { event: id } } }, { multi: true }).exec(function() {
      Event.findByIdAndRemove(id, function() {
        deleteFolderRecursive(__dirname + '/public/images/events/' + id);
        res.send('ok');
      });
    });
  });
});

app.post('/auth/edit/events/:id', function (req, res, next) {
  var id = req.params.id;
  var post = req.body;
  var files = req.files;

  Event.findById(id, function(err, event) {

    event.category = post.category;
    event.members = post.members;
    event.hall = post.hall;
    event.age = post.age;
    event.duration = post.duration;
    event.meta.columns = post.columns;

    if (post.ru) {
      event.ru.title = post.ru.title;
      event.ru.s_title = post.ru.s_title;
      event.ru.body = post.ru.body;
      event.ru.ticket = post.ru.ticket;
      event.ru.comment = post.ru.comment;
      event.ru.p_author = post.ru.p_author;
    }

    if (post.en) {
      event.en.title = post.en.title;
      event.en.s_title = post.en.s_title;
      event.en.body = post.en.body;
      event.en.ticket = post.en.ticket;
      event.en.comment = post.en.comment;
      event.en.p_author = post.en.p_author;
    }

    if (post.img != 'null') {
      fs.mkdir(__dirname + '/public/images/events/' + event._id, function() {
        var newPath = __dirname + '/public/images/events/' + event._id + '/photo.jpg';
        gm(__dirname + '/public' + post.img).write(newPath, function() {
          event.photo = '/images/events/' + event._id + '/photo.jpg';
          fs.unlink(__dirname + '/public' + post.img);
          event.save(function() {
            res.send('ok_img');
          });
        });
      });
    }
    else {
      event.save(function(err, event) {
        res.send('ok')
      });
    }
  });
});


// ------------------------
// *** Add News Block ***
// ------------------------


app.get('/auth/add/news', checkAuth, function (req, res) {
  Event.find().sort('-date').exec(function(err, events){
    res.render('auth/add/news.jade', {events: events});
  });
});

app.post('/auth/add/news', function (req, res) {
  var post = req.body;
  var files = req.files;
  var news = new News();

  news.ru.title = post.ru.title;
  news.ru.s_title = post.ru.s_title;
  news.ru.body = post.ru.body;
  news.ru.p_author = post.ru.p_author;

  if (post.en) {
    news.en.title = post.en.title;
    news.en.s_title = post.en.s_title;
    news.en.body = post.en.body;
    news.en.p_author = post.en.p_author;
  };

  news.tag = post.tag;
  news.status = post.status;
  if (post.events != '')
    news.events = post.events;
  else
    news.events = [];

  async.parallel({
    photo: function(callback) {
      if (files.photo.size != 0) {
        fs.mkdir(__dirname + '/public/images/news/' + news._id, function() {
          var newPath = __dirname + '/public/images/news/' + news._id + '/photo.jpg';
          gm(files.photo.path).resize(1120, false).quality(60).noProfile().write(newPath, function() {
            news.photo = '/images/news/' + news._id + '/photo.jpg';
            fs.unlink(files.photo.path);
            callback(null, 1);
          });
        });
      }
      else {
        callback(null, 0);
        fs.unlink(files.photo.path);
      }
    },
    poster: function(callback) {
      if (files.poster.size != 0) {
        fs.mkdir(__dirname + '/public/images/news/' + news._id, function() {
          var newPath = __dirname + '/public/images/news/' + news._id + '/poster.jpg';
          gm(files.poster.path).resize(580, false).quality(60).noProfile().write(newPath, function() {
            news.poster = '/images/news/' + news._id + '/poster.jpg';
            fs.unlink(files.poster.path);
            callback(null, 2);
          });
        });
      }
      else {
        callback(null, 0);
        fs.unlink(files.poster.path);
      }
    }
  },
  function(err, results) {
    news.save(function(err) {
      res.redirect('back');
    });
  });
});


// ------------------------
// *** Edit News Block ***
// ------------------------


app.get('/auth/edit/news', checkAuth, function (req, res) {
  News.find().sort('-date').exec(function(err, news){
    res.render('auth/edit/news', {news: news});
  });
});

app.get('/auth/edit/news/:id', checkAuth, function (req, res) {
  var id = req.params.id;

  News.find({'_id': id}).populate('events').exec(function(err, news) {
    if (!news) return next(err);
    Event.find(function(err, events){
      res.render('auth/edit/news/e_news.jade', {news: news[0], events: events});
    });
  });
});

app.post('/rm_news', function (req, res) {
  var id = req.body.id;

  News.findByIdAndRemove(id, function() {
    deleteFolderRecursive(__dirname + '/public/images/news/' + id);
    res.send('ok');
  });
});

app.post('/auth/edit/news/:id', function (req, res) {
  var id = req.params.id;
  var post = req.body;
  var files = req.files;

  News.findById(id, function(err, news) {
    news.ru.title = post.ru.title;
    news.ru.s_title = post.ru.s_title;
    news.ru.body = post.ru.body;
    news.ru.p_author = post.ru.p_author;

    if (post.en) {
      news.en.title = post.en.title;
      news.en.s_title = post.en.s_title;
      news.en.body = post.en.body;
      news.en.p_author = post.en.p_author;
    }

    news.tag = post.tag;
    news.status = post.status;
    if (post.events != '')
      news.events = post.events;
    else
      news.events = [];

    async.parallel({
      photo: function(callback) {
        if (files.photo.size != 0) {
          fs.mkdir(__dirname + '/public/images/news/' + news._id, function() {
            var newPath = __dirname + '/public/images/news/' + news._id + '/photo.jpg';
            gm(files.photo.path).resize(1120, false).quality(60).noProfile().write(newPath, function() {
              news.photo = '/images/news/' + news._id + '/photo.jpg';
              fs.unlink(files.photo.path);
              callback(null, 1);
            });
          });
        }
        else {
          callback(null, 0);
          fs.unlink(files.photo.path);
        }
      },
      poster: function(callback) {
        if (files.poster.size != 0) {
          fs.mkdir(__dirname + '/public/images/news/' + news._id, function() {
            var newPath = __dirname + '/public/images/news/' + news._id + '/poster.jpg';
            gm(files.poster.path).resize(580, false).quality(60).noProfile().write(newPath, function() {
              news.poster = '/images/news/' + news._id + '/poster.jpg';
              fs.unlink(files.poster.path);
              callback(null, 2);
            });
          });
        }
        else {
          callback(null, 0);
          fs.unlink(files.poster.path);
        }
      }
    },
    function(err, results) {
      news.save(function(err) {
        res.redirect('/auth/edit/news');
      });
    });
  });
});



// ------------------------
// *** Add Member Block ***
// ------------------------


app.get('/auth/add/member', checkAuth, function (req, res) {
  res.render('auth/add/member.jade');
});

app.post('/auth/add/member', function (req, res) {
  var post = req.body;
  var files = req.files;
  var member = new Member();

  member.status = post.status;
  member.ru.name = post.ru.name;
  member.ru.description = post.ru.description;

  if (post.en) {
    member.en.name = post.en.name;
    member.en.description = post.en.description;
  }

  if (files.img.size != 0) {
    var newPath = __dirname + '/public/images/members/' + member._id + '.jpg';
    gm(files.img.path).resize(1120, false).quality(60).noProfile().write(newPath, function() {
      member.img = '/images/members/' + member._id + '.jpg';
      member.save(function() {
        fs.unlink(files.img.path);
        res.redirect('back');
      });
    });
  }
  else {
    member.save(function() {
      fs.unlink(files.img.path);
      res.redirect('back');
    });
  }
});


// ------------------------
// *** Edit Members Block ***
// ------------------------


app.get('/auth/edit/members', checkAuth, function (req, res) {
  Member.find().sort('-date').exec(function(err, members) {
    res.render('auth/edit/members', {members: members});
  });
});

app.get('/auth/edit/members/:id', checkAuth, function (req, res) {
  var id = req.params.id;

  Member.findById(id, function(err, member) {
    res.render('auth/edit/members/member.jade', {member: member});
  });
});

app.post('/rm_member', function (req, res) {
  var id = req.body.id;

  Event.update({'members.m_id':id}, { $pull: { 'members': { m_id: id } } }, { multi: true }).exec(function() {
    Member.findByIdAndRemove(id, function() {
      fs.unlink(__dirname + '/public/images/members/' + id + '.jpg', function() {
        res.send('ok');
      });
    });
  });
});

app.post('/auth/edit/members/:id', function (req, res) {
  var id = req.params.id;
  var post = req.body;
  var files = req.files;

  Member.findById(id, function(err, member) {
    member.ru.name = post.ru.name;
    member.ru.description = post.ru.description;

    if (post.en) {
      member.en.name = post.en.name;
      member.en.description = post.en.description;
    }

    if (files.img.size != 0) {
      var newPath = __dirname + '/public/images/members/' + member._id + '.jpg';
      gm(files.img.path).resize(1120, false).quality(60).noProfile().write(newPath, function() {
        member.img = '/images/members/' + member._id + '.jpg';
        member.save(function() {
          fs.unlink(files.img.path);
          res.redirect('/auth/edit/members');
        });
      });
    }
    else {
      member.save(function() {
        fs.unlink(files.img.path);
        res.redirect('/auth/edit/members');
      });
    }
  });
});


// ------------------------
// *** Login Block ***
// ------------------------


app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var post = req.body;

  User.findOne({ 'login': post.login, 'password': post.password }, function (err, person) {
    if (!person) return res.redirect('back');
    req.session.user_id = person._id;
    req.session.status = person.status;
    req.session.login = person.login;
    res.redirect('/auth');
  });
});


app.get('/logout', function (req, res) {
  delete req.session.user_id;
  delete req.session.login;
  delete req.session.status;
  res.redirect('back');
});


app.get('/registr', function(req, res) {
  if (!req.session.user_id)
    res.render('registr');
  else
    res.redirect('/');
});


app.post('/registr', function (req, res) {
  var post = req.body;

  var user = new User({
    login: post.login,
    password: post.password,
    email: post.email
  });

  user.save(function(err, user) {
    if(err) {throw err;}
    console.log('New User created');
    req.session.user_id = user._id;
    req.session.login = user.login;
    req.session.status = user.status;
    res.redirect('/login');
  });
});


// ------------------------
// *** Static Block ***
// ------------------------


app.get('/contacts', photoStream, function (req, res) {
  res.render('static/contacts.jade');
});

app.get('/sitemap.xml', function(req, res){
  res.sendfile('sitemap.xml',  {root: './public'});
});

app.get('/robots.txt', function(req, res){
  res.sendfile('robots.txt',  {root: './public'});
});


// ------------------------
// *** Other Block ***
// ------------------------


app.listen(3000);
console.log('http://127.0.0.1:3000')