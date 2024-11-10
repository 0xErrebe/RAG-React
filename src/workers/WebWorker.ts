export default class WebWorker {
  constructor(workerPath: string) {
    return new Worker(
      new URL(workerPath, import.meta.url),
      { type: 'module' }
    )
  }
}
