const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config()

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));

const userSchema = new Schema({
  username: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

const exerciseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, default: new Date().toISOString().split('T')[0] }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  const user = new User({username: req.body.username});
  user.save((err, data) => {
    if (err) return res.json({error: err});
    res.json(data);
  });
});

app.get('/api/exercise/users', (req, res) => {
  const users = User.find({}, (err, data) => {
    if (!users) {
      return res.json({error: ''});
    }
    res.json(data);
  });
});


app.post('/api/exercise/add', (req, res) => {

  if (!req.body.userId) {
    return;
  }

  User.findById(req.body.userId, (err, user) => {
    if (err) return res.json({error: err});
    const exercise = new Exercise({
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration
    });
    
    if (req.body.date) {
      exercise.date = new Date(req.body.date).toISOString().split('T')[0];
    }

    exercise.save((err, data) => {
      if (err) return res.json({error: err});
      res.json({ username: user.username, date: new Date(data.date).toDateString(), description: data.description, duration: data.duration, _id: user.id });
    });
  });

  

  
});

app.get('/api/exercise/log', (req, res) => {
  const exercises = Exercise
  .find({userId: req.query.userId})
  .limit(req.query.limit ? parseInt(req.query.limit) : null)

  if (req.query.from) {
    exercises.where('date').gte(new Date(req.query.from).toISOString().split('T')[0]);
  }

  if (req.query.to) {
    exercises.where('date').lte(new Date(req.query.to).toISOString().split('T')[0]);
  }
  exercises.exec((err, data) => {
    if (err) return res.json({error: err});
    res.json({log: data, count: data.length});
  });
  
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
