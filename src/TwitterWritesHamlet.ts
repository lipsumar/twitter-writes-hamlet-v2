import PersistentStorage from "./storage/PersistentStorage";
import State from "./models/State";

class TwitterWritesHamlet {

  store: PersistentStorage
  state: State = new State

  constructor(store: PersistentStorage) {
    this.store = store
  }

  init() {
    return this.loadState()
  }

  loadState():Promise<void> {
    return this.store.getState().then(state => {
      this.state = state
      console.log('Loaded state:', state)
    })
  }

  getState() {
    return {...this.state}
  }

}

export default TwitterWritesHamlet