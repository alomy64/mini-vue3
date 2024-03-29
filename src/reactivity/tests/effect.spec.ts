import { isReactive, reactive } from "../reactive";
import { effect, stop } from "../effect";

describe("effect", () => {
  it("happy path", () => {
    let userReactive = reactive({ age: 1 });
    let userAge;

    effect(() => {
      userAge = userReactive.age + 1;
    });

    // get
    expect(userAge).toBe(2);

    // set
    userReactive.age++;
    expect(userAge).toBe(3);
  });

  it("调用 effect 返回 runner", () => {
    let count = 10;
    const runner = effect(() => {
      count++;
      return "Hello";
    });

    expect(count).toBe(11);

    const r = runner();

    expect(count).toBe(12);
    expect(r).toBe("Hello");
  });

  it("scheduler", () => {
    let count;
    let run;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ count: 10 });
    // 可以传入第二个参数，可包括 scheduler 的 fn
    const runner = effect(
      () => {
        count = obj.count;
      },
      { scheduler }
    );
    // effect 首次执行时，会执行 fn，但不会执行 scheduler
    expect(count).toBe(10);
    expect(scheduler).not.toHaveBeenCalled();

    // 响应式对象更新时，不会执行 fn，而是执行 scheduler
    obj.count++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(count).toBe(10);

    // 如果执行 runner 时，才会再次执行 fn
    run();
    expect(count).toBe(11);
  });

  it("stop", () => {
    let userReactive = reactive({ age: 1 });
    let userAge;

    const runner = effect(() => {
      userAge = userReactive.age;
    });

    userReactive.age = 2;
    expect(userAge).toBe(2);

    // 调用 stop 后，停止更新
    stop(runner);
    // userReactive.age = 3; // 只会触发 set
    userReactive.age++; // 不仅会触发 set, 还会触发 get, get 时会重新收集依赖
    expect(userAge).toBe(2);

    // 调用 runner 后，继续更新
    runner();
    expect(userAge).toBe(3);
  });

  it("onStop", () => {
    let userReactive = reactive({ age: 1 });
    let userAge;
    const onStop = jest.fn();

    const runner = effect(
      () => {
        userAge = userReactive.age;
      },
      { onStop }
    );

    // 调用 stop 之后，会执行一次 onStop
    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });

  // 嵌套响应式
  it('nested reactives', () => {
    let origin = {
      obj: { foo: 1 },
      array: [{ bar: 2 }],
    };
    const observed = reactive(origin)
    origin.obj.foo = 10;
    expect(isReactive(observed.obj)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
});
