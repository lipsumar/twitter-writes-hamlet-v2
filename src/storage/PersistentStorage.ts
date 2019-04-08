import State from "../models/State";

export default interface PersistentStorage{
  init(): Promise<void>
  getState(): Promise<State>
}