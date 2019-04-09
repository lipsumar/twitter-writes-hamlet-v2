import Twitter, { AccessTokenOptions } from 'twitter'
import EventEmitter from 'events'


export default class TwitterListener extends EventEmitter {
  client: Twitter
  track: string[] = []
  stream: any

  constructor(accessTokenOptions: AccessTokenOptions) {
    super()
    this.client = new Twitter(accessTokenOptions)
  }

  listenTo(track: string[]) {
    this.track = track
  }

  startListening() {
    this.stream = this.client.stream('statuses/filter', {
      track: this.track.join(','),
      language: 'en'
    })
    this.stream.on('data', (tweet: any) => this.emit('tweet', tweet))
    this.stream.on('error', (err: Error) => console.log('!!!!! Stream Error: ', err))
  }

  stopListening() {
    if (!this.stream) {
      return
    }
    this.stream.destroy()
    console.log('STOPPED -------')
  }

  search(q: string, since_id: string | null):Promise<{}[]> {
    return new Promise((resolve, reject) => {
      return this.client.get('search/tweets', {
        q,
        //lang: 'en',
        result_type: 'recent',
        since_id
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.statuses)
        }
      })
    })

  }
}