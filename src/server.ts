require('dotenv').config()
import express from 'express'
import TwitterWritesHamlet from './TwitterWritesHamlet'
import MongoStore from './storage/MongoStore'
import PersistentStorage from './storage/PersistentStorage';
import { Socket } from 'socket.io';
import TwitterListener from './twitter-listenerr/TwitterListener';

const PORT = process.env.PORT || 5000
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const store = new MongoStore('mongodb://mongo', 'twh')
const twitterListener = new TwitterListener({
  consumer_key: process.env.TWITTER_CONSUMER_KEY || '',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET || '',
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY || '',
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
});

loadTwhDependencies()
  .then(({store}) => {
    console.log('Initializing TWH...')
    const twh = new TwitterWritesHamlet(store, twitterListener)
    return twh.init().then(() => Promise.resolve(twh))
  })
  .then((twh: TwitterWritesHamlet) => {
    console.log('Setting up server...')


    app.use(express.static(__dirname + '/../public'))
    app.get('/ping', (req, res) => res.send('pong'))
    app.get('/state', (req, res) => res.send(twh.getState()))
    app.get('/tweets/range/:range', (req, res) => {
      const range = req.params.range.split(',').map((i:string) => parseInt(i, 10))
      twh.getTweetsInRange(range).then(tweets => {
        res.send({tweets})
      })
    })

    io.on('connection', (socket: Socket) => {
      console.log('a user connected')
      socket.emit('state', twh.getState())
    })

    twh.on('tweet', tweet => {
      io.emit('word', tweet)
    })

    http.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`))

    twh.start()
  })
  .catch(err => {
    console.log(`Unhandled error: ${err.message}`)
    console.log(err)
    process.exit(1)
  })


function loadTwhDependencies(): Promise<{store: PersistentStorage}> {
  console.log('load deps...');
  
  return Promise.all([
    store.init()
  ])
  .then(() => {
    console.log('...deps loaded');
    
  })
  .then(() => ({store}))
}


