const context = [];
const proxyMap = new WeakMap();

function createReactiveObject(target) {
  // target already has corresponding Proxy
  const existingProxy = proxyMap.get(target);

  if (existingProxy) {
    return existingProxy;
  }

  console.log("Creating reactive object for:", target);

  const proxy = new Proxy(target, {
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);

      conssole.log(target);

      // Notify observers
      context.forEach((observer) => {
        observer(target);
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
  console.log("Initializing state with value:", value);

  isPrimtive(value) || (value = createReactiveObject(value));

  return {
    get value() {
      const observer = context[context.length - 1];

      console.log("Accessing state value:", value, "with observer:", observer);

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
        observer(value);
      });
    },
  };
}

export function watchEffect(effect, immediate = false) {
  function runEffect() {
    context.push(effect);

    if (immediate) effect();
  }

  runEffect();
}
