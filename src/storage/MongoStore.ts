import PersistentStorage from "./PersistentStorage";
import {MongoClient, Db, Collection} from 'mongodb'
import State from "../models/State";

export default class MongoStore implements PersistentStorage {
  
  client: MongoClient
  dbName: string;
  db?: Db;
  
  constructor(url: string, dbName: string){
    this.client = new MongoClient(url, {useNewUrlParser: true})
    this.dbName = dbName
  }

  init(): Promise<void> {
    return this.client.connect().then(() => {
      console.log('connected to mongo!')
      this.db = this.client.db(this.dbName)
    })
  }

  getState(): Promise<State> {
    return this.collection('state').findOne({_id: 1}).then(state => {
      if(state === null){
        throw new Error(`Can't load state from db: aborting. Did you seed the db ?`)
      }
      delete state._id
      return state as State;
    })
  }

  collection(name:string):Collection{
    return (<Db>this.db).collection(name)
  }
}