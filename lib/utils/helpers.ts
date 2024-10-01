export const isFalsy = (value: string | boolean | number): boolean => {
  return ["false", "off", "0", false, 0].includes(value);
};

export const isTruthy = (value: string | boolean | number): boolean => {
  return ["true", "on", "1", true, 1].includes(value);
};

export const toBoolean = (value: string | boolean | number): boolean => {
  return isTruthy(value);
};
