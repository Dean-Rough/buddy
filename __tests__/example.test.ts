describe('Example Test Setup', () => {
  test('should demonstrate standard Jest matchers', () => {
    const array = [1, 2, 3, 4, 5];
    const obj = { name: 'test', active: true };
    const str = 'Hello World';

    // Standard array matchers
    expect(array).toContain(1);
    expect(array).toEqual([1, 2, 3, 4, 5]);
    expect(array.length).toBeGreaterThan(3);

    // Standard object matchers
    expect(obj).toHaveProperty('name');
    expect(obj).toHaveProperty('name', 'test');
    expect(obj.active).toBe(true);

    // Standard string matchers
    expect(str).toMatch(/^Hello/);
    expect(str).toMatch(/World$/);
    expect(str).toContain('lo Wo');

    // Standard boolean matchers
    expect(obj.active).toBeTruthy();
    expect(false).toBeFalsy();

    // Standard number matchers
    expect(3.14159).toBeCloseTo(3.14, 2);
    expect(5).toBeGreaterThanOrEqual(1);
    expect(5).toBeLessThanOrEqual(10);
  });

  test('should test async behavior', async () => {
    const promise = Promise.resolve('success');

    await expect(promise).resolves.toBe('success');
    expect(promise).toBeInstanceOf(Promise);
  });

  test('should test error handling', () => {
    const throwError = () => {
      throw new Error('Test error');
    };

    expect(throwError).toThrow('Test error');
    expect(throwError).toThrow(Error);
  });

  test('should test console-log-level integration', () => {
    const level = require('console-log-level');
    const options = { level: 'info' };
    const logger = level(options);

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });
});
