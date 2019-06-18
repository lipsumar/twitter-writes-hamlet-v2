import PersistentStorage from "./storage/PersistentStorage";
import State from "./models/State";
import TwitterListener from "./twitter-listenerr/TwitterListener";
import Word from "./models/Word";
import chalk from 'chalk'
import fs from 'fs'
import {EventEmitter} from 'events'

const INITIAL_SEARCH_TIMEOUT = 5000
const MAX_SEARCH_TIMEOUT = 20000
const DONT_TRACK = 'there,your,most,have,this,good,them,sick,thanks,much,think,again'.split(',')
// weird to look for: 
// - appear'd
// @todo track/accept all acceptables

const htmlPieceIndex = require('../html-pieces/htmlPieceIndex.json')

class TwitterWritesHamlet extends EventEmitter {

  store: PersistentStorage
  twitterListener: TwitterListener
  state: State = new State
  currentWord?: Word;
  currentWordRegex?: RegExp;
  ignoredTweetCount: number = 0;
  pause: boolean = false;
  lastTweet?: any;
  searchTimeout: number;
  currentlyTrackedWords?: Word[]

  constructor(store: PersistentStorage, twitterListener: TwitterListener) {
    super()
    this.store = store
    this.twitterListener = twitterListener
    this.twitterListener.on('tweet', this.processTweet.bind(this))
    this.searchTimeout = INITIAL_SEARCH_TIMEOUT
  }

  init() {
    return this.loadState()
  }

  start() {
    this.setCurrentWord()
  }

  private renewWordListening() {
    this.twitterListener.stopListening()
    /*this.getNextWords(10).then(words => {

      const trackWords = words.filter(w => this.canBeTracked(w))
      this.currentlyTrackedWords = trackWords

      console.log(chalk.magenta('Start listening'), trackWords.map(w => w.clean))
      this.twitterListener.listenTo(trackWords.map(w => w.clean)) // @todo also include acceptables
      this.twitterListener.startListening()

    })*/
  }

  private canBeTracked(word: Word): boolean {
    return word.clean.length > 4 && !DONT_TRACK.includes(word.clean)
  }

  private setCurrentWord() {
    this.getNextWords(1)
      .then(([word]) => {
        //console.log(word)
        console.log(`👁  Looking for "${word.clean}" #${word.index}`)
        this.currentWord = word
        this.currentWordRegex = new RegExp('([^a-z]|^)' + this.currentWord.clean + '([^a-z]|$)', 'mi');

        if (!this.canBeTracked(word)) {
          // word can't possibly be tracked, force a search almost immediatly 
          // but still leave a little time since short words 
          // often appear in the stream anyway
          this.setTimeoutForWord(word, true, 1000)
        } else {
          if (!this.wordIsTracked(word)) {
            this.renewWordListening()
          }
          this.setTimeoutForWord(word, true)
        }
      })
  }

  setTimeoutForWord(word: Word, resetExponentionalBackoff: boolean = false, force: number | undefined = undefined) {
    if (resetExponentionalBackoff) {
      this.searchTimeout = INITIAL_SEARCH_TIMEOUT
    }

    setTimeout(() => {
      if (!this.currentWord) return
      if (this.currentWord.index === word.index) {
        this.searchForWord(word)
        this.setTimeoutForWord(word)
      }
    }, typeof force !== 'undefined' ? force : this.searchTimeout)

    if (typeof force !== 'undefined') return

    this.searchTimeout = this.searchTimeout * 2
    if (this.searchTimeout > MAX_SEARCH_TIMEOUT) {
      this.searchTimeout = MAX_SEARCH_TIMEOUT
    }
  }

  searchForWord(word: Word) {
    console.log(`🔎 SEARCH for "${word.clean}"`)
    this.twitterListener.search(word.clean, this.lastTweet ? this.lastTweet.id_str : null).then(tweets => {
      tweets.reverse().forEach(this.processTweet.bind(this))
    })
  }

  getNextWords(limit: number = 50) {
    return this.store.getWordsFromIndex(this.state.currentWordIndex, limit)
  }

  private nextWord() {
    //console.log(`nextWord() | ${this.state.currentWordIndex} -> ${this.state.currentWordIndex + 1}`)
    this.state.currentWordIndex = this.state.currentWordIndex + 1
    return this.store.saveState(this.state)
      .then(() => this.setCurrentWord())
  }

