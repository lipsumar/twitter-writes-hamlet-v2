import PersistentStorage from "./PersistentStorage";
import { MongoClient, Db, Collection } from 'mongodb'
import State from "../models/State";
import Word from "../models/Word";

export default class MongoStore implements PersistentStorage {

  client: MongoClient
  dbName: string;
  db?: Db;

  constructor(url: string, dbName: string) {
    this.client = new MongoClient(url, { useNewUrlParser: true })
    this.dbName = dbName
  }

  init(): Promise<void> {
    return this.client.connect().then(() => {
      console.log('connected to mongo!')
      this.db = this.client.db(this.dbName)
    })
  }

  getState(): Promise<State> {
    return this.collection('state').findOne({ _id: 1 }).then(state => {
      if (state === null) {
        throw new Error(`Can't load state from db: aborting. Did you seed the db ?`)
      }
      delete state._id
      return state as State;
    })
  }

  saveState(state: State) {
    return this.collection('state').updateOne({ _id: 1 }, { $set: state }).then(() => state)
  }

  getWordsFromIndex(fromIndex: number, wordCount: number): Promise<Word[]> {
    return this.collection('words')
      .find({ index: { $gte: fromIndex } })
      .limit(wordCount)
      .sort('index', 1)
      .toArray()
  }

  getTweetsInRange(range: [number, number]): Promise<any[]> {
    return this.collection('words')
      .find({
        index: {
          $gte: range[0],
          $lte: range[1]
        },
        found_in_twitter: 1
      })
      .sort('index', 1)
      .toArray()
  }

  updateWord(wordIndex: number, obj: any){
    return this.collection('words')
      .updateOne({index:wordIndex}, {$set: obj})
      .then(() => true)
  }

  private collection(name: string): Collection {
    return (<Db>this.db).collection(name)
  }
}