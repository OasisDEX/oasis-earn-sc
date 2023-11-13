import { AnyObject, ObjectSchema } from 'yup';

import { Enviroment } from '../logic/common/enviroment';

type getObjectSchema<T extends ObjectSchema<AnyObject>> =
  T extends ObjectSchema<infer U> ? U : never;

export interface Command<
  S extends ObjectSchema<AnyObject> = ObjectSchema<AnyObject>,
> {
  name: string;
  description: string;
  run(args: getObjectSchema<S>, enviroment: Enviroment): Promise<void>;
  args: S;
}
