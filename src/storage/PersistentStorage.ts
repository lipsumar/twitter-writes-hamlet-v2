import State from "../models/State";
import Word from "../models/Word";

export default interface PersistentStorage{
  init(): Promise<void>
  getState(): Promise<State>
  saveState(state:State): Promise<State>
  getWordsFromIndex(fromIndex:number, wordCount: number): Promise<Word[]>
  getTweetsInRange(range:[number,number]):Promise<any[]>
  updateWord(wordIndex:number, obj:any):Promise<boolean>
}