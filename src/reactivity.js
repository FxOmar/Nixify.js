const context = [];
const proxyMap = new WeakMap();

function createReactiveObject(target) {
  // target already has corresponding Proxy
  const existingProxy = proxyMap.get(target);

  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, {
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);

      // Notify observers
      context.forEach((observer) => {
        observer();
      });

      return result;
    },
    get(target, key, receiver) {
      return Reflect.get(target, key, receiver);
    },
  });

  proxyMap.set(target, proxy);

  return proxy;
}

function isPrimtive(value) {
  return value === null || typeof value !== "object";
}

export function $state(value) {
  const subscriptions = new Set();

  isPrimtive(value) || (value = createReactiveObject(value));

  return {
    get value() {
      console.log("Getting value:", value);
      const observer = context[context.length - 1];

      if (observer) {
        subscriptions.add(observer);

        observer.cleanup = () => {
          subscriptions.delete(observer);
        };
      }

      return value;
    },
    set value(v) {
      value = v;

      subscriptions.forEach((observer) => {
        console.log("Notifying observer:", observer);

        observer();
      });
    },
  };
}

export function watchEffect(effect, immediate = false) {
  function runEffect() {
    context.push(effect);

    if (immediate) effect();

    // context.pop();
  }

  runEffect();
}