  private processTweet(tweet: any) {
    if (this.pause || !this.currentWord) {
      return
    }
    if (tweet.retweeted_status) {
      return
    }
    if (this.lastTweet && tweet.id_str < this.lastTweet.id_str) {
      return
    }
    const text = this.getTweetText(tweet)

    if (!text) {
      console.log(chalk.yellow(JSON.stringify(tweet)))
      return
    }


    const match = text.match(this.currentWordRegex)
    if (match) {
      console.log(`🕵️‍  Found "${this.currentWord.clean}" !\n   [${chalk.cyan(tweet.created_at)}] ${this.centerTextOn(text, this.currentWord.clean)}`)
      this.pause = true
      const tweetRecord = this.getTweetRecord(tweet, this.currentWord, match)
      this.recordTweet(tweet, tweetRecord, this.state.currentWordIndex)
        .then(() => {
          this.emit('tweet', tweetRecord)
          return this.nextWord()
        })
        .then(() => {
          this.pause = false
        })
    } else {
      this.ignoredTweetCount++
      if (this.ignoredTweetCount % 100 === 0) {
        console.log(chalk.blue(`Ignored tweets: ${this.ignoredTweetCount}`))
      }
    }
  }

  getTweetRecord(tweet: any, currentWord: Word, matched: any){
    const tweetText = this.getTweetText(tweet)
    const smallTweet = {
      tweetText: tweetText,
      screen_name: tweet.user.screen_name,
      word: currentWord.word,
      clean: currentWord.clean,
      charAt: tweetText[matched.index].toLowerCase() === currentWord.clean[0].toLowerCase() ? matched.index : matched.index+1,
      id: tweet.id,
      profile_image_url: tweet.user.profile_image_url,
      date: (new Date()).toString(),
      index: currentWord.index,
      found_in_twitter: 1,
      currentWordCount: this.state.currentWordIndex + 1
    };
    return smallTweet
  }

  private recordTweet(tweet: any, tweetRecord:any, wordIndex:number) {
    this.lastTweet = tweet
    return this.store.updateWord(wordIndex, tweetRecord)
  }

  private wordIsTracked(word: Word): boolean {
    if (!this.currentlyTrackedWords) return false
    return this.currentlyTrackedWords.findIndex(w => w.index === word.index) > -1
  }

  private getTweetText(tweet: any) {
    return tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text
  }

  private loadState(): Promise<void> {
    return this.store.getState().then(state => {
      this.state = state
      console.log('Loaded state:', state)
    })
  }

  getState() {
    return {
      ...this.state,
      currentWordCount: this.state.currentWordIndex + 1,
      currentWord: this.currentWord ? this.currentWord.clean : null,
      htmlPieces: this.getHtmlPieces()
    }
    //currentWord: currentWord,
    //currentWordCount: currentWordCount
  }

  getHtmlPieces() {
    var htmlPieces = [];
    for (var i = 0; i < htmlPieceIndex.length; i++) {
      if (htmlPieceIndex[i] > this.state.currentWordIndex) {
        if (typeof htmlPieceIndex[i - 2] !== 'undefined') {
          htmlPieces.push({
            html: fs.readFileSync( __dirname + '/../html-pieces/htmlPiece-' + htmlPieceIndex[i - 2]).toString(),
            index: htmlPieceIndex[i - 2]
          });
        }
        if (typeof htmlPieceIndex[i - 1] !== 'undefined') {
          htmlPieces.push({
            html: fs.readFileSync(__dirname + '/../html-pieces/htmlPiece-' + htmlPieceIndex[i - 1]).toString(),
            index: htmlPieceIndex[i - 1]
          });
        }
        htmlPieces.push({
          html: fs.readFileSync(__dirname + '/../html-pieces/htmlPiece-'+ htmlPieceIndex[i]).toString(),
          index: htmlPieceIndex[i]
        });

        break;
      }
    }
    return htmlPieces
  }

  getTweetsInRange(range: [number,number]):Promise<any[]>{
    return this.store.getTweetsInRange(range)
  }

  centerTextOn(text: string, needle: string) {
    const index = text.toLowerCase().indexOf(needle.toLowerCase())
    if (index < 0) return text

    let centered = '···' + text.substring(
      Math.max(index - 20, 0),
      Math.min(index + needle.length + 20, text.length - 1)
    ) + '···'
    centered = centered.replace(/\n/, '\\n')
    return centered
  }
}

export default TwitterWritesHamlet