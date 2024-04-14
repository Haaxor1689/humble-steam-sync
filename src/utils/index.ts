export const notUndef = <T extends unknown | undefined>(
	obj: T
): obj is Exclude<T, undefined> => !!obj;
