export default interface Word{
  index: number
  word: string
  clean: string
  acceptable: string[]
  found_in_twitter: number //@todo refactor to boolean
}