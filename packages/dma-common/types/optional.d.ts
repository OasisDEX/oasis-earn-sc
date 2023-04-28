export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
//# sourceMappingURL=optional.d.ts.map