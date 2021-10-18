class SharedObserver {
  #sharedResizeObserver;
  #callbacks = new WeakMap();
  static #something;

  fn = () => {};

  constructor() {
    const ResizeObserver = safeWindow.ResizeObserver ?? ResizeObserverPolyfill;
    this.#sharedResizeObserver = new ResizeObserver(
      this.updateResizedElements.bind(this)
    );
  }

  test() {
    this.#sharedResizeObserver = new ResizeObserver(
      this.updateResizedElements.bind(this)
    );
    return true;
  }
  
  #privateMethod() {
    return 'hello world';
  }
}
