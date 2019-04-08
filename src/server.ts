import express from 'express'
import TwitterWritesHamlet from './TwitterWritesHamlet'
import MongoStore from './storage/MongoStore'
import PersistentStorage from './storage/PersistentStorage';
import { Socket } from 'socket.io';

const PORT = process.env.PORT || 5000
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const store = new MongoStore('mongodb://mongo', 'twh')

loadTwhDependencies()
  .then(({store}) => {
    console.log('Initializing TWH...')
    const twh = new TwitterWritesHamlet(store)
    return twh.init().then(() => Promise.resolve(twh))
  })
  .then((twh: TwitterWritesHamlet) => {
    console.log('Setting up server...')

    app.get('/ping', (req, res) => {
      res.send('pong')
    })

    app.get('/state', (req, res) => {
      res.send(twh.getState())
    })

    io.on('connection', (socket: Socket) => {
      console.log('a user connected')
      socket.emit('state', twh.getState())
    })

    http.listen(PORT, () => {
      console.log(`Running on http://localhost:${PORT}`)
    })
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


