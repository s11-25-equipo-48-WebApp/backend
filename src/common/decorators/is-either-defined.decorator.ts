import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsEitherDefinedConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [property1, property2] = args.constraints;
    const object = args.object as any;
    return (object[property1] !== undefined && object[property1] !== null) || (object[property2] !== undefined && object[property2] !== null);
  }

  defaultMessage(args: ValidationArguments) {
    const [property1, property2] = args.constraints;
    return `Debe proporcionar al menos uno de los campos: ${property1} o ${property2}`;
  }
}

export function IsEitherDefined(property1: string, property2: string, validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property1, property2],
      validator: IsEitherDefinedConstraint,
    });
  };
}
